import asyncio
import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# django_asgi_app must be created before importing anything that touches models,
# so Django's app registry is fully populated first.
django_asgi_app = get_asgi_application()

from api.middleware import JWTAuthMiddleware  # noqa: E402
from api.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)

_engine_task = None
_engine_lock = asyncio.Lock()


class EngineBootstrapMiddleware:
    """
    Dev convenience: starts the authoritative round engine as a background task
    on the SAME event loop as the server, the first time any connection comes
    in. This is what lets `python manage.py runserver` be the only process you
    need locally — no separate engine process, no Redis.

    In production (multi-worker, Redis-backed channel layer), don't rely on
    this — run the engine as its own process via `python manage.py run_engine`
    instead, so it isn't duplicated per worker.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        await self._ensure_engine_started()
        return await self.inner(scope, receive, send)

    async def _ensure_engine_started(self):
        global _engine_task
        async with _engine_lock:
            if _engine_task is None:
                from api.game_engine import engine
                _engine_task = asyncio.create_task(engine.run_forever())


application = ProtocolTypeRouter({
    "http": EngineBootstrapMiddleware(django_asgi_app),
    "websocket": EngineBootstrapMiddleware(JWTAuthMiddleware(URLRouter(websocket_urlpatterns))),
})