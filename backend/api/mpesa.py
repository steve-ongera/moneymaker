"""
M-Pesa Daraja API client (STK Push / Lipa Na M-Pesa Online).
api/mpesa.py
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
import uuid
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


def _generate_mock_response(phone_number: str, amount: int, account_reference: str) -> dict:
    """
    Generate a mock STK push response for DEBUG mode.
    This bypasses the actual M-Pesa API call.
    """
    checkout_request_id = f"MOCK{uuid.uuid4().hex[:16].upper()}"
    merchant_request_id = f"MOCK{uuid.uuid4().hex[:16].upper()}"
    
    logger.info(f"MOCK STK Push: Phone={phone_number}, Amount={amount}, Ref={account_reference}")
    logger.info(f"MOCK CheckoutRequestID: {checkout_request_id}")
    
    return {
        "MerchantRequestID": merchant_request_id,
        "CheckoutRequestID": checkout_request_id,
        "ResponseCode": "0",
        "ResponseDescription": "Success. Request accepted for processing",
        "CustomerMessage": "Success. Request accepted for processing",
        "ResultCode": "0",
        "ResultDesc": "Success",
    }


def stk_push(*, phone_number: str, amount: int, account_reference: str, transaction_desc: str = "Aviator Deposit"):
    """
    Initiates an STK push (prompts the user's phone for their M-Pesa PIN).
    Returns Safaricom's response dict, which includes CheckoutRequestID and
    MerchantRequestID — store these on the Deposit row so the callback can
    match the result back to it.
    
    If DEBUG=True, this bypasses the actual M-Pesa API and returns a mock response.
    """
    # Bypass M-Pesa in DEBUG mode
    if settings.DEBUG:
        logger.info("DEBUG mode: Bypassing M-Pesa STK push")
        return _generate_mock_response(phone_number, amount, account_reference)
    
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


def query_status(checkout_request_id: str) -> dict:
    """
    Query the status of an STK push transaction.
    
    If DEBUG=True and the checkout_request_id starts with 'MOCK', returns a mock response.
    """
    # Bypass M-Pesa query in DEBUG mode for mock transactions
    if settings.DEBUG and checkout_request_id.startswith("MOCK"):
        logger.info(f"DEBUG mode: Mock query for CheckoutRequestID: {checkout_request_id}")
        return {
            "ResponseCode": "0",
            "ResponseDescription": "Success. Request accepted for processing",
            "MerchantRequestID": f"MOCK{uuid.uuid4().hex[:16].upper()}",
            "CheckoutRequestID": checkout_request_id,
            "ResultCode": "0",
            "ResultDesc": "The service request is processed successfully.",
        }
    
    token = get_access_token()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
    ).decode()

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id,
    }

    resp = requests.post(
        f"{_base_url()}/mpesa/stkpushquery/v1/query",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    data = resp.json()

    if resp.status_code != 200:
        logger.error("mpesa query status failed: %s %s", resp.status_code, data)
        raise MpesaError(data.get("errorMessage") or "Query failed")

    return data


def simulate_mock_callback(checkout_request_id: str, success: bool = True) -> dict:
    """
    Simulate an M-Pesa callback for mock transactions in DEBUG mode.
    This is useful for testing the callback flow without actually receiving
    a callback from Safaricom.
    """
    if not settings.DEBUG:
        raise MpesaError("Mock callback simulation is only available in DEBUG mode")
    
    if not checkout_request_id.startswith("MOCK"):
        raise MpesaError("Invalid mock checkout_request_id")
    
    if success:
        return {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": f"MOCK{uuid.uuid4().hex[:16].upper()}",
                    "CheckoutRequestID": checkout_request_id,
                    "ResultCode": "0",
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": "500.00"},
                            {"Name": "MpesaReceiptNumber", "Value": f"MOCK{str(uuid.uuid4().hex[:10]).upper()}"},
                            {"Name": "TransactionDate", "Value": datetime.now().strftime("%Y%m%d%H%M%S")},
                            {"Name": "PhoneNumber", "Value": "254700000000"},
                        ]
                    }
                }
            }
        }
    else:
        return {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": f"MOCK{uuid.uuid4().hex[:16].upper()}",
                    "CheckoutRequestID": checkout_request_id,
                    "ResultCode": "1032",
                    "ResultDesc": "Request cancelled by user",
                }
            }
        }