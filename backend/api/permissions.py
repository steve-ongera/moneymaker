from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission: the requesting user must own the object."""

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None)
        return owner is not None and owner == request.user
