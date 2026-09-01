from decimal import Decimal, InvalidOperation

from django.conf import settings
from rest_framework import serializers


def validate_bet_amount(value):
    try:
        amount = Decimal(value)
    except (InvalidOperation, TypeError):
        raise serializers.ValidationError("Amount must be a valid decimal number.")

    min_bet = Decimal(settings.AVIATOR_MIN_BET)
    max_bet = Decimal(settings.AVIATOR_MAX_BET)

    if amount < min_bet:
        raise serializers.ValidationError(f"Minimum bet is {min_bet}.")
    if amount > max_bet:
        raise serializers.ValidationError(f"Maximum bet is {max_bet}.")
    return amount


def validate_positive_amount(value):
    try:
        amount = Decimal(value)
    except (InvalidOperation, TypeError):
        raise serializers.ValidationError("Amount must be a valid decimal number.")
    if amount <= 0:
        raise serializers.ValidationError("Amount must be greater than zero.")
    return amount
