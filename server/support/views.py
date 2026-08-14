import uuid
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CannedResponse, Ticket
from .serializers import CannedResponseSerializer, TicketMessageSerializer, TicketSerializer


class IsSupportStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.select_related('order', 'customer', 'assigned_to').prefetch_related('messages__author')
    serializer_class = TicketSerializer
    permission_classes = [IsSupportStaff]

    def perform_create(self, serializer):
        serializer.save(number=f'TK-{uuid.uuid4().hex[:6].upper()}')

    def get_queryset(self):
        queryset = super().get_queryset()
        for field in ('status', 'priority', 'assigned_to'):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ticket=ticket, author=request.user)
        ticket.save(update_fields=['updated_at'])
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CannedResponseViewSet(viewsets.ModelViewSet):
    queryset = CannedResponse.objects.filter(is_active=True)
    serializer_class = CannedResponseSerializer
    permission_classes = [IsSupportStaff]
