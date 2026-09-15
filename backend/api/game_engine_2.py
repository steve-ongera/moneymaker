"""
Game engine — the single authoritative process that creates rounds, advances the
multiplier deterministically from server-elapsed time, and broadcasts state over the
Channels layer. This is the ONLY code path allowed to create/advance GameRound rows.

Run it as a standalone process alongside Daphne:

    python manage.py run_game_engine

It never trusts anything from the frontend — crash points are pre-committed via
api.fairness before betting opens, and the multiplier shown to clients is always
recomputed from `round.started_at`, never accumulated client-side.

Pause/resume (EngineControl) takes effect IMMEDIATELY — a round in progress
freezes at its current multiplier and resumes from where it left off.
"""

import asyncio
import logging
import math
import secrets
from datetime import timedelta
from decimal import ROUND_DOWN, Decimal
from django.db import transaction
from django.db import IntegrityError, transaction
from django.db.models import Count, Sum

from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from django.conf import settings
from django.utils import timezone

from .fairness import compute_crash_multiplier, generate_server_seed, hash_server_seed
from .models import Bet, GameRound, EngineControl
from .wallet import DuplicateRequest, InvalidBetState, WalletService

logger = logging.getLogger("aviator.engine")

GROUP_NAME = "aviator_room"
BROADCAST_INTERVAL_SECONDS = 0.1  # 10 updates/sec — deliberately not 100ms polling from clients
PAUSE_CHECK_INTERVAL_SECONDS = 0.1  # how often we re-read EngineControl while paused
FROZEN_BROADCAST_INTERVAL_SECONDS = 1.0  # how often we tell clients "still paused" while frozen

# django-solo convention. If your EngineControl singleton uses a different PK,
# change this (or better: tell me the real lookup and I'll wire it in).
ENGINE_CONTROL_PK = 1


def calculate_multiplier(elapsed_seconds: Decimal) -> Decimal:
    """
    Deterministic, time-based multiplier curve. Recomputable at any instant from
    elapsed server time, so it never drifts and never depends on how many ticks
    have been broadcast (no accumulated floating-point error).
    """
    if elapsed_seconds <= 0:
        return Decimal("1.00")
    growth_rate = float(settings.AVIATOR_GROWTH_RATE)
    value = Decimal(str(math.exp(growth_rate * float(elapsed_seconds))))
    return value.quantize(Decimal("0.01"), rounding=ROUND_DOWN)


