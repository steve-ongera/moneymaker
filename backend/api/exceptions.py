import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("aviator.errors")


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler so every error the client sees is a clean
    {"error": {"code": ..., "message": ...}} payload — never a raw Django traceback.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        detail = response.data
        message = detail.get("detail") if isinstance(detail, dict) else detail
        response.data = {
            "error": {
                "code": response.status_code,
                "message": message if isinstance(message, str) else detail,
            }
        }
        return response

    # Unhandled exception -> log it fully server-side, return a generic message.
    logger.exception("Unhandled exception in view: %s", exc)
    from rest_framework.response import Response
    from rest_framework import status
    return Response(
        {"error": {"code": 500, "message": "An unexpected error occurred. Please try again."}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
