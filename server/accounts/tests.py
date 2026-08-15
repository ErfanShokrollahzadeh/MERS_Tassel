from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from commerce.models import Cart
from .models import UserProfile


User = get_user_model()


class AuthenticationApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.payload = {
            'email': 'collector@example.com',
            'first_name': 'Maya',
            'last_name': 'Collector',
            'password': 'G0ldenAtelier!2026',
        }

    def test_signup_hashes_password_assigns_customer_role_and_creates_bag(self):
        response = self.client.post('/api/accounts/register/', self.payload, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        user = User.objects.get(email=self.payload['email'])
        self.assertNotEqual(user.password, self.payload['password'])
        self.assertTrue(user.check_password(self.payload['password']))
        self.assertEqual(user.profile.role, UserProfile.Role.CUSTOMER)
        self.assertEqual(user.profile.email, self.payload['email'])
        self.assertTrue(Cart.objects.filter(user=user, status=Cart.Status.OPEN).exists())

    def test_email_uniqueness_is_case_insensitive(self):
        first = self.client.post('/api/accounts/register/', self.payload, format='json')
        duplicate = self.client.post('/api/accounts/register/', {**self.payload, 'email': 'COLLECTOR@example.com'}, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(duplicate.status_code, 400)

    def test_login_and_profile_use_bearer_jwt(self):
        self.client.post('/api/accounts/register/', self.payload, format='json')
        login = self.client.post('/api/accounts/login/', {'email': self.payload['email'], 'password': self.payload['password']}, format='json')
        self.assertEqual(login.status_code, 200, login.data)

        guest_profile = self.client.get('/api/accounts/profile/')
        self.assertEqual(guest_profile.status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        profile = self.client.get('/api/accounts/profile/')
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['email'], self.payload['email'])
        self.assertEqual(profile.data['role'], UserProfile.Role.CUSTOMER)

    def test_invalid_password_returns_401(self):
        self.client.post('/api/accounts/register/', self.payload, format='json')
        response = self.client.post('/api/accounts/login/', {'email': self.payload['email'], 'password': 'wrong-password'}, format='json')
        self.assertEqual(response.status_code, 401)

    def test_logout_blacklists_refresh_token(self):
        signup = self.client.post('/api/accounts/register/', self.payload, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {signup.data['access']}")
        logout = self.client.post('/api/accounts/logout/', {'refresh': signup.data['refresh']}, format='json')
        self.assertEqual(logout.status_code, 204)

        self.client.credentials()
        refreshed = self.client.post('/api/accounts/token/refresh/', {'refresh': signup.data['refresh']}, format='json')
        self.assertEqual(refreshed.status_code, 401)
