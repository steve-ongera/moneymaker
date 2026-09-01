from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from . import fairness
from .models import AuditLog, Bet, GameRound, User, WalletTransaction
from .serializers import (
    BetSerializer,
    CashoutSerializer,
    FairnessVerifySerializer,
    GameRoundSerializer,
    PlaceBetSerializer,
    RegisterSerializer,
    UserSerializer,
    WalletSerializer,
    WalletTransactionSerializer,
)
from .wallet import DuplicateRequest, InsufficientBalance, InvalidBetState, WalletService

channel_layer = get_channel_layer()


def _notify_user(user_id: int, payload: dict):
    """Push a personal event to every WebSocket tab this user has open."""
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}", {"type": "user.event", "payload": payload}
    )


def _log(user, action, meta=None, request=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        meta=meta or {},
        ip_address=request.META.get("REMOTE_ADDR") if request else None,
    )


# ============================================================
# Auth
# ============================================================
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ============================================================
# Wallet
# ============================================================
class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return WalletService.get_or_create_wallet(self.request.user)


class WalletTransactionsView(generics.ListAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user)


# ============================================================
# Aviator — round info
# ============================================================
class CurrentRoundView(APIView):
    """Used both for the initial page load and for post-reconnect resync (§16)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        round_obj = GameRound.objects.order_by("-created_at").first()
        active_bet = None
        if round_obj:
            active_bet = Bet.objects.filter(
                user=request.user, round=round_obj, status=Bet.Status.ACTIVE
            ).first()

        wallet = WalletService.get_or_create_wallet(request.user)

        return Response({
            "server_time": timezone.now().isoformat(),
            "wallet_balance": str(wallet.balance),
            "round": (
                GameRoundSerializer(round_obj.public_dict(reveal_seed=True)).data
                if round_obj else None
            ),
            "active_bet": BetSerializer(active_bet).data if active_bet else None,
        })


class RoundHistoryView(generics.ListAPIView):
    serializer_class = GameRoundSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return None  # overridden below

    def list(self, request, *args, **kwargs):
        rounds = GameRound.objects.filter(
            status__in=[GameRound.Status.CRASHED, GameRound.Status.SETTLED]
        ).order_by("-created_at")[:50]
        data = [r.public_dict(reveal_seed=True) for r in rounds]
        return Response(data)


# ============================================================
# Betting
# ============================================================
class BetThrottle(UserRateThrottle):
    scope = "bet"


class CashoutThrottle(UserRateThrottle):
    scope = "cashout"


class PlaceBetView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [BetThrottle]

    def post(self, request):
        serializer = PlaceBetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        request_id = serializer.validated_data["request_id"]
        auto_cashout = serializer.validated_data.get("auto_cashout_multiplier")

        round_obj = GameRound.objects.order_by("-created_at").first()
        if not round_obj:
            return Response({"error": {"message": "No active round"}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bet = WalletService.place_bet(
                user=request.user,
                round_obj=round_obj,
                amount=amount,
                request_id=request_id,
                auto_cashout_multiplier=auto_cashout,
            )
        except InsufficientBalance as exc:
            return Response({"error": {"message": str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        except InvalidBetState as exc:
            return Response({"error": {"message": str(exc)}}, status=status.HTTP_409_CONFLICT)
        except DuplicateRequest as exc:
            return Response({"error": {"message": "Duplicate request"}}, status=status.HTTP_409_CONFLICT)

        wallet = WalletService.get_or_create_wallet(request.user)
        payload = {
            "type": "bet.confirmed",
            "bet_id": str(bet.id),
            "amount": str(bet.amount),
            "balance": str(wallet.balance),
        }
        _notify_user(request.user.id, payload)
        _log(request.user, "bet.placed", {"bet_id": str(bet.id), "amount": str(amount)}, request)

        return Response(BetSerializer(bet).data, status=status.HTTP_201_CREATED)


class CashoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [CashoutThrottle]

    def post(self, request):
        serializer = CashoutSerializer(data=request.data)
        if not serializer.is_valid():
            # Normalize DRF's {field: [msg, ...]} shape into your app's
            # consistent {"error": {"message": "..."}} shape.
            first_field, first_errors = next(iter(serializer.errors.items()))
            message = f"{first_field}: {first_errors[0]}"
            return Response({"error": {"message": message}}, status=status.HTTP_400_BAD_REQUEST)

        bet_id = serializer.validated_data["bet_id"]
        request_id = serializer.validated_data["request_id"]

        try:
            bet = Bet.objects.select_related("round").get(pk=bet_id, user=request.user)
        except Bet.DoesNotExist:
            return Response({"error": {"message": "Bet not found"}}, status=status.HTTP_404_NOT_FOUND)

        round_obj = bet.round
        if round_obj.status != GameRound.Status.RUNNING or not round_obj.started_at:
            return Response(
                {"error": {"message": "Cash-out window is closed"}}, status=status.HTTP_409_CONFLICT
            )

        from .game_engine import calculate_multiplier
        from decimal import Decimal
        elapsed = Decimal(str((timezone.now() - round_obj.started_at).total_seconds()))
        current_multiplier = calculate_multiplier(elapsed)

        try:
            bet = WalletService.cashout(
                user=request.user,
                bet_id=bet_id,
                current_multiplier=current_multiplier,
                request_id=request_id,
            )
        except InvalidBetState as exc:
            payload = {"type": "cashout.failed", "bet_id": str(bet_id), "reason": str(exc)}
            _notify_user(request.user.id, payload)
            return Response({"error": {"message": str(exc)}}, status=status.HTTP_409_CONFLICT)
        except DuplicateRequest:
            return Response({"error": {"message": "Duplicate request"}}, status=status.HTTP_409_CONFLICT)

        wallet = WalletService.get_or_create_wallet(request.user)
        payload = {
            "type": "cashout.success",
            "bet_id": str(bet.id),
            "multiplier": str(bet.cashout_multiplier),
            "payout": str(bet.payout),
            "balance": str(wallet.balance),
        }
        _notify_user(request.user.id, payload)
        _log(request.user, "bet.cashout", {"bet_id": str(bet.id), "payout": str(bet.payout)}, request)

        return Response(BetSerializer(bet).data, status=status.HTTP_200_OK)

class MyBetsView(generics.ListAPIView):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user).select_related("round")


# ============================================================
# Fairness
# ============================================================
class FairnessVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FairnessVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        is_valid, recomputed_multiplier, recomputed_hash = fairness.verify(
            server_seed=data["server_seed"],
            server_seed_hash=data["server_seed_hash"],
            client_seed=data["client_seed"],
            nonce=data["nonce"],
        )

        return Response({
            "is_valid": is_valid,
            "recomputed_hash": recomputed_hash,
            "recomputed_crash_multiplier": str(recomputed_multiplier),
        })
