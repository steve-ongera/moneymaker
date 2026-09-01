from decimal import Decimal, InvalidOperation

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Bet, Deposit, GameRound, User, Wallet, WalletTransaction, Withdrawal
from .validators import validate_bet_amount

MIN_DEPOSIT_AMOUNT = Decimal("20")
MIN_WITHDRAWAL_AMOUNT = Decimal("100")


# ============================================================
# Auth / Users
# ============================================================
from django.contrib.auth import authenticate

from .utils import generate_unique_username


from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User, Wallet
from .utils import generate_unique_username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "phone_number", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone_number(self, value):
        # Coerce blank string to None so it doesn't collide with the
        # unique constraint when multiple users leave phone blank.
        value = value or None
        if value and User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        username = generate_unique_username(validated_data["email"], User)
        user = User(username=username, **validated_data)
        user.set_password(password)
        user.save()
        Wallet.objects.get_or_create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            email=attrs["email"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        attrs["user"] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "phone_number", "is_verified", "date_joined")
        read_only_fields = fields


# ============================================================
# Wallet
# ============================================================
class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ("balance", "currency", "updated_at")
        read_only_fields = fields


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ("id", "tx_type", "amount", "balance_after", "reference", "created_at")
        read_only_fields = fields


# ============================================================
# Deposits (M-Pesa STK push)
# ============================================================
class DepositInitiateSerializer(serializers.Serializer):
    amount = serializers.CharField()
    phone_number = serializers.CharField()

    def validate_amount(self, value):
        try:
            amount = Decimal(value)
        except (InvalidOperation, TypeError):
            raise serializers.ValidationError("Invalid amount.")
        if amount < MIN_DEPOSIT_AMOUNT:
            raise serializers.ValidationError(f"Minimum deposit is KES {MIN_DEPOSIT_AMOUNT}.")
        return amount

    def validate_phone_number(self, value):
        from . import mpesa
        try:
            return mpesa.format_phone(value)
        except mpesa.MpesaError as exc:
            raise serializers.ValidationError(str(exc))


class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = (
            "id", "amount", "status", "method", "reference",
            "checkout_request_id", "mpesa_receipt", "result_desc", "created_at",
        )
        read_only_fields = fields


# ============================================================
# Withdrawals
# ============================================================
class WithdrawalInitiateSerializer(serializers.Serializer):
    amount = serializers.CharField()

    def validate_amount(self, value):
        try:
            amount = Decimal(value)
        except (InvalidOperation, TypeError):
            raise serializers.ValidationError("Invalid amount.")
        if amount < MIN_WITHDRAWAL_AMOUNT:
            raise serializers.ValidationError(f"Minimum withdrawal is KES {MIN_WITHDRAWAL_AMOUNT}.")
        return amount


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = ("id", "amount", "status", "method", "reference", "created_at")
        read_only_fields = fields


# ============================================================
# Game round / bets
# ============================================================
class GameRoundSerializer(serializers.Serializer):
    """Read-only, built from GameRound.public_dict() — never exposes server_seed early."""
    round_id = serializers.CharField()
    status = serializers.CharField()
    server_seed_hash = serializers.CharField()
    client_seed = serializers.CharField()
    nonce = serializers.IntegerField()
    betting_opens_at = serializers.DateTimeField()
    betting_closes_at = serializers.DateTimeField()
    server_seed = serializers.CharField(required=False)
    crash_multiplier = serializers.CharField(required=False)


class BetSerializer(serializers.ModelSerializer):
    round_id = serializers.CharField(source="round.round_id", read_only=True)

    class Meta:
        model = Bet
        fields = (
            "id", "round_id", "amount", "status", "auto_cashout_multiplier",
            "placed_at", "cashed_out_at", "cashout_multiplier", "payout",
        )
        read_only_fields = fields


class PlaceBetSerializer(serializers.Serializer):
    amount = serializers.CharField()
    request_id = serializers.CharField(max_length=64)
    auto_cashout_multiplier = serializers.CharField(required=False, allow_null=True)

    def validate_amount(self, value):
        return validate_bet_amount(value)

    def validate_auto_cashout_multiplier(self, value):
        if value in (None, ""):
            return None
        try:
            mult = Decimal(value)
        except Exception:
            raise serializers.ValidationError("Invalid auto cash-out multiplier.")
        if mult < Decimal("1.01"):
            raise serializers.ValidationError("Auto cash-out multiplier must be at least 1.01.")
        return mult


class CashoutSerializer(serializers.Serializer):
    bet_id = serializers.UUIDField(error_messages={
        "invalid": "bet_id must be a valid UUID.",
        "required": "bet_id is required.",
    })
    request_id = serializers.CharField(max_length=64, error_messages={
        "required": "request_id is required.",
        "blank": "request_id cannot be blank.",
    })


class FairnessVerifySerializer(serializers.Serializer):
    server_seed = serializers.CharField()
    server_seed_hash = serializers.CharField()
    client_seed = serializers.CharField()
    nonce = serializers.IntegerField()