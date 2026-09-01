import uuid

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models


# ============================================================
# Users
# ============================================================
class User(AbstractUser):
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username


# ============================================================
# Wallet
# ============================================================
class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=8, default="KES")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["user"])]

    def __str__(self):
        return f"{self.user.username} wallet: {self.balance} {self.currency}"


class WalletTransaction(models.Model):
    class TxType(models.TextChoices):
        DEPOSIT = "DEPOSIT", "Deposit"
        WITHDRAWAL = "WITHDRAWAL", "Withdrawal"
        BET = "BET", "Bet"
        WIN = "WIN", "Win"
        REFUND = "REFUND", "Refund"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    tx_type = models.CharField(max_length=12, choices=TxType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)  # signed: +credit / -debit
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    reference = models.CharField(max_length=64, blank=True, default="")
    bet = models.ForeignKey("Bet", on_delete=models.SET_NULL, null=True, blank=True, related_name="ledger_entries")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["tx_type"]),
            models.Index(fields=["reference"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tx_type} {self.amount} -> {self.user.username}"


class Deposit(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="deposits")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(1)])
    method = models.CharField(max_length=32, default="MPESA")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    reference = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["user", "status"]), models.Index(fields=["reference"])]

    def __str__(self):
        return f"Deposit {self.amount} ({self.status}) - {self.user.username}"


class Withdrawal(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(1)])
    method = models.CharField(max_length=32, default="MPESA")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    reference = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["user", "status"]), models.Index(fields=["reference"])]

    def __str__(self):
        return f"Withdrawal {self.amount} ({self.status}) - {self.user.username}"


# ============================================================
# Game round (provably-fair fields embedded)
# ============================================================
class GameRound(models.Model):
    class Status(models.TextChoices):
        WAITING = "WAITING", "Waiting"
        BETTING_OPEN = "BETTING_OPEN", "Betting Open"
        RUNNING = "RUNNING", "Running"
        CRASHED = "CRASHED", "Crashed"
        SETTLED = "SETTLED", "Settled"

    id = models.BigAutoField(primary_key=True)
    round_id = models.CharField(max_length=32, unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.WAITING)

    # Provably-fair
    server_seed = models.CharField(max_length=128)          # secret until reveal
    server_seed_hash = models.CharField(max_length=128)      # public before round starts
    client_seed = models.CharField(max_length=64)
    nonce = models.PositiveIntegerField()
    crash_multiplier = models.DecimalField(max_digits=10, decimal_places=2)

    betting_opens_at = models.DateTimeField()
    betting_closes_at = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    crashed_at = models.DateTimeField(null=True, blank=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["round_id"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.round_id} [{self.status}]"

    def public_dict(self, reveal_seed=False):
        data = {
            "round_id": self.round_id,
            "status": self.status,
            "server_seed_hash": self.server_seed_hash,
            "client_seed": self.client_seed,
            "nonce": self.nonce,
            "betting_opens_at": self.betting_opens_at.isoformat(),
            "betting_closes_at": self.betting_closes_at.isoformat(),
        }
        if reveal_seed and self.status in (self.Status.CRASHED, self.Status.SETTLED):
            data["server_seed"] = self.server_seed
            data["crash_multiplier"] = str(self.crash_multiplier)
        return data


# ============================================================
# Bet
# ============================================================
class Bet(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACTIVE = "ACTIVE", "Active"
        CASHED_OUT = "CASHED_OUT", "Cashed Out"
        LOST = "LOST", "Lost"
        REFUNDED = "REFUNDED", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bets")
    round = models.ForeignKey(GameRound, on_delete=models.CASCADE, related_name="bets")

    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)

    auto_cashout_multiplier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    placed_at = models.DateTimeField(auto_now_add=True)
    cashed_out_at = models.DateTimeField(null=True, blank=True)
    cashout_multiplier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payout = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    request_id = models.CharField(max_length=64, unique=True)  # idempotency key for bet placement
    cashout_request_id = models.CharField(max_length=64, null=True, blank=True, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "round"]),
            models.Index(fields=["round", "status"]),
            models.Index(fields=["status"]),
            models.Index(fields=["request_id"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bet {self.id} {self.amount} [{self.status}] round={self.round.round_id}"


# ============================================================
# Audit log
# ============================================================
class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=64)
    meta = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "created_at"]), models.Index(fields=["action"])]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} by {self.user_id} at {self.created_at}"
