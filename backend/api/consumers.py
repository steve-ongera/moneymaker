"""
WebSocket protocol for MoneyMaker Aviator.

Server -> client events (broadcast to the whole room, forwarded from the game engine):
    round.started, round.running, multiplier.update, round.crashed, round.settled

Server -> client events (personal, sent to the connecting user only):
    bet.confirmed, bet.rejected, cashout.success, cashout.failed, state.sync, pong

Client -> server messages:
    {"type": "ping"}                      -> replies {"type": "pong", "server_time": ...}
    {"type": "state.request"}             -> replies with a full state.sync snapshot

Betting and cash-out themselves are placed over REST (POST /aviator/bet/,
POST /aviator/cashout/) so they get a synchronous HTTP response for optimistic-UI
purposes; the same confirmation is ALSO pushed here so every open tab/device for that
user stays in sync in real time.
"""

import json
import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .game_engine import GROUP_NAME
from .models import Bet, GameRound

logger = logging.getLogger("aviator.consumer")


class AviatorConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)  # custom code: unauthenticated
            return

        self.user = user
        self.user_group = f"user_{user.id}"

        await self.channel_layer.group_add(GROUP_NAME, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

        await self.send_json(await self._build_state_snapshot())

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(GROUP_NAME, self.channel_name)
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "ping":
            await self.send_json({"type": "pong", "server_time": timezone.now().isoformat()})
            return

        if msg_type == "state.request":
            await self.send_json(await self._build_state_snapshot())
            return

        await self.send_json({"type": "error", "message": f"Unknown message type: {msg_type}"})

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        # Guard against malformed JSON so one bad frame can't kill the connection.
        try:
            content = json.loads(text_data)
        except (TypeError, ValueError):
            await self.send_json({"type": "error", "message": "Invalid JSON"})
            return
        await self.receive_json(content)

    # ----------------------------------------------------------
    # Broadcast relay — fired by channel_layer.group_send(type="engine.event")
    # ----------------------------------------------------------
    async def engine_event(self, event):
        await self.send_json(event["payload"])

    # Personal events sent by REST views via group_send(type="user.event")
    async def user_event(self, event):
        await self.send_json(event["payload"])

    # ----------------------------------------------------------
    # State reconciliation (used on connect AND on client-requested resync)
    # ----------------------------------------------------------
    async def _build_state_snapshot(self):
        from channels.db import database_sync_to_async

        @database_sync_to_async
        def _fetch():
            round_obj = GameRound.objects.order_by("-created_at").first()
            active_bet = None
            if round_obj:
                active_bet = (
                    Bet.objects.filter(user=self.user, round=round_obj, status=Bet.Status.ACTIVE)
                    .first()
                )
            wallet_balance = str(self.user.wallet.balance) if hasattr(self.user, "wallet") else "0.00"
            return round_obj, active_bet, wallet_balance

        round_obj, active_bet, wallet_balance = await _fetch()

        return {
            "type": "state.sync",
            "server_time": timezone.now().isoformat(),
            "wallet_balance": wallet_balance,
            "round": round_obj.public_dict(reveal_seed=True) if round_obj else None,
            "active_bet": (
                {
                    "bet_id": str(active_bet.id),
                    "amount": str(active_bet.amount),
                    "status": active_bet.status,
                }
                if active_bet
                else None
            ),
        }


# api/consumers.py — add alongside AviatorConsumer
class AdminConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        logger.warning(f"AdminConsumer connect: user={user!r} authenticated={getattr(user, 'is_authenticated', None)} is_staff={getattr(user, 'is_staff', None)}")
        if user is None or not user.is_authenticated or not user.is_staff:
            await self.close(code=4403)
            return
        await self.channel_layer.group_add(GROUP_NAME, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(GROUP_NAME, self.channel_name)

    async def engine_event(self, event):
        await self.send_json(event["payload"])