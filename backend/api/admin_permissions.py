from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """
    Only lets in authenticated users with is_staff=True.
    A normal player's JWT (even if stolen) will always fail this check,
    since staff status lives on the User row, not the token.
    """
    message = "Admin access only."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
            and request.user.is_active
        )