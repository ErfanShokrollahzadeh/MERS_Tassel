from django.contrib.auth.models import User
from django.test import TestCase
from .models import Ticket, TicketMessage


class SupportPrivacyTests(TestCase):
    def test_internal_note_is_explicitly_private(self):
        staff = User.objects.create_user('support', password='test', is_staff=True)
        ticket = Ticket.objects.create(number='TK-TEST', subject='Care question', customer_name='Collector', customer_email='collector@example.com')
        note = TicketMessage.objects.create(ticket=ticket, author=staff, body='Offer atelier repair.', is_internal=True)
        self.assertTrue(note.is_internal)
        self.assertEqual(ticket.messages.count(), 1)
