from django.urls import re_path

from .consumers import AviatorConsumer , AdminConsumer

websocket_urlpatterns = [
    re_path(r"^ws/aviator/$", AviatorConsumer.as_asgi()),
    re_path(r"^ws/admin/$", AdminConsumer.as_asgi()),
]