class RoundEngine:
    """Singleton game loop."""

    def __init__(self):
        self.channel_layer = get_channel_layer()
        self._was_paused = False  # tracks last-seen pause state, so we only broadcast on transitions
        self._is_paused = False  # internal pause state for mid-round pausing
        self._paused_at = None  # timestamp when pause started
        self._total_paused_duration = Decimal('0')  # total time paused so far
        self._last_frozen_broadcast_at = None  # throttles multiplier.frozen spam while paused

    async def run_forever(self):
        logger.info("MoneyMaker Aviator engine starting")
        while True:
            try:
                await self._run_single_round()
            except Exception:
                logger.exception("Round loop crashed — recovering in 2s")
                await asyncio.sleep(2)

    # ----------------------------------------------------------
    # Pause/resume
    # ----------------------------------------------------------
    def _fetch_engine_control_sync(self) -> EngineControl:
        """
        Direct, uncached DB read. We deliberately do NOT go through get_solo()
        (or any cache-backed accessor) here: this is called every ~100ms from a
        separate process (run_game_engine) than the one flipping the pause flag
        (Daphne/admin), and a per-process cache (e.g. LocMemCache) would make
        this process blind to pause/resume until its own cache entry expires
        or the process restarts. Hitting the DB directly guarantees we see the
        flag within one poll interval, every time.
        """
        return EngineControl.objects.get(pk=ENGINE_CONTROL_PK)

    async def _check_pause_state(self):
        """
        Check if engine should be paused or resumed. Updates internal state
        and broadcasts transitions. Called at PAUSE_CHECK_INTERVAL_SECONDS
        cadence in both directions (paused -> running loop, and while paused),
        so a pause/resume toggle is picked up within ~100ms either way.
        """
        control = await sync_to_async(self._fetch_engine_control_sync)()

        # Transition to paused state
        if control.is_paused and not self._is_paused:
            self._is_paused = True
            self._paused_at = timezone.now()
            self._was_paused = True
            self._last_frozen_broadcast_at = None
            logger.info(f"Engine paused: {control.reason}")
            await self._broadcast({
                "type": "engine.paused",
                "reason": control.reason,
                "paused_by": control.paused_by.username if control.paused_by else None,
                "timestamp": timezone.now().isoformat(),
            })
            return True

        # Transition to resumed state
        if not control.is_paused and self._is_paused:
            # Calculate how long we were paused
            if self._paused_at:
                paused_duration = Decimal(str((timezone.now() - self._paused_at).total_seconds()))
                self._total_paused_duration += paused_duration

            self._is_paused = False
            self._paused_at = None
            self._was_paused = False
            logger.info(f"Engine resumed (was paused for {self._total_paused_duration}s)")
            await self._broadcast({
                "type": "engine.resumed",
                "paused_duration": str(self._total_paused_duration),
                "timestamp": timezone.now().isoformat(),
            })
            return False

        return self._is_paused

    async def _run_single_round(self):
        round_obj = await self._create_round()

        await self._broadcast({
            "type": "round.started",
            "round_id": round_obj.round_id,
            "status": GameRound.Status.BETTING_OPEN,
            "server_time": timezone.now().isoformat(),
            "betting_closes_at": round_obj.betting_closes_at.isoformat(),
            "server_seed_hash": round_obj.server_seed_hash,
            "client_seed": round_obj.client_seed,
            "nonce": round_obj.nonce,
        })

        # Betting phase - can also be paused
        betting_elapsed = Decimal('0')
        while betting_elapsed < settings.AVIATOR_BETTING_DURATION_SECONDS:
            # Check pause state during betting
            is_paused = await self._check_pause_state()
            if is_paused:
                await asyncio.sleep(PAUSE_CHECK_INTERVAL_SECONDS)
                continue

            await asyncio.sleep(0.1)
            betting_elapsed += Decimal('0.1')

        round_obj.status = GameRound.Status.RUNNING
        round_obj.started_at = timezone.now()
        await self._save(round_obj)

        await self._broadcast({
            "type": "round.running",
            "round_id": round_obj.round_id,
            "server_time": round_obj.started_at.isoformat(),
        })

        await self._run_multiplier_loop(round_obj)
        await self._settle_round(round_obj)

        # Reset pause tracking for next round
        self._total_paused_duration = Decimal('0')
        self._paused_at = None
        self._last_frozen_broadcast_at = None

        await asyncio.sleep(settings.AVIATOR_WAITING_DURATION_SECONDS)

    async def _run_multiplier_loop(self, round_obj: GameRound):
        """Runs the multiplier loop with mid-round pause support."""
        last_broadcast_multiplier = None

        while True:
            # Check pause state before each tick — polled at the SAME cadence
            # whether we're currently paused or running, so a resume is
            # detected within ~100ms instead of lagging behind a slower
            # "check once a second while paused" sleep.
            is_paused = await self._check_pause_state()

            if is_paused:
                # When paused, the multiplier freezes - we don't advance time.
                # We still poll every PAUSE_CHECK_INTERVAL_SECONDS so resume is
                # sharp, but we only broadcast the "still frozen" heartbeat at
                # FROZEN_BROADCAST_INTERVAL_SECONDS so we don't spam clients.
                now = timezone.now()
                should_broadcast_frozen = (
                    last_broadcast_multiplier is not None
                    and (
                        self._last_frozen_broadcast_at is None
                        or (now - self._last_frozen_broadcast_at).total_seconds()
                        >= FROZEN_BROADCAST_INTERVAL_SECONDS
                    )
                )
                if should_broadcast_frozen:
                    self._last_frozen_broadcast_at = now
                    await self._broadcast({
                        "type": "multiplier.frozen",
                        "round_id": round_obj.round_id,
                        "multiplier": str(last_broadcast_multiplier),
                        "server_time": now.isoformat(),
                        "paused": True,
                    })
                await asyncio.sleep(PAUSE_CHECK_INTERVAL_SECONDS)
                continue

            # Calculate effective elapsed time (subtract total paused duration)
            raw_elapsed = Decimal(str((timezone.now() - round_obj.started_at).total_seconds()))
            effective_elapsed = raw_elapsed - self._total_paused_duration

            # Ensure we don't go negative
            if effective_elapsed < 0:
                effective_elapsed = Decimal('0')

            multiplier = calculate_multiplier(effective_elapsed)

            if multiplier >= round_obj.crash_multiplier:
                # Settle anyone whose target sits exactly at/under the crash point
                # on this final tick before the round actually crashes.
                await self._process_auto_cashouts(round_obj, multiplier)
                await self._crash_round(round_obj)
                return

            await self._process_auto_cashouts(round_obj, multiplier)
            last_broadcast_multiplier = multiplier

            await self._broadcast({
                "type": "multiplier.update",
                "round_id": round_obj.round_id,
                "multiplier": str(multiplier),
                "effective_elapsed": str(effective_elapsed),
                "server_time": timezone.now().isoformat(),
            })
            await asyncio.sleep(BROADCAST_INTERVAL_SECONDS)

    # ----------------------------------------------------------
    # Auto cash-out — settles every active bet whose target has been
    # reached on THIS tick, independently of any client request. This is
    # what lets a 4.0x target and a 4.2x target both cash out "simultaneously"
    # (i.e. each the moment the live multiplier crosses it) instead of racing
    # a manual button click against network latency and the crash itself.
    # ----------------------------------------------------------
    async def _process_auto_cashouts(self, round_obj: GameRound, multiplier: Decimal):
        settled = await sync_to_async(self._process_auto_cashouts_sync)(round_obj, multiplier)
        for bet, wallet_balance in settled:
            await self._notify_user(bet.user_id, {
                "type": "cashout.success",
                "bet_id": str(bet.id),
                "multiplier": str(bet.cashout_multiplier),
                "payout": str(bet.payout),
                "balance": str(wallet_balance),
                "auto": True,
            })
            # Admin room broadcast — auto cashouts, mirrors the manual path in views.py
            await self._broadcast({
                "type": "admin.bet_cashout",
                "bet_id": str(bet.id),
                "username": bet.user.username,
                "multiplier": str(bet.cashout_multiplier),
                "payout": str(bet.payout),
                "auto": True,
            })

    def _process_auto_cashouts_sync(self, round_obj: GameRound, multiplier: Decimal):
        due_bets = list(
            Bet.objects.select_related("user").filter(
                round=round_obj,
                status=Bet.Status.ACTIVE,
                auto_cashout_multiplier__isnull=False,
                auto_cashout_multiplier__lte=multiplier,
            )
        )

        settled = []
        for bet in due_bets:
            try:
                updated_bet = WalletService.cashout(
                    user=bet.user,
                    bet_id=bet.id,
                    current_multiplier=bet.auto_cashout_multiplier,
                    request_id=f"auto:{bet.id}",
                )
            except (InvalidBetState, DuplicateRequest):
                # Already settled — e.g. the player manually cashed out a
                # moment earlier than their own auto target. Not an error.
                continue
            wallet = WalletService.get_or_create_wallet(bet.user)
            settled.append((updated_bet, wallet.balance))
        return settled

    # ----------------------------------------------------------
    # DB-touching helpers (wrapped for the async loop)
    # ----------------------------------------------------------
    async def _create_round(self) -> GameRound:
        return await sync_to_async(self._create_round_sync)()

    def _create_round_sync(self) -> GameRound:
        server_seed = generate_server_seed()
        server_seed_hash = hash_server_seed(server_seed)
        client_seed = secrets.token_hex(8)
        now = timezone.now()

        for attempt in range(5):
            with transaction.atomic():
                last = GameRound.objects.select_for_update().order_by("-id").first()
                seq = (last.id + 1) if last else 1
                nonce = seq
                round_id = f"MM-{now.strftime('%Y%m%d')}-{seq:06d}"
                crash_multiplier = compute_crash_multiplier(server_seed, client_seed, nonce)
                try:
                    return GameRound.objects.create(
                        round_id=round_id,
                        status=GameRound.Status.BETTING_OPEN,
                        server_seed=server_seed,
                        server_seed_hash=server_seed_hash,
                        client_seed=client_seed,
                        nonce=nonce,
                        crash_multiplier=crash_multiplier,
                        betting_opens_at=now,
                        betting_closes_at=now + timedelta(seconds=settings.AVIATOR_BETTING_DURATION_SECONDS),
                    )
                except IntegrityError:
                    continue
        raise RuntimeError("Could not allocate a unique round_id after 5 attempts")

    async def _save(self, round_obj: GameRound):
        await sync_to_async(round_obj.save)()

    async def _crash_round(self, round_obj: GameRound):
        round_obj.status = GameRound.Status.CRASHED
        round_obj.crashed_at = timezone.now()
        await self._save(round_obj)

        await self._broadcast({
            "type": "round.crashed",
            "round_id": round_obj.round_id,
            "crash_multiplier": str(round_obj.crash_multiplier),
            "server_seed": round_obj.server_seed,  # reveal now that the round is over
            "server_time": round_obj.crashed_at.isoformat(),
        })

    async def _settle_round(self, round_obj: GameRound):
        # Build the summary BEFORE settle_round/status flip so PENDING/ACTIVE
        # states haven't been rewritten out from under the aggregate yet.
        summary = await sync_to_async(self._build_round_summary_sync)(round_obj)

        await sync_to_async(WalletService.settle_round)(round_obj)
        round_obj.status = GameRound.Status.SETTLED
        round_obj.settled_at = timezone.now()
        await self._save(round_obj)

        await self._broadcast({
            "type": "round.settled",
            "round_id": round_obj.round_id,
        })

        # Admin room broadcast — powers the "Last round" summary line
        await self._broadcast({
            "type": "admin.round_summary",
            **summary,
        })

    def _build_round_summary_sync(self, round_obj: GameRound):
        confirmed = Bet.objects.filter(round=round_obj).exclude(
            status__in=[Bet.Status.PENDING, Bet.Status.REFUNDED]
        )
        staked = confirmed.aggregate(v=Sum("amount"))["v"] or 0
        payout = confirmed.filter(status=Bet.Status.CASHED_OUT).aggregate(v=Sum("payout"))["v"] or 0
        bet_count = confirmed.count()
        return {
            "round_id": round_obj.round_id,
            "bet_count": bet_count,
            "staked": str(staked),
            "payout": str(payout),
            "profit": str(staked - payout),
        }

    async def _broadcast(self, payload: dict):
        await self.channel_layer.group_send(
            GROUP_NAME,
            {"type": "engine.event", "payload": payload},
        )

    async def _notify_user(self, user_id: int, payload: dict):
        await self.channel_layer.group_send(
            f"user_{user_id}", {"type": "user.event", "payload": payload}
        )


engine = RoundEngine()