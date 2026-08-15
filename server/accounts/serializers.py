"""Account serializers for email-based customer authentication."""

import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import UserProfile


User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(write_only=True, required=True, min_length=8, style={'input_type': 'password'})

    def validate_email(self, value):
        email = User.objects.normalize_email(value).lower()
        if UserProfile.objects.filter(email__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def validate(self, attrs):
        candidate = User(email=attrs['email'], first_name=attrs['first_name'], last_name=attrs['last_name'])
        validate_password(attrs['password'], user=candidate)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=f"customer_{uuid.uuid4().hex}",
            email=validated_data['email'],
            first_name=validated_data['first_name'].strip(),
            last_name=validated_data['last_name'].strip(),
            password=validated_data['password'],
        )
        UserProfile.objects.create(user=user, email=user.email, role=UserProfile.Role.CUSTOMER)

        # Every registered customer starts with one durable, user-owned bag.
        from commerce.models import Cart
        Cart.objects.create(user=user, email=user.email)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate_email(self, value):
        return User.objects.normalize_email(value).lower()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True, write_only=True)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'date_joined', 'role')
        read_only_fields = fields

    def get_role(self, user):
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'email': user.email.lower(),
                'role': UserProfile.Role.ADMIN if user.is_superuser else UserProfile.Role.STAFF if user.is_staff else UserProfile.Role.CUSTOMER,
            },
        )
        return profile.role
