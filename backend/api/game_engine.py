"""
Game engine — the single authoritative process that creates rounds, advances the
multiplier deterministically from server-elapsed time, and broadcasts state over the
Channels layer. This is the ONLY code path allowed to create/advance GameRound rows.

Run it as a standalone process alongside Daphne:

    python manage.py run_game_engine

It never trusts anything from the frontend — crash points are pre-committed via
api.fairness before betting opens, and the multiplier shown to clients is always
recomputed from `round.started_at`, never accumulated client-side.
"""

import asyncio
import logging
import math
import secrets
from datetime import timedelta
from decimal import ROUND_DOWN, Decimal

from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from django.conf import settings
from django.utils import timezone

from .fairness import compute_crash_multiplier, generate_server_seed, hash_server_seed
from .models import GameRound
from .wallet import WalletService

logger = logging.getLogger("aviator.engine")

GROUP_NAME = "aviator_room"
BROADCAST_INTERVAL_SECONDS = 0.1  # 10 updates/sec — deliberately not 100ms polling from clients


def calculate_multiplier(elapsed_seconds: Decimal) -> Decimal:
    """
    Deterministic, time-based multiplier curve. Recomputable at any instant from
    elapsed server time, so it never drifts and never depends on how many ticks
    have been broadcast (no accumulated floating-point error).
    """
    if elapsed_seconds <= 0:
        return Decimal("1.00")
    growth_rate = float(settings.AVIATOR_GROWTH_RATE)
    value = Decimal(str(math.exp(growth_rate * float(elapsed_seconds))))
    return value.quantize(Decimal("0.01"), rounding=ROUND_DOWN)


class RoundEngine:
    """Singleton game loop."""

    def __init__(self):
        self.channel_layer = get_channel_layer()

    async def run_forever(self):
        logger.info("MoneyMaker Aviator engine starting")
        while True:
            try:
                await self._run_single_round()
            except Exception:
                logger.exception("Round loop crashed — recovering in 2s")
                await asyncio.sleep(2)

    async def _run_single_round(self):
        round_obj = await self._create_round()

        await self._broadcast({
            "type": "round.started",
            "round_id": round_obj.round_id,
            "status": GameRound.Status.BETTING_OPEN,
            "server_time": timezone.now().isoformat(),
            "betting_closes_at": round_obj.betting_closes_at.isoformat(),
            "server_seed_hash": round_obj.server_seed_hash,
            "client_seed": round_obj.client_seed,
            "nonce": round_obj.nonce,
        })

        await asyncio.sleep(settings.AVIATOR_BETTING_DURATION_SECONDS)

        round_obj.status = GameRound.Status.RUNNING
        round_obj.started_at = timezone.now()
        await self._save(round_obj)

        await self._broadcast({
            "type": "round.running",
            "round_id": round_obj.round_id,
            "server_time": round_obj.started_at.isoformat(),
        })

        await self._run_multiplier_loop(round_obj)
        await self._settle_round(round_obj)
        await asyncio.sleep(settings.AVIATOR_WAITING_DURATION_SECONDS)

    async def _run_multiplier_loop(self, round_obj: GameRound):
        while True:
            elapsed = Decimal(str((timezone.now() - round_obj.started_at).total_seconds()))
            multiplier = calculate_multiplier(elapsed)

            if multiplier >= round_obj.crash_multiplier:
                await self._crash_round(round_obj)
                return

            await self._broadcast({
                "type": "multiplier.update",
                "round_id": round_obj.round_id,
                "multiplier": str(multiplier),
                "server_time": timezone.now().isoformat(),
            })
            await asyncio.sleep(BROADCAST_INTERVAL_SECONDS)

    # ----------------------------------------------------------
    # DB-touching helpers (wrapped for the async loop)
    # ----------------------------------------------------------
    async def _create_round(self) -> GameRound:
        return await sync_to_async(self._create_round_sync)()

    def _create_round_sync(self) -> GameRound:
        server_seed = generate_server_seed()
        server_seed_hash = hash_server_seed(server_seed)
        client_seed = secrets.token_hex(8)

        last = GameRound.objects.order_by("-id").first()
        seq = (last.id + 1) if last else 1
        nonce = seq
        round_id = f"MM-{timezone.now().strftime('%Y%m%d')}-{seq:06d}"

        crash_multiplier = compute_crash_multiplier(server_seed, client_seed, nonce)
        now = timezone.now()

        return GameRound.objects.create(
            round_id=round_id,
            status=GameRound.Status.BETTING_OPEN,
            server_seed=server_seed,
            server_seed_hash=server_seed_hash,
            client_seed=client_seed,
            nonce=nonce,
            crash_multiplier=crash_multiplier,
            betting_opens_at=now,
            betting_closes_at=now + timedelta(seconds=settings.AVIATOR_BETTING_DURATION_SECONDS),
        )

    async def _save(self, round_obj: GameRound):
        await sync_to_async(round_obj.save)()

    async def _crash_round(self, round_obj: GameRound):
        round_obj.status = GameRound.Status.CRASHED
        round_obj.crashed_at = timezone.now()
        await self._save(round_obj)

        await self._broadcast({
            "type": "round.crashed",
            "round_id": round_obj.round_id,
            "crash_multiplier": str(round_obj.crash_multiplier),
            "server_seed": round_obj.server_seed,  # reveal now that the round is over
            "server_time": round_obj.crashed_at.isoformat(),
        })

    async def _settle_round(self, round_obj: GameRound):
        await sync_to_async(WalletService.settle_round)(round_obj)
        round_obj.status = GameRound.Status.SETTLED
        round_obj.settled_at = timezone.now()
        await self._save(round_obj)

        await self._broadcast({
            "type": "round.settled",
            "round_id": round_obj.round_id,
        })

    async def _broadcast(self, payload: dict):
        await self.channel_layer.group_send(
            GROUP_NAME,
            {"type": "engine.event", "payload": payload},
        )


engine = RoundEngine()