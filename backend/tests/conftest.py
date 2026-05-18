import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from decimal import Decimal

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123!'
    )


@pytest.fixture
def admin_user(db):
    u = User.objects.create_user(
        username='superadmin',
        email='admin@example.com',
        password='adminpass123!'
    )
    u.is_kiosk_admin = True
    u.is_staff = True
    u.save()
    return u


@pytest.fixture
def auth_client(api_client, user):
    token, _ = Token.objects.get_or_create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    token, _ = Token.objects.get_or_create(user=admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return api_client


@pytest.fixture
def category(db, user):
    from products.models import Category
    return Category.objects.create(name='음료', created_by=user)


@pytest.fixture
def product(db, user, category):
    from products.models import Product
    return Product.objects.create(
        name='아메리카노',
        price=Decimal('4500.00'),
        category=category,
        stock_quantity=10,
        is_available=True,
        created_by=user,
    )
