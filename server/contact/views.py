from rest_framework import generics, status
from rest_framework.response import Response
from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactCreateView(generics.CreateAPIView):
    """API endpoint to submit a contact form message."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {
                'message': 'Thank you for contacting MERS Tassel! We will get back to you soon.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
