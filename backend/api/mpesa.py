"""
M-Pesa Daraja API client (STK Push / Lipa Na M-Pesa Online).

Only handles the customer-initiated deposit flow (STK push). B2C payouts
(for withdrawals) use a different, more involved credential setup
(initiator name + security credential) and are intentionally not wired up
here — see views.WithdrawalInitiateView for the current manual/PENDING
handling of withdrawals.

Required settings (pull from env — see .env.example):
    MPESA_ENV                 "sandbox" or "production"
    MPESA_CONSUMER_KEY
    MPESA_CONSUMER_SECRET
    MPESA_SHORTCODE           Paybill/Till number (sandbox default: 174379)
    MPESA_PASSKEY
    MPESA_CALLBACK_URL        Publicly reachable HTTPS URL for the callback
                               (use ngrok/similar in local dev if you ever
                               flip DEBUG off locally to test the real flow)
"""

import base64
import logging
from datetime import datetime

import requests
from django.conf import settings

logger = logging.getLogger("aviator.mpesa")


class MpesaError(Exception):
    pass


def _base_url() -> str:
    if getattr(settings, "MPESA_ENV", "sandbox") == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def format_phone(raw_phone: str) -> str:
    """
    Normalize a Kenyan phone number to the 2547XXXXXXXX / 2541XXXXXXXX format
    Safaricom's API requires. Accepts 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX,
    +2547XXXXXXXX.
    """
    phone = "".join(ch for ch in raw_phone if ch.isdigit())

    if phone.startswith("254") and len(phone) == 12:
        return phone
    if phone.startswith("0") and len(phone) == 10:
        return "254" + phone[1:]
    if phone.startswith("7") or phone.startswith("1"):
        if len(phone) == 9:
            return "254" + phone

    raise MpesaError(f"Invalid phone number format: {raw_phone!r}")


def get_access_token() -> str:
    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    resp = requests.get(
        url,
        auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
        timeout=15,
    )
    if resp.status_code != 200:
        logger.error("mpesa oauth failed: %s %s", resp.status_code, resp.text)
        raise MpesaError("Could not authenticate with M-Pesa")
    return resp.json()["access_token"]


def stk_push(*, phone_number: str, amount: int, account_reference: str, transaction_desc: str = "Aviator Deposit"):
    """
    Initiates an STK push (prompts the user's phone for their M-Pesa PIN).
    Returns Safaricom's response dict, which includes CheckoutRequestID and
    MerchantRequestID — store these on the Deposit row so the callback can
    match the result back to it.
    """
    token = get_access_token()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
    ).decode()

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": account_reference[:12],  # Safaricom limits this field
        "TransactionDesc": transaction_desc,
    }

    resp = requests.post(
        f"{_base_url()}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    data = resp.json()

    if resp.status_code != 200 or data.get("ResponseCode") not in (0, "0"):
        logger.error("mpesa stk push failed: %s %s", resp.status_code, data)
        raise MpesaError(data.get("errorMessage") or data.get("ResponseDescription") or "STK push failed")

    return data