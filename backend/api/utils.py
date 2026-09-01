import re
import uuid

from django.utils.text import slugify


def generate_unique_username(email, User):
    """Derive a unique username from the local part of an email."""
    base = slugify(re.sub(r"@.*$", "", email)) or "user"
    base = base[:20]
    username = base
    while User.objects.filter(username__iexact=username).exists():
        username = f"{base}{uuid.uuid4().hex[:6]}"
    return username