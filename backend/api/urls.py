#api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),

    # Profile
    path("me/", views.MeView.as_view(), name="me"),

    # Wallet
    path("wallet/", views.WalletView.as_view(), name="wallet"),
    path("wallet/transactions/", views.WalletTransactionsView.as_view(), name="wallet-transactions"),

    # Deposits (M-Pesa STK Push)
    path("deposit/initiate/", views.DepositInitiateView.as_view(), name="deposit-initiate"),
    path("deposit/status/<str:checkout_request_id>/", views.DepositStatusView.as_view(), name="deposit-status"),

    # M-Pesa Callbacks (Public URL - no authentication)
    path("mpesa/callback/", views.MpesaCallbackView.as_view(), name="mpesa-callback"),

    # Withdrawals
    path("withdrawal/initiate/", views.WithdrawalInitiateView.as_view(), name="withdrawal-initiate"),

    # Aviator
    path("aviator/current-round/", views.CurrentRoundView.as_view(), name="aviator-current-round"),
    path("aviator/history/", views.RoundHistoryView.as_view(), name="aviator-history"),
    path("aviator/bet/", views.PlaceBetView.as_view(), name="aviator-bet"),
    path("aviator/cashout/", views.CashoutView.as_view(), name="aviator-cashout"),
    path("aviator/my-bets/", views.MyBetsView.as_view(), name="aviator-my-bets"),
    path("aviator/fairness/verify/", views.FairnessVerifyView.as_view(), name="aviator-fairness-verify"),
    
    path("admin/engine/status/", views.AdminEngineStatusView.as_view()),
    path("admin/engine/pause/", views.AdminEnginePauseView.as_view()),
    path("admin/engine/resume/", views.AdminEngineResumeView.as_view()),
        
    # Two-step auth
    path("admin/auth/login/", views.AdminLoginStep1View.as_view(), name="admin-login-step1"),
    path("admin/auth/otp/verify/", views.AdminOTPVerifyView.as_view(), name="admin-otp-verify"),
    path("admin/auth/otp/resend/", views.AdminOTPResendView.as_view(), name="admin-otp-resend"),
 
    # Dashboard data
    path("admin/stats/", views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/users/", views.AdminUsersListView.as_view(), name="admin-users"),
    path("admin/transactions/", views.AdminTransactionsListView.as_view(), name="admin-transactions"),
    path("admin/rounds/", views.AdminRoundsListView.as_view(), name="admin-rounds"),
    path("admin/rounds/current/", views.AdminCurrentRoundView.as_view(), name="admin-current-round"),
]