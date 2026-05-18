import pytest
from decimal import Decimal
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from products.models import Category, Product, CartItem, Order

User = get_user_model()
pytestmark = pytest.mark.django_db


class TestUserModel:
    def test_str(self, user):
        assert str(user) == 'testuser'

    def test_kiosk_admin_default_false(self, user):
        assert user.is_kiosk_admin is False

    def test_ecash_enabled_default_false(self, user):
        assert user.ecash_enabled is False

    def test_lightning_address_nullable(self, user):
        assert user.lightning_address is None

    def test_usdt_address_nullable(self, user):
        assert user.usdt_address is None


class TestCategoryModel:
    def test_str(self, category):
        assert str(category) == '음료'

    def test_created_by(self, category, user):
        assert category.created_by == user

    def test_ordering_by_name(self, db, user):
        Category.objects.create(name='커피', created_by=user)
        Category.objects.create(name='주스', created_by=user)
        cats = list(Category.objects.filter(created_by=user).values_list('name', flat=True))
        assert cats == sorted(cats)


class TestProductModel:
    def test_str(self, product):
        assert str(product) == '아메리카노'

    def test_image_display_url_no_image_no_url(self, product):
        assert product.image_display_url == ''

    def test_image_display_url_with_url(self, product):
        product.image_url = 'https://example.com/image.jpg'
        assert product.image_display_url == 'https://example.com/image.jpg'

    def test_price_decimal_precision(self, product):
        assert product.price == Decimal('4500.00')

    def test_is_available_default_true(self, product):
        assert product.is_available is True

    def test_stock_quantity(self, product):
        assert product.stock_quantity == 10

    def test_category_relation(self, product, category):
        assert product.category == category


class TestCartItemModel:
    def test_total_price_single(self, db, user, product):
        item = CartItem.objects.create(user=user, product=product, quantity=1)
        assert item.total_price == Decimal('4500.00')

    def test_total_price_multiple(self, db, user, product):
        item = CartItem.objects.create(user=user, product=product, quantity=3)
        assert item.total_price == Decimal('13500.00')

    def test_str_contains_username_and_product(self, db, user, product):
        item = CartItem.objects.create(user=user, product=product, quantity=2)
        s = str(item)
        assert 'testuser' in s
        assert '아메리카노' in s
        assert 'x2' in s

    def test_unique_together_raises_on_duplicate(self, db, user, product):
        CartItem.objects.create(user=user, product=product, quantity=1)
        with pytest.raises(IntegrityError):
            CartItem.objects.create(user=user, product=product, quantity=2)


class TestOrderModel:
    def test_str_contains_order_number_and_username(self, db, user):
        order = Order.objects.create(
            user=user,
            order_number='ORD001',
            payment_method='cash',
            subtotal=Decimal('9000.00'),
            total_amount=Decimal('9000.00'),
        )
        assert 'ORD001' in str(order)
        assert 'testuser' in str(order)

    def test_default_status_is_pending(self, db, user):
        order = Order.objects.create(
            user=user,
            order_number='ORD002',
            payment_method='lightning',
            subtotal=Decimal('4500.00'),
            total_amount=Decimal('4500.00'),
        )
        assert order.status == 'pending'

    def test_ordering_newest_first(self, db, user):
        Order.objects.create(
            user=user, order_number='ORD003', payment_method='cash',
            subtotal=Decimal('1000.00'), total_amount=Decimal('1000.00'),
        )
        Order.objects.create(
            user=user, order_number='ORD004', payment_method='ecash',
            subtotal=Decimal('2000.00'), total_amount=Decimal('2000.00'),
        )
        orders = list(Order.objects.filter(user=user))
        assert orders[0].order_number == 'ORD004'
