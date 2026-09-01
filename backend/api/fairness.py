"""
Provably-fair crash point generation.

    server_seed (secret) + client_seed + nonce  --HMAC-SHA256-->  crash_multiplier

- server_seed is generated fresh for every round and kept secret until the round crashes.
- server_seed_hash (SHA-256 of server_seed) is published to players BEFORE betting opens,
  so they can later confirm the revealed server_seed matches.
- client_seed + nonce are also published before the round starts.
- Because the HMAC input is fixed before betting opens, the crash point cannot be changed
  based on who bets or how much.

This uses cryptographic hashing (hmac/hashlib), never Python's `random` module.
"""

import hashlib
import hmac
import secrets
from decimal import ROUND_DOWN, Decimal

from django.conf import settings


def generate_server_seed() -> str:
    return secrets.token_hex(32)


def hash_server_seed(server_seed: str) -> str:
    return hashlib.sha256(server_seed.encode("utf-8")).hexdigest()


def generate_client_seed() -> str:
    return secrets.token_hex(8)


def _house_edge() -> Decimal:
    return Decimal(settings.AVIATOR_HOUSE_EDGE_PERCENT) / Decimal("100")


def compute_crash_multiplier(server_seed: str, client_seed: str, nonce: int) -> Decimal:
    """
    Deterministically derive the crash multiplier for a round.

    1. HMAC-SHA256(key=server_seed, msg=f"{client_seed}:{nonce}")
    2. Take the first 52 bits (13 hex chars) of the digest as an integer `h`.
    3. A small fraction of rounds (the house edge) instantly resolve at 1.00x.
    4. Otherwise map h -> a multiplier using 1 / (1 - r) style crash-game math,
       scaled down by the house edge, floored to 2 decimal places, minimum 1.00x.
    """
    message = f"{client_seed}:{nonce}".encode("utf-8")
    digest = hmac.new(server_seed.encode("utf-8"), message, hashlib.sha256).hexdigest()

    h = int(digest[:13], 16)
    e = 2 ** 52
    edge = _house_edge()

    if Decimal(h) < edge * Decimal(e):
        return Decimal("1.00")

    raw = Decimal(e) / Decimal(e - h)
    result = (raw * (Decimal("1") - edge)).quantize(Decimal("0.01"), rounding=ROUND_DOWN)

    if result < Decimal("1.00"):
        result = Decimal("1.00")
    return result


def verify(server_seed: str, server_seed_hash: str, client_seed: str, nonce: int):
    """
    Independent verification used by /api/v1/aviator/fairness/verify/.
    Returns (is_valid, recomputed_crash_multiplier, recomputed_hash).
    """
    recomputed_hash = hash_server_seed(server_seed)
    recomputed_multiplier = compute_crash_multiplier(server_seed, client_seed, nonce)
    is_valid = hmac.compare_digest(recomputed_hash, server_seed_hash)
    return is_valid, recomputed_multiplier, recomputed_hash
