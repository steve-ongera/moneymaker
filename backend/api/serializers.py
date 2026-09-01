from decimal import Decimal

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Bet, GameRound, User, Wallet, WalletTransaction
from .validators import validate_bet_amount


# ============================================================
# Auth / Users
# ============================================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "phone_number", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Wallet.objects.get_or_create(user=user)
        return user


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
    bet_id = serializers.UUIDField()
    request_id = serializers.CharField(max_length=64)


class FairnessVerifySerializer(serializers.Serializer):
    server_seed = serializers.CharField()
    server_seed_hash = serializers.CharField()
    client_seed = serializers.CharField()
    nonce = serializers.IntegerField()
