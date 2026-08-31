"""
Wallet engine.

Every balance mutation goes through this module, inside transaction.atomic() with
select_for_update() row locks. Nothing outside this file should ever write to
Wallet.balance directly.
"""

import logging
from decimal import Decimal

from django.db import IntegrityError, transaction

from .models import Bet, GameRound, User, Wallet, WalletTransaction

logger = logging.getLogger("aviator.wallet")


class InsufficientBalance(Exception):
    pass


class InvalidBetState(Exception):
    pass


class DuplicateRequest(Exception):
    """Raised when a request_id has already been processed (idempotency)."""


class WalletService:

    # --------------------------------------------------------------
    # Wallet lifecycle
    # --------------------------------------------------------------
    @staticmethod
    def get_or_create_wallet(user: User) -> Wallet:
        wallet, _ = Wallet.objects.get_or_create(user=user)
        return wallet

    # --------------------------------------------------------------
    # Deposits / withdrawals
    # --------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def deposit(user: User, amount: Decimal, reference: str) -> Wallet:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")

        wallet = Wallet.objects.select_for_update().get(user=user)
        wallet.balance += amount
        wallet.save(update_fields=["balance", "updated_at"])

        WalletTransaction.objects.create(
            wallet=wallet,
            user=user,
            tx_type=WalletTransaction.TxType.DEPOSIT,
            amount=amount,
            balance_after=wallet.balance,
            reference=reference,
        )
        return wallet

    @staticmethod
    @transaction.atomic
    def withdraw(user: User, amount: Decimal, reference: str) -> Wallet:
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")

        wallet = Wallet.objects.select_for_update().get(user=user)
        if wallet.balance < amount:
            raise InsufficientBalance("Insufficient balance for withdrawal")

        wallet.balance -= amount
        wallet.save(update_fields=["balance", "updated_at"])

        WalletTransaction.objects.create(
            wallet=wallet,
            user=user,
            tx_type=WalletTransaction.TxType.WITHDRAWAL,
            amount=-amount,
            balance_after=wallet.balance,
            reference=reference,
        )
        return wallet

    # --------------------------------------------------------------
    # Betting
    # --------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def place_bet(user: User, round_obj: GameRound, amount: Decimal, request_id: str,
                  auto_cashout_multiplier: Decimal | None = None) -> Bet:
        # Idempotency: if this request_id was already processed, return the existing bet
        # instead of placing a duplicate one.
        existing = Bet.objects.filter(request_id=request_id).first()
        if existing:
            return existing

        # Lock the round row to make sure BETTING_OPEN status can't flip mid-transaction.
        round_locked = GameRound.objects.select_for_update().get(pk=round_obj.pk)
        if round_locked.status != GameRound.Status.BETTING_OPEN:
            raise InvalidBetState("Betting is closed for this round")

        wallet = Wallet.objects.select_for_update().get(user=user)
        if wallet.balance < amount:
            raise InsufficientBalance("Insufficient balance to place bet")

        wallet.balance -= amount
        wallet.save(update_fields=["balance", "updated_at"])

        try:
            bet = Bet.objects.create(
                user=user,
                round=round_locked,
                amount=amount,
                status=Bet.Status.ACTIVE,
                auto_cashout_multiplier=auto_cashout_multiplier,
                request_id=request_id,
            )
        except IntegrityError as exc:
            # Race: another request with the same request_id slipped in concurrently.
            raise DuplicateRequest(str(exc)) from exc

        WalletTransaction.objects.create(
            wallet=wallet,
            user=user,
            tx_type=WalletTransaction.TxType.BET,
            amount=-amount,
            balance_after=wallet.balance,
            reference=round_locked.round_id,
            bet=bet,
        )
        return bet

    @staticmethod
    @transaction.atomic
    def cashout(user: User, bet_id, current_multiplier: Decimal, request_id: str) -> Bet:
        existing = Bet.objects.filter(cashout_request_id=request_id).first()
        if existing:
            return existing

        bet = Bet.objects.select_for_update().select_related("round").get(pk=bet_id, user=user)

        if bet.status != Bet.Status.ACTIVE:
            raise InvalidBetState(f"Bet is not active (status={bet.status})")

        round_locked = GameRound.objects.select_for_update().get(pk=bet.round_id)
        if round_locked.status != GameRound.Status.RUNNING:
            raise InvalidBetState("Round is not running; cash-out window has closed")

        # Never trust a client-supplied multiplier: cap at the round's fixed crash point.
        multiplier = min(current_multiplier, round_locked.crash_multiplier)
        if multiplier < Decimal("1.00"):
            raise InvalidBetState("Invalid multiplier")

        payout = (bet.amount * multiplier).quantize(Decimal("0.01"))

        bet.status = Bet.Status.CASHED_OUT
        bet.cashout_multiplier = multiplier
        bet.payout = payout
        bet.cashout_request_id = request_id
        from django.utils import timezone
        bet.cashed_out_at = timezone.now()

        try:
            bet.save(update_fields=[
                "status", "cashout_multiplier", "payout",
                "cashout_request_id", "cashed_out_at", "updated_at",
            ])
        except IntegrityError as exc:
            raise DuplicateRequest(str(exc)) from exc

        wallet = Wallet.objects.select_for_update().get(user=user)
        wallet.balance += payout
        wallet.save(update_fields=["balance", "updated_at"])

        WalletTransaction.objects.create(
            wallet=wallet,
            user=user,
            tx_type=WalletTransaction.TxType.WIN,
            amount=payout,
            balance_after=wallet.balance,
            reference=round_locked.round_id,
            bet=bet,
        )
        return bet

    # --------------------------------------------------------------
    # Settlement (called by the game engine after a round crashes)
    # --------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def settle_round(round_obj: GameRound):
        """
        Mark every still-ACTIVE bet on this round as LOST. The stake was already
        deducted when the bet was placed, so no further wallet change is needed —
        this just closes out the bet record for history/reporting.
        """
        active_bets = (
            Bet.objects.select_for_update()
            .filter(round=round_obj, status=Bet.Status.ACTIVE)
        )
        count = active_bets.update(status=Bet.Status.LOST)
        if count:
            logger.info("round %s: settled %s losing bets", round_obj.round_id, count)
        return count

    # --------------------------------------------------------------
    # Refunds (e.g. admin-triggered or engine-crash recovery)
    # --------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def refund_bet(bet_id, reason: str = ""):
        bet = Bet.objects.select_for_update().get(pk=bet_id)
        if bet.status not in (Bet.Status.ACTIVE, Bet.Status.PENDING):
            raise InvalidBetState("Only active/pending bets can be refunded")

        wallet = Wallet.objects.select_for_update().get(user=bet.user)
        wallet.balance += bet.amount
        wallet.save(update_fields=["balance", "updated_at"])

        bet.status = Bet.Status.REFUNDED
        bet.save(update_fields=["status", "updated_at"])

        WalletTransaction.objects.create(
            wallet=wallet,
            user=bet.user,
            tx_type=WalletTransaction.TxType.REFUND,
            amount=bet.amount,
            balance_after=wallet.balance,
            reference=reason or "refund",
            bet=bet,
        )
        return bet