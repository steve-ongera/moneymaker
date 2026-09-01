"""
Django Channels has no built-in JWT support. This middleware pulls the access token
out of the WebSocket connection's query string (?token=...), validates it with
SimpleJWT, and attaches the resolved user to `scope["user"]` — exactly like DRF's
JWTAuthentication does for HTTP requests.
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token: str):
    from .models import User
    try:
        validated = AccessToken(token)
        user_id = validated["user_id"]
        return User.objects.get(pk=user_id)
    except (TokenError, InvalidToken, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
