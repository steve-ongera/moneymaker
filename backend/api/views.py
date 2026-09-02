from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
import logging
import uuid
from decimal import Decimal
from django.conf import settings

import logging

logger = logging.getLogger(__name__)

from . import fairness, mpesa
from .models import AuditLog, Bet, Deposit, GameRound, User, WalletTransaction, Withdrawal
from .serializers import (
    BetSerializer,
    CashoutSerializer,
    DepositInitiateSerializer,
    DepositSerializer,
    FairnessVerifySerializer,
    GameRoundSerializer,
    PlaceBetSerializer,
    RegisterSerializer,
    UserSerializer,
    WalletSerializer,
    WalletTransactionSerializer,
    WithdrawalInitiateSerializer,
    WithdrawalSerializer,LoginSerializer,
)
from .wallet import DuplicateRequest, InsufficientBalance, InvalidBetState, WalletService
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

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
from rest_framework_simplejwt.tokens import RefreshToken


import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import User
from .serializers import RegisterSerializer

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Register validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })
        
        
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
# Deposits (M-Pesa STK Push)
# ============================================================
class DepositInitiateView(APIView):
    """
    Initiate M-Pesa STK Push deposit.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DepositInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data["amount"]
        phone_number = serializer.validated_data["phone_number"]

        # Generate unique reference
        reference = f"DEP{timezone.now().strftime('%Y%m%d%H%M%S')}{request.user.id}"

        try:
            # Create deposit record
            deposit = Deposit.objects.create(
                user=request.user,
                amount=amount,
                method="MPESA",
                status=Deposit.Status.PENDING,
                reference=reference,
                phone_number=phone_number,
            )

            # Initiate STK push
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=int(amount),
                account_reference=reference[:12],
                transaction_desc=f"Aviator Deposit {reference[:8]}",
            )

            # Update deposit with M-Pesa response
            deposit.checkout_request_id = response.get("CheckoutRequestID")
            deposit.merchant_request_id = response.get("MerchantRequestID")
            deposit.save()

            _log(request.user, "deposit.initiated", {
                "deposit_id": str(deposit.id),
                "amount": str(amount),
                "phone": phone_number,
                "checkout_request_id": deposit.checkout_request_id,
            }, request)

            # If in DEBUG mode with mock, auto-complete the deposit after a delay
            # This simulates the callback flow for testing
            if settings.DEBUG and deposit.checkout_request_id and deposit.checkout_request_id.startswith("MOCK"):
                # Auto-complete the deposit in 2 seconds (simulating callback)
                import threading
                def auto_complete():
                    import time
                    time.sleep(2)
                    try:
                        # Simulate callback
                        callback_data = mpesa.simulate_mock_callback(deposit.checkout_request_id, success=True)
                        # Process the callback
                        _process_mock_callback(deposit, callback_data)
                    except Exception as e:
                        logger.error(f"Auto-complete mock deposit error: {str(e)}")
                
                threading.Thread(target=auto_complete, daemon=True).start()
                
                return Response({
                    "success": True,
                    "message": "MOCK: STK Push sent successfully. Auto-completing in 2 seconds.",
                    "data": {
                        "deposit_id": str(deposit.id),
                        "checkout_request_id": deposit.checkout_request_id,
                        "merchant_request_id": deposit.merchant_request_id,
                        "status": deposit.status,
                        "is_mock": True,
                    }
                }, status=status.HTTP_200_OK)

            return Response({
                "success": True,
                "message": "STK Push sent successfully. Please check your phone.",
                "data": {
                    "deposit_id": str(deposit.id),
                    "checkout_request_id": deposit.checkout_request_id,
                    "merchant_request_id": deposit.merchant_request_id,
                    "status": deposit.status,
                }
            }, status=status.HTTP_200_OK)

        except mpesa.MpesaError as e:
            deposit.status = Deposit.Status.FAILED
            deposit.result_desc = str(e)
            deposit.save()
            _log(request.user, "deposit.failed", {
                "deposit_id": str(deposit.id),
                "error": str(e),
            }, request)
            return Response({
                "success": False,
                "error": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Deposit initiation error: {str(e)}")
            return Response({
                "success": False,
                "error": "Failed to initiate deposit. Please try again.",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _process_mock_callback(deposit, callback_data):
    """Process a mock callback for DEBUG mode."""
    try:
        body = callback_data.get("Body", {})
        stk_callback = body.get("stkCallback", {})
        
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc")
        
        if result_code == "0":
            # Payment successful
            callback_metadata = stk_callback.get("CallbackMetadata", {})
            items = callback_metadata.get("Item", [])
            metadata_dict = {item["Name"]: item["Value"] for item in items}
            mpesa_receipt = metadata_dict.get("MpesaReceiptNumber", f"MOCK{str(uuid.uuid4().hex[:10]).upper()}")
            
            deposit.status = Deposit.Status.COMPLETED
            deposit.mpesa_receipt = mpesa_receipt
            deposit.result_desc = result_desc
            deposit.save()
            
            # Credit the user's wallet
            WalletService.deposit(
                user=deposit.user,
                amount=deposit.amount,
                reference=f"MPESA:{mpesa_receipt}"
            )
            
            logger.info(f"Mock deposit completed: {deposit.checkout_request_id} - Receipt: {mpesa_receipt}")
        else:
            deposit.status = Deposit.Status.FAILED
            deposit.result_desc = result_desc
            deposit.save()
            logger.warning(f"Mock deposit failed: {deposit.checkout_request_id} - {result_desc}")
    except Exception as e:
        logger.error(f"Mock callback processing error: {str(e)}")


class DepositStatusView(APIView):
    """
    Check the status of a deposit by checkout_request_id.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, checkout_request_id):
        try:
            # Get the deposit from database
            deposit = Deposit.objects.get(
                checkout_request_id=checkout_request_id,
                user=request.user
            )

            # If deposit is already completed or failed, return cached status
            if deposit.status != Deposit.Status.PENDING:
                serializer = DepositSerializer(deposit)
                return Response({
                    "success": True,
                    "status": deposit.status,
                    "data": serializer.data,
                })

            # For mock transactions, check if we should auto-complete
            if settings.DEBUG and deposit.checkout_request_id.startswith("MOCK"):
                # Check if it's been more than 5 seconds, auto-complete if still pending
                import time
                from datetime import timedelta
                time_since_created = timezone.now() - deposit.created_at
                if time_since_created > timedelta(seconds=5):
                    # Auto-complete as success
                    deposit.status = Deposit.Status.COMPLETED
                    deposit.mpesa_receipt = f"MOCK{str(uuid.uuid4().hex[:10]).upper()}"
                    deposit.result_desc = "Mock payment successful"
                    deposit.save()
                    
                    WalletService.deposit(
                        user=request.user,
                        amount=deposit.amount,
                        reference=f"MPESA:{deposit.mpesa_receipt}"
                    )
                    
                    _log(request.user, "deposit.completed", {
                        "deposit_id": str(deposit.id),
                        "amount": str(deposit.amount),
                        "mpesa_receipt": deposit.mpesa_receipt,
                    }, request)
                    
                    wallet = WalletService.get_or_create_wallet(request.user)
                    _notify_user(request.user.id, {
                        "type": "wallet.updated",
                        "balance": str(wallet.balance),
                        "amount": str(deposit.amount),
                        "tx_type": "DEPOSIT",
                    })

            # Query M-Pesa for latest status (real transactions)
            try:
                response = mpesa.query_status(checkout_request_id)
                result_code = response.get("ResultCode")

                if result_code == "0":
                    # Payment successful - credit the user's wallet
                    deposit.status = Deposit.Status.COMPLETED
                    deposit.mpesa_receipt = response.get("ResultDesc", "")
                    deposit.save()

                    WalletService.deposit(
                        user=request.user,
                        amount=deposit.amount,
                        reference=f"MPESA:{deposit.mpesa_receipt}"
                    )

                    _log(request.user, "deposit.completed", {
                        "deposit_id": str(deposit.id),
                        "amount": str(deposit.amount),
                        "mpesa_receipt": deposit.mpesa_receipt,
                    }, request)

                    wallet = WalletService.get_or_create_wallet(request.user)
                    _notify_user(request.user.id, {
                        "type": "wallet.updated",
                        "balance": str(wallet.balance),
                        "amount": str(deposit.amount),
                        "tx_type": "DEPOSIT",
                    })

                    logger.info(f"Deposit completed: {checkout_request_id} for user {request.user.username}")

                elif result_code != "1037":  # 1037 = pending
                    deposit.status = Deposit.Status.FAILED
                    deposit.result_desc = response.get("ResultDesc", "Payment failed")
                    deposit.save()
                    logger.warning(f"Deposit failed: {checkout_request_id} - {deposit.result_desc}")

            except mpesa.MpesaError as e:
                # If query fails, return current status
                logger.warning(f"Failed to query deposit status: {str(e)}")

            serializer = DepositSerializer(deposit)
            return Response({
                "success": True,
                "status": deposit.status,
                "data": serializer.data,
            })

        except Deposit.DoesNotExist:
            return Response({
                "success": False,
                "error": "Deposit not found.",
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Deposit status check error: {str(e)}")
            return Response({
                "success": False,
                "error": "Failed to check deposit status.",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MpesaCallbackView(APIView):
    """
    M-Pesa STK Push callback URL.
    This endpoint receives the payment result from Safaricom.
    """
    permission_classes = [AllowAny]  # Public endpoint

    def post(self, request):
        try:
            data = request.data
            logger.info(f"M-Pesa callback received: {data}")

            body = data.get("Body", {})
            stk_callback = body.get("stkCallback", {})

            checkout_request_id = stk_callback.get("CheckoutRequestID")
            result_code = stk_callback.get("ResultCode")
            result_desc = stk_callback.get("ResultDesc")

            if not checkout_request_id:
                logger.error("No CheckoutRequestID in callback")
                return Response({"error": "Missing CheckoutRequestID"}, status=status.HTTP_400_BAD_REQUEST)

            # Find the deposit
            try:
                deposit = Deposit.objects.get(checkout_request_id=checkout_request_id)
            except Deposit.DoesNotExist:
                logger.error(f"Deposit not found for CheckoutRequestID: {checkout_request_id}")
                return Response({"error": "Deposit not found"}, status=status.HTTP_404_NOT_FOUND)

            # Process the result
            if result_code == "0":
                # Payment successful
                callback_metadata = stk_callback.get("CallbackMetadata", {})
                items = callback_metadata.get("Item", [])

                # Extract metadata
                metadata_dict = {item["Name"]: item["Value"] for item in items}
                mpesa_receipt = metadata_dict.get("MpesaReceiptNumber")
                amount = metadata_dict.get("Amount")

                # Update deposit
                deposit.status = Deposit.Status.COMPLETED
                deposit.mpesa_receipt = mpesa_receipt
                deposit.result_desc = result_desc
                deposit.save()

                # Credit the user's wallet
                try:
                    WalletService.deposit(
                        user=deposit.user,
                        amount=deposit.amount,
                        reference=f"MPESA:{mpesa_receipt}"
                    )
                    
                    # Notify user via WebSocket
                    wallet = WalletService.get_or_create_wallet(deposit.user)
                    _notify_user(deposit.user.id, {
                        "type": "wallet.updated",
                        "balance": str(wallet.balance),
                        "amount": str(deposit.amount),
                        "tx_type": "DEPOSIT",
                    })
                    
                    _log(deposit.user, "deposit.completed", {
                        "deposit_id": str(deposit.id),
                        "amount": str(deposit.amount),
                        "mpesa_receipt": mpesa_receipt,
                    }, request)
                    
                    logger.info(f"Deposit completed via callback: {checkout_request_id} - Receipt: {mpesa_receipt}")
                except Exception as e:
                    logger.error(f"Failed to credit wallet for deposit {checkout_request_id}: {str(e)}")
                    # Don't fail the callback, log and continue

            else:
                # Payment failed
                deposit.status = Deposit.Status.FAILED
                deposit.result_desc = result_desc
                deposit.save()
                logger.warning(f"Deposit failed via callback: {checkout_request_id} - {result_desc}")

            return Response({"ResultCode": 0, "ResultDesc": "Success"}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Callback processing error: {str(e)}")
            return Response({"error": "Failed to process callback"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================
# Withdrawals
# ============================================================
class WithdrawalInitiateView(APIView):
    """
    Initiate a withdrawal request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WithdrawalInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data["amount"]
        reference = f"WTH{timezone.now().strftime('%Y%m%d%H%M%S')}{request.user.id}"

        try:
            # Deduct from wallet
            wallet = WalletService.withdraw(
                user=request.user,
                amount=amount,
                reference=reference
            )

            # Create withdrawal record
            withdrawal = Withdrawal.objects.create(
                user=request.user,
                amount=amount,
                method="MPESA",
                status=Withdrawal.Status.PENDING,
                reference=reference,
            )

            _log(request.user, "withdrawal.initiated", {
                "withdrawal_id": str(withdrawal.id),
                "amount": str(amount),
            }, request)

            # Notify user
            _notify_user(request.user.id, {
                "type": "wallet.updated",
                "balance": str(wallet.balance),
                "amount": str(amount),
                "tx_type": "WITHDRAWAL",
            })

            return Response({
                "success": True,
                "message": "Withdrawal request submitted successfully.",
                "data": {
                    "withdrawal_id": str(withdrawal.id),
                    "amount": str(amount),
                    "status": withdrawal.status,
                    "reference": withdrawal.reference,
                }
            }, status=status.HTTP_200_OK)

        except InsufficientBalance as e:
            return Response({
                "success": False,
                "error": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Withdrawal initiation error: {str(e)}")
            return Response({
                "success": False,
                "error": "Failed to initiate withdrawal.",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        
        
    
import random
import secrets
from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .admin_permissions import IsPlatformAdmin
from .serializers import (
    AdminBetSerializer,
    AdminLoginStep1Serializer,
    AdminOTPResendSerializer,
    AdminOTPVerifySerializer,
    AdminRoundSerializer,
    AdminTransactionSerializer,
    AdminUserSerializer,
)
from .models import AdminOTP, AuditLog, Bet, Deposit, GameRound, User, Wallet, WalletTransaction, Withdrawal

OTP_TTL_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
GENERIC_LOGIN_ERROR = "Invalid credentials or not authorized."


def _log(user, action, meta=None, request=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        meta=meta or {},
        ip_address=request.META.get("REMOTE_ADDR") if request else None,
    )


def _issue_otp(user):
    code = f"{random.randint(0, 999999):06d}"
    login_token = secrets.token_urlsafe(32)

    AdminOTP.objects.create(
        user=user,
        code_hash=make_password(code),
        login_token=login_token,
        expires_at=timezone.now() + timedelta(minutes=OTP_TTL_MINUTES),
    )

    if settings.DEBUG:
        print("\n" + "=" * 50)
        print("MONEYMAKER ADMIN OTP")
        print("=" * 50)
        print(f"User:  {user.email}")
        print(f"OTP:   {code}")
        print(f"Token: {login_token}")
        print(f"Expires: {OTP_TTL_MINUTES} minutes")
        print("=" * 50 + "\n")
    else:
        send_mail(
            subject="Your MoneyMaker Admin login code",
            message=(
                f"Your admin login code is: {code}\n\n"
                f"It expires in {OTP_TTL_MINUTES} minutes. "
                f"If you did not request this, ignore this email."
            ),
            from_email=getattr(
                settings,
                "DEFAULT_FROM_EMAIL",
                "no-reply@moneymakeraviator.com",
            ),
            recipient_list=[user.email],
            fail_silently=False,
        )

    return login_token


class AdminLoginThrottle(AnonRateThrottle):
    scope = "admin_login"


class AdminOTPThrottle(AnonRateThrottle):
    scope = "admin_otp"


# ============================================================
# Step 1: email + password -> emails an OTP, returns a login_token
# ============================================================
class AdminLoginStep1View(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]

    def post(self, request):
        serializer = AdminLoginStep1Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request=request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        # Same generic error whether the password was wrong or the account
        # simply isn't staff — never reveal which, to avoid enumerating admins.
        if not user or not user.is_staff or not user.is_active:
            return Response({"error": {"message": GENERIC_LOGIN_ERROR}}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.email:
            return Response(
                {"error": {"message": "This admin account has no email on file."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        login_token = _issue_otp(user)
        _log(user, "admin.login.otp_sent", request=request)

        return Response({
            "success": True,
            "login_token": login_token,
            "message": "A 6-digit code was sent to your email.",
        })


# ============================================================
# Step 2: submit the OTP -> get JWT
# ============================================================
class AdminOTPVerifyView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AdminOTPThrottle]

    def post(self, request):
        serializer = AdminOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            otp = AdminOTP.objects.select_related("user").get(
                login_token=serializer.validated_data["login_token"], is_used=False
            )
        except AdminOTP.DoesNotExist:
            return Response({"error": {"message": "Invalid or expired login session."}}, status=status.HTTP_400_BAD_REQUEST)

        if otp.is_expired:
            return Response({"error": {"message": "Code expired. Please log in again."}}, status=status.HTTP_400_BAD_REQUEST)

        if otp.attempts >= OTP_MAX_ATTEMPTS:
            return Response({"error": {"message": "Too many attempts. Please log in again."}}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if not check_password(serializer.validated_data["code"], otp.code_hash):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response({"error": {"message": "Incorrect code."}}, status=status.HTTP_400_BAD_REQUEST)

        user = otp.user
        if not user.is_staff or not user.is_active:
            return Response({"error": {"message": GENERIC_LOGIN_ERROR}}, status=status.HTTP_401_UNAUTHORIZED)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        refresh = RefreshToken.for_user(user)
        _log(user, "admin.login.success", request=request)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "admin": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        })


class AdminOTPResendView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AdminOTPThrottle]

    def post(self, request):
        serializer = AdminOTPResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            old_otp = AdminOTP.objects.select_related("user").get(
                login_token=serializer.validated_data["login_token"]
            )
        except AdminOTP.DoesNotExist:
            return Response({"error": {"message": "Invalid login session."}}, status=status.HTTP_400_BAD_REQUEST)

        old_otp.is_used = True
        old_otp.save(update_fields=["is_used"])

        new_login_token = _issue_otp(old_otp.user)
        return Response({"success": True, "login_token": new_login_token, "message": "A new code was sent."})


# ============================================================
# Pagination
# ============================================================
class AdminPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


# ============================================================
# Platform stats
# ============================================================
class AdminStatsView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        today = timezone.localdate()
        confirmed_bets = Bet.objects.exclude(status__in=[Bet.Status.PENDING, Bet.Status.REFUNDED])

        total_staked = confirmed_bets.aggregate(v=Sum("amount"))["v"] or 0
        total_payout = Bet.objects.filter(status=Bet.Status.CASHED_OUT).aggregate(v=Sum("payout"))["v"] or 0

        today_bets = confirmed_bets.filter(created_at__date=today)
        staked_today = today_bets.aggregate(v=Sum("amount"))["v"] or 0
        payout_today = Bet.objects.filter(status=Bet.Status.CASHED_OUT, created_at__date=today).aggregate(v=Sum("payout"))["v"] or 0

        data = {
            "total_users": User.objects.count(),
            "verified_users": User.objects.filter(is_verified=True).count(),
            "total_deposits": str(Deposit.objects.filter(status=Deposit.Status.COMPLETED).aggregate(v=Sum("amount"))["v"] or 0),
            "total_withdrawals": str(Withdrawal.objects.filter(status=Withdrawal.Status.COMPLETED).aggregate(v=Sum("amount"))["v"] or 0),
            "total_staked": str(total_staked),
            "total_payout": str(total_payout),
            "platform_revenue": str(total_staked - total_payout),
            "total_wallet_liability": str(Wallet.objects.aggregate(v=Sum("balance"))["v"] or 0),
            "bets_today": today_bets.count(),
            "staked_today": str(staked_today),
            "payout_today": str(payout_today),
            "revenue_today": str(staked_today - payout_today),
            "active_users_today": today_bets.values("user").distinct().count(),
        }
        return Response(data)


# ============================================================
# Users
# ============================================================
class AdminUsersListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsPlatformAdmin]
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = User.objects.select_related("wallet").order_by("-date_joined")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search) | Q(phone_number__icontains=search)
            )
        return qs


# ============================================================
# Transactions
# ============================================================
class AdminTransactionsListView(generics.ListAPIView):
    serializer_class = AdminTransactionSerializer
    permission_classes = [IsPlatformAdmin]
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = WalletTransaction.objects.select_related("user").order_by("-created_at")
        tx_type = self.request.query_params.get("tx_type")
        search = self.request.query_params.get("search")
        if tx_type:
            qs = qs.filter(tx_type=tx_type)
        if search:
            qs = qs.filter(Q(user__username__icontains=search) | Q(reference__icontains=search))
        return qs


# ============================================================
# Rounds — history with staked/payout/profit
# ============================================================
class AdminRoundsListView(generics.ListAPIView):
    serializer_class = AdminRoundSerializer
    permission_classes = [IsPlatformAdmin]
    pagination_class = AdminPagination

    def get_queryset(self):
        confirmed = ~Q(bets__status__in=[Bet.Status.PENDING, Bet.Status.REFUNDED])
        cashed_out = Q(bets__status=Bet.Status.CASHED_OUT)
        return (
            GameRound.objects.filter(status__in=[GameRound.Status.CRASHED, GameRound.Status.SETTLED])
            .annotate(
                total_staked=Sum("bets__amount", filter=confirmed),
                total_payout=Sum("bets__payout", filter=cashed_out),
                bet_count=Count("bets", filter=confirmed),
            )
            .order_by("-created_at")
        )


# ============================================================
# Live round — current round + every bet placed on it, updated by polling
# ============================================================
class AdminCurrentRoundView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        round_obj = GameRound.objects.order_by("-created_at").first()
        if not round_obj:
            return Response({"round": None, "bets": [], "total_staked": "0", "total_payout": "0"})

        bets = (
            Bet.objects.filter(round=round_obj)
            .exclude(status__in=[Bet.Status.PENDING, Bet.Status.REFUNDED])
            .select_related("user")
            .order_by("-placed_at")
        )
        total_staked = bets.aggregate(v=Sum("amount"))["v"] or 0
        total_payout = bets.filter(status=Bet.Status.CASHED_OUT).aggregate(v=Sum("payout"))["v"] or 0

        return Response({
            "round": round_obj.public_dict(reveal_seed=True),
            "bets": AdminBetSerializer(bets, many=True).data,
            "total_staked": str(total_staked),
            "total_payout": str(total_payout),
            "running_profit": str(total_staked - total_payout),
        })