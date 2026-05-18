import json
import pytest
from rest_framework import status
from decimal import Decimal
from django.test import Client as DjangoClient
from products.models import Category, Product, CartItem, Order

pytestmark = pytest.mark.django_db


class TestCategoryViews:
    url = '/api/products/categories/'

    def test_list_categories(self, auth_client, category):
        response = auth_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        names = [c['name'] for c in response.data]
        assert '음료' in names

    def test_create_category(self, auth_client):
        data = {'name': '디저트', 'description': '달콤한 디저트'}
        response = auth_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == '디저트'

    def test_list_categories_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_category(self, auth_client, category):
        data = {'name': '커피'}
        response = auth_client.patch(f'{self.url}{category.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == '커피'

    def test_delete_category(self, auth_client, category):
        response = auth_client.delete(f'{self.url}{category.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Category.objects.filter(id=category.id).exists()

    def test_user_product_categories(self, auth_client, product):
        response = auth_client.get('/api/products/categories/used/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True


class TestProductViews:
    url = '/api/products/'

    def test_list_products(self, auth_client, product):
        response = auth_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        names = [p['name'] for p in response.data]
        assert '아메리카노' in names

    def test_create_product(self, auth_client, category):
        data = {
            'name': '라떼',
            'price': '5000.00',
            'category': category.id,
            'stock_quantity': 20,
            'is_available': True,
        }
        response = auth_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == '라떼'

    def test_list_products_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_product_detail(self, auth_client, product):
        response = auth_client.get(f'{self.url}{product.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == '아메리카노'

    def test_update_product(self, auth_client, product):
        data = {'name': '콜드브루', 'price': '5500.00'}
        response = auth_client.patch(f'{self.url}{product.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == '콜드브루'

    def test_delete_product(self, auth_client, product):
        response = auth_client.delete(f'{self.url}{product.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_filter_products_by_category(self, auth_client, product, category):
        response = auth_client.get(f'{self.url}?category={category.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_available_products(self, auth_client, product):
        response = auth_client.get(f'{self.url}available/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        names = [p['name'] for p in response.data['products']]
        assert '아메리카노' in names

    def test_available_products_excludes_unavailable(self, auth_client, product):
        product.is_available = False
        product.save()
        response = auth_client.get(f'{self.url}available/')
        names = [p['name'] for p in response.data['products']]
        assert '아메리카노' not in names

    def test_available_products_filter_by_category(self, auth_client, product, category):
        response = auth_client.get(f'{self.url}available/?category={category.id}')
        assert response.status_code == status.HTTP_200_OK


class TestCartViews:
    cart_url = '/api/products/cart/'

    def test_get_empty_cart(self, auth_client):
        response = auth_client.get(self.cart_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['items'] == []
        assert response.data['item_count'] == 0

    def test_add_item_to_cart(self, auth_client, product):
        data = {'product_id': product.id, 'quantity': 2}
        response = auth_client.post(self.cart_url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True

    def test_add_nonexistent_product_to_cart(self, auth_client):
        data = {'product_id': 99999, 'quantity': 1}
        response = auth_client.post(self.cart_url, data, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_cart_with_items(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=1)
        response = auth_client.get(self.cart_url)
        assert response.data['item_count'] == 1
        assert response.data['success'] is True

    def test_cart_subtotal_calculation(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=2)
        response = auth_client.get(self.cart_url)
        subtotal = float(response.data['subtotal'])
        assert subtotal == pytest.approx(9000.0)

    def test_add_item_increments_existing(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=1)
        data = {'product_id': product.id, 'quantity': 1}
        auth_client.post(self.cart_url, data, format='json')
        item = CartItem.objects.get(user=user, product=product)
        assert item.quantity == 2

    def test_update_cart_item_quantity(self, auth_client, product, user):
        item = CartItem.objects.create(user=user, product=product, quantity=1)
        data = {'quantity': 3}
        response = auth_client.put(f'/api/products/cart/{item.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_remove_cart_item(self, auth_client, product, user):
        item = CartItem.objects.create(user=user, product=product, quantity=1)
        response = auth_client.delete(f'/api/products/cart/{item.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert not CartItem.objects.filter(id=item.id).exists()

    def test_clear_cart(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=2)
        response = auth_client.post('/api/products/cart/clear/')
        assert response.status_code == status.HTTP_200_OK
        assert CartItem.objects.filter(user=user).count() == 0

    def test_add_custom_item_authenticated(self, auth_client):
        data = {'name': '특별 메뉴', 'price': 8000, 'description': '오늘의 특선'}
        response = auth_client.post('/api/products/cart/add-custom/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True

    def test_add_custom_item_missing_name(self, auth_client):
        data = {'price': 5000}
        response = auth_client.post('/api/products/cart/add-custom/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_add_custom_item_missing_price(self, auth_client):
        data = {'name': '특별 메뉴'}
        response = auth_client.post('/api/products/cart/add-custom/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_add_custom_item_negative_price(self, auth_client):
        data = {'name': '테스트', 'price': -100}
        response = auth_client.post('/api/products/cart/add-custom/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cart_item_quantity_zero_removes_item(self, auth_client, product, user):
        item = CartItem.objects.create(user=user, product=product, quantity=1)
        data = {'quantity': 0}
        response = auth_client.put(f'/api/products/cart/{item.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert not CartItem.objects.filter(id=item.id).exists()

    def test_cart_item_not_found(self, auth_client):
        response = auth_client.delete('/api/products/cart/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestOrderViews:
    create_url = '/api/products/orders/create/'
    list_url = '/api/products/orders/'

    def _order_data(self, product, method='cash', discount=0):
        return {
            'payment_method': method,
            'discount_percentage': discount,
            'cart_items': [{'product_id': str(product.id), 'quantity': '1'}],
        }

    def test_create_order_cash(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=1)
        response = auth_client.post(self.create_url, self._order_data(product), format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert 'order' in response.data
        assert CartItem.objects.filter(user=user).count() == 0

    def test_create_order_clears_cart(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=2)
        auth_client.post(self.create_url, self._order_data(product, 'lightning'), format='json')
        assert CartItem.objects.filter(user=user).count() == 0

    def test_create_order_empty_cart(self, auth_client, product):
        data = self._order_data(product, 'lightning')
        response = auth_client.post(self.create_url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_order_with_discount(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=1)
        response = auth_client.post(self.create_url, self._order_data(product, 'ecash', 10), format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_order_requires_auth(self, api_client):
        response = api_client.post(self.create_url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_order_list(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=1)
        auth_client.post(self.create_url, self._order_data(product), format='json')
        response = auth_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['orders']) >= 1

    def test_order_detail(self, auth_client, product, user):
        CartItem.objects.create(user=user, product=product, quantity=1)
        create_resp = auth_client.post(self.create_url, self._order_data(product), format='json')
        order_id = create_resp.data['order']['id']
        response = auth_client.get(f'/api/products/orders/{order_id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_order_detail_not_found(self, auth_client):
        response = auth_client.get('/api/products/orders/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_order_list_requires_auth(self, api_client):
        response = api_client.get(self.list_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestNut18PaymentView:
    def test_post_payment_request_success(self, api_client):
        pid = 'test-pay-001'
        data = {
            'id': pid,
            'proofs': [{'amount': 100, 'secret': 'abc', 'C': 'xyz', 'id': 'mint01'}],
            'unit': 'sat',
            'mint': 'https://mint.example.com',
            'memo': '테스트'
        }
        response = api_client.post(f'/api/products/payments/requests/{pid}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_get_payment_request_unpaid(self, api_client):
        response = api_client.get('/api/products/payments/requests/nonexistent-id/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['paid'] is False

    def test_post_payment_request_id_mismatch(self, api_client):
        data = {'id': 'wrong-id', 'proofs': []}
        response = api_client.post('/api/products/payments/requests/actual-id/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_post_payment_request_missing_proofs(self, api_client):
        pid = 'test-no-proofs'
        data = {'id': pid}
        response = api_client.post(f'/api/products/payments/requests/{pid}/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_payment_after_post(self, api_client):
        pid = 'test-roundtrip'
        proofs = [{'amount': 500, 'secret': 'abc', 'C': 'xyz', 'id': 'mint01'}]
        api_client.post(
            f'/api/products/payments/requests/{pid}/',
            {'id': pid, 'proofs': proofs},
            format='json'
        )
        response = api_client.get(f'/api/products/payments/requests/{pid}/')
        assert response.data['paid'] is True
        assert response.data['amount'] == 500

    def test_get_payment_consume(self, api_client):
        pid = 'test-consume'
        proofs = [{'amount': 200, 'secret': 'def', 'C': 'uvw', 'id': 'mint02'}]
        api_client.post(
            f'/api/products/payments/requests/{pid}/',
            {'id': pid, 'proofs': proofs},
            format='json'
        )
        api_client.get(f'/api/products/payments/requests/{pid}/?consume=true')
        response = api_client.get(f'/api/products/payments/requests/{pid}/')
        assert response.data['paid'] is False


class TestCashuProxyValidation:
    def test_cashu_keys_missing_mint_url(self, api_client):
        response = api_client.get('/api/products/cashu/keys/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'mintUrl' in response.data.get('error', '')

    def test_cashu_swap_missing_mint_url(self, api_client):
        response = api_client.post('/api/products/cashu/swap/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cashu_swap_missing_inputs_outputs(self, api_client):
        data = {'mintUrl': 'https://mint.example.com'}
        response = api_client.post('/api/products/cashu/swap/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cashu_melt_quote_missing_mint_url(self, api_client):
        response = api_client.post('/api/products/cashu/melt/quote/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cashu_melt_quote_missing_invoice(self, api_client):
        data = {'mintUrl': 'https://mint.example.com'}
        response = api_client.post('/api/products/cashu/melt/quote/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cashu_melt_missing_mint_url(self, api_client):
        response = api_client.post('/api/products/cashu/melt/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cashu_melt_missing_quote_or_inputs(self, api_client):
        data = {'mintUrl': 'https://mint.example.com'}
        response = api_client.post('/api/products/cashu/melt/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_payment_proxy_missing_url(self, api_client):
        response = api_client.post('/api/payment-request-proxy/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_payment_proxy_missing_payload(self, api_client):
        data = {'url': 'https://example.com'}
        response = api_client.post('/api/payment-request-proxy/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLightningAddressViews:
    url = '/api/products/lightningaddr/quote/'

    def test_missing_address(self, api_client):
        data = {'amount': 1000}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_amount(self, api_client):
        data = {'address': 'user@example.com'}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_address_no_at_sign(self, api_client):
        data = {'address': 'not-valid-address', 'amount': 1000}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestSessionCart:
    """익명 사용자 세션 카트 테스트"""

    cart_url = '/api/products/cart/'

    @pytest.fixture
    def anon_client(self):
        return DjangoClient(enforce_csrf_checks=False)

    def test_get_empty_session_cart(self, anon_client):
        response = anon_client.get(self.cart_url)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['success'] is True
        assert data['items'] == []
        assert data['item_count'] == 0

    def test_add_product_to_session_cart(self, anon_client, product):
        data = {'product_id': str(product.id), 'quantity': 2}
        response = anon_client.post(
            self.cart_url,
            json.dumps(data),
            content_type='application/json',
        )
        assert response.status_code == 201
        result = json.loads(response.content)
        assert result['success'] is True
        assert result['item']['quantity'] == 2

    def test_get_session_cart_with_product(self, anon_client, product):
        anon_client.post(
            self.cart_url,
            json.dumps({'product_id': str(product.id), 'quantity': 1}),
            content_type='application/json',
        )
        response = anon_client.get(self.cart_url)
        data = json.loads(response.content)
        assert data['item_count'] == 1
        assert data['items'][0]['quantity'] == 1

    def test_update_session_cart_item(self, anon_client, product):
        anon_client.post(
            self.cart_url,
            json.dumps({'product_id': str(product.id), 'quantity': 1}),
            content_type='application/json',
        )
        item_id = f'session_{product.id}'
        response = anon_client.put(
            f'{self.cart_url}{item_id}/',
            json.dumps({'quantity': 5}),
            content_type='application/json',
        )
        assert response.status_code == 200
        result = json.loads(response.content)
        assert result['success'] is True
        assert result['item']['quantity'] == 5

    def test_remove_session_cart_item_with_zero_quantity(self, anon_client, product):
        anon_client.post(
            self.cart_url,
            json.dumps({'product_id': str(product.id), 'quantity': 1}),
            content_type='application/json',
        )
        item_id = f'session_{product.id}'
        response = anon_client.put(
            f'{self.cart_url}{item_id}/',
            json.dumps({'quantity': 0}),
            content_type='application/json',
        )
        assert response.status_code == 200
        result = json.loads(response.content)
        assert result['success'] is True

    def test_delete_session_cart_item(self, anon_client, product):
        anon_client.post(
            self.cart_url,
            json.dumps({'product_id': str(product.id), 'quantity': 1}),
            content_type='application/json',
        )
        item_id = f'session_{product.id}'
        response = anon_client.delete(f'{self.cart_url}{item_id}/')
        assert response.status_code == 200
        result = json.loads(response.content)
        assert result['success'] is True

    def test_update_nonexistent_session_item(self, anon_client):
        response = anon_client.put(
            f'{self.cart_url}session_99999/',
            json.dumps({'quantity': 1}),
            content_type='application/json',
        )
        assert response.status_code == 404

    def test_delete_nonexistent_session_item(self, anon_client):
        response = anon_client.delete(f'{self.cart_url}session_99999/')
        assert response.status_code == 404
