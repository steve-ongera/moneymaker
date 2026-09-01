import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

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
