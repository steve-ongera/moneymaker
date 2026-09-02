from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import (
    AuditLog,
    Bet,
    Deposit,
    GameRound,
    User,
    Wallet,
    WalletTransaction,
    Withdrawal,
)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "phone_number", "is_verified", "is_staff", "date_joined")
    search_fields = ("username", "email", "phone_number")

from django.contrib import admin
from .models import AdminOTP


@admin.register(AdminOTP)
class AdminOTPAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "login_token",
        "is_used",
        "attempts",
        "expires_at",
        "created_at",
    )

    list_filter = (
        "is_used",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "login_token",
    )

    readonly_fields = (
        "id",
        "created_at",
    )

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "balance", "currency", "updated_at")
    search_fields = ("user__username",)
    


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tx_type", "amount", "balance_after", "reference", "created_at")
    list_filter = ("tx_type",)
    search_fields = ("user__username", "reference")
    readonly_fields = [f.name for f in WalletTransaction._meta.fields]  # ledger is append-only

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "amount", "method", "status", "created_at")
    list_filter = ("status", "method")
    search_fields = ("user__username", "reference")


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "amount", "method", "status", "created_at")
    list_filter = ("status", "method")
    search_fields = ("user__username", "reference")


@admin.register(GameRound)
class GameRoundAdmin(admin.ModelAdmin):
    list_display = ("round_id", "status", "crash_multiplier", "created_at", "settled_at")
    list_filter = ("status",)
    search_fields = ("round_id",)
    # Completed rounds are historical fairness records — do not let admins mutate results.
    readonly_fields = [f.name for f in GameRound._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "round", "amount", "status", "cashout_multiplier", "payout", "created_at")
    list_filter = ("status",)
    search_fields = ("user__username", "id")
    readonly_fields = [f.name for f in Bet._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "user", "ip_address", "created_at")
    list_filter = ("action",)
    search_fields = ("user__username", "action")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
