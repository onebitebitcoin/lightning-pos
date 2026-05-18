import pytest
from unittest.mock import patch, MagicMock
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db


class TestCsrfView:
    url = '/api/auth/csrf/'

    def test_returns_csrf_token(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'csrf_token' in response.data


class TestRegisterView:
    url = '/api/auth/register/'

    def test_register_success(self, api_client):
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert 'token' in response.data
        assert User.objects.filter(username='newuser').exists()

    def test_register_admin_username_gets_privileges(self, api_client):
        data = {
            'username': 'admin',
            'email': 'admin@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        u = User.objects.get(username='admin')
        assert u.is_kiosk_admin is True
        assert u.is_staff is True
        assert u.is_superuser is True

    def test_register_duplicate_username(self, api_client, user):
        data = {
            'username': user.username,
            'email': 'other@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_register_password_mismatch(self, api_client):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass456!'
        }
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_register_weak_password(self, api_client):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': '123',
            'password_confirm': '123'
        }
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_required_fields(self, api_client):
        response = api_client.post(self.url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_creates_auth_token(self, api_client):
        data = {
            'username': 'tokenuser',
            'email': 'token@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data['token']) > 0


class TestLoginView:
    url = '/api/auth/login/'

    def test_login_success_with_username(self, api_client, user):
        data = {'username': user.username, 'password': 'testpass123!'}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'token' in response.data
        assert response.data['user']['username'] == user.username

    def test_login_success_with_email(self, api_client, user):
        data = {'username': user.email, 'password': 'testpass123!'}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

    def test_login_wrong_password(self, api_client, user):
        data = {'username': user.username, 'password': 'wrongpassword'}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data['success'] is False

    def test_login_nonexistent_user(self, api_client):
        data = {'username': 'nobody', 'password': 'pass123'}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, api_client, user):
        user.is_active = False
        user.save()
        data = {'username': user.username, 'password': 'testpass123!'}
        response = api_client.post(self.url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, api_client):
        response = api_client.post(self.url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogoutView:
    url = '/api/auth/logout/'

    def test_logout_success(self, auth_client):
        response = auth_client.post(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert '로그아웃' in response.data['message']

    def test_logout_requires_authentication(self, api_client):
        response = api_client.post(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProfileView:
    get_url = '/api/auth/profile/'
    update_url = '/api/auth/profile/update/'

    def test_get_profile_success(self, auth_client, user):
        response = auth_client.get(self.get_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['user']['username'] == user.username
        assert response.data['user']['email'] == user.email

    def test_get_profile_requires_auth(self, api_client):
        response = api_client.get(self.get_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile_lightning_address(self, auth_client):
        data = {'lightning_address': 'user@walletofsatoshi.com'}
        response = auth_client.patch(self.update_url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['lightning_address'] == 'user@walletofsatoshi.com'

    def test_update_profile_invalid_lightning_address(self, auth_client):
        data = {'lightning_address': 'not-valid'}
        response = auth_client.patch(self.update_url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_profile_invalid_usdt_address(self, auth_client):
        data = {'usdt_address': 'invalid-address'}
        response = auth_client.patch(self.update_url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_profile_ecash_enabled(self, auth_client):
        data = {'ecash_enabled': True}
        response = auth_client.patch(self.update_url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['ecash_enabled'] is True

    def test_update_profile_requires_auth(self, api_client):
        response = api_client.patch(self.update_url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile_put_method(self, auth_client, user):
        data = {
            'username': user.username,
            'email': user.email,
            'ecash_enabled': True
        }
        response = auth_client.put(self.update_url, data, format='json')
        assert response.status_code == status.HTTP_200_OK


class TestAdminUsersView:
    list_url = '/api/auth/admin/users/'

    def test_admin_list_users_success(self, admin_client, user):
        response = admin_client.get(self.list_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'users' in response.data
        assert 'total_count' in response.data

    def test_admin_list_users_includes_product_count(self, admin_client, user):
        response = admin_client.get(self.list_url)
        for u in response.data['users']:
            assert 'product_count' in u

    def test_admin_list_users_forbidden_for_regular_user(self, auth_client):
        response = auth_client.get(self.list_url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_list_users_requires_auth(self, api_client):
        response = api_client.get(self.list_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_user_detail_success(self, admin_client, user):
        response = admin_client.get(f'/api/auth/admin/users/{user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['username'] == user.username
        assert 'products' in response.data
        assert 'product_count' in response.data

    def test_admin_user_detail_not_found(self, admin_client):
        response = admin_client.get('/api/auth/admin/users/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_delete_user_success(self, admin_client, user):
        user_id = user.id
        response = admin_client.delete(f'/api/auth/admin/users/{user_id}/delete/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert not User.objects.filter(id=user_id).exists()

    def test_admin_cannot_delete_self(self, admin_client, admin_user):
        response = admin_client.delete(f'/api/auth/admin/users/{admin_user.id}/delete/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_delete_nonexistent_user(self, admin_client):
        response = admin_client.delete('/api/auth/admin/users/99999/delete/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestLightningInvoiceView:
    url = '/api/auth/lightning/invoice/'

    def test_requires_auth(self, api_client):
        response = api_client.post(self.url, {}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_missing_ln_account(self, auth_client):
        response = auth_client.post(self.url, {'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_REQUEST'

    def test_missing_sats(self, auth_client):
        response = auth_client.post(self.url, {'ln_account': 'user@example.com'}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_REQUEST'

    def test_invalid_ln_address_no_at(self, auth_client):
        response = auth_client.post(self.url, {'ln_account': 'invaliddomain', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_REQUEST'

    @patch('accounts.views.requests.get')
    def test_lnurl_network_error(self, mock_get, auth_client):
        import requests as req
        mock_get.side_effect = req.exceptions.RequestException('timeout')
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert response.data['errorType'] == 'NETWORK_ERROR'

    @patch('accounts.views.requests.get')
    def test_lnurl_wallet_not_found(self, mock_get, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'status': 'ERROR', 'reason': 'wallet not found'}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'WALLET_NOT_FOUND'

    @patch('accounts.views.requests.get')
    def test_lnurl_generic_error(self, mock_get, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'status': 'ERROR', 'reason': 'service unavailable'}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_RESPONSE'

    @patch('accounts.views.requests.get')
    def test_lnurl_invalid_tag(self, mock_get, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'tag': 'withdrawRequest'}
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_RESPONSE'

    @patch('accounts.views.requests.get')
    def test_amount_below_minimum(self, mock_get, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            'tag': 'payRequest',
            'minSendable': 1000000,
            'maxSendable': 10000000,
            'callback': 'https://example.com/callback',
        }
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_AMOUNT'

    @patch('accounts.views.requests.get')
    def test_no_callback_url(self, mock_get, auth_client):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            'tag': 'payRequest',
            'minSendable': 1000,
            'maxSendable': 10000000,
        }
        mock_resp.raise_for_status.return_value = None
        mock_get.return_value = mock_resp
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_RESPONSE'

    @patch('accounts.views.requests.get')
    def test_invoice_network_error(self, mock_get, auth_client):
        import requests as req
        lnurl_resp = MagicMock()
        lnurl_resp.json.return_value = {
            'tag': 'payRequest',
            'minSendable': 1000,
            'maxSendable': 10000000,
            'callback': 'https://example.com/callback',
        }
        lnurl_resp.raise_for_status.return_value = None
        mock_get.side_effect = [lnurl_resp, req.exceptions.RequestException('connection error')]
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert response.data['errorType'] == 'NETWORK_ERROR'

    @patch('accounts.views.requests.get')
    def test_invoice_error_response(self, mock_get, auth_client):
        lnurl_resp = MagicMock()
        lnurl_resp.json.return_value = {
            'tag': 'payRequest',
            'minSendable': 1000,
            'maxSendable': 10000000,
            'callback': 'https://example.com/callback',
        }
        lnurl_resp.raise_for_status.return_value = None
        invoice_resp = MagicMock()
        invoice_resp.json.return_value = {'status': 'ERROR', 'reason': 'invalid amount'}
        invoice_resp.raise_for_status.return_value = None
        mock_get.side_effect = [lnurl_resp, invoice_resp]
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_RESPONSE'

    @patch('accounts.views.requests.get')
    def test_invoice_missing_pr(self, mock_get, auth_client):
        lnurl_resp = MagicMock()
        lnurl_resp.json.return_value = {
            'tag': 'payRequest',
            'minSendable': 1000,
            'maxSendable': 10000000,
            'callback': 'https://example.com/callback',
        }
        lnurl_resp.raise_for_status.return_value = None
        invoice_resp = MagicMock()
        invoice_resp.json.return_value = {}
        invoice_resp.raise_for_status.return_value = None
        mock_get.side_effect = [lnurl_resp, invoice_resp]
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['errorType'] == 'INVALID_RESPONSE'

    @patch('accounts.views.requests.get')
    def test_success(self, mock_get, auth_client):
        lnurl_resp = MagicMock()
        lnurl_resp.json.return_value = {
            'tag': 'payRequest',
            'minSendable': 1000,
            'maxSendable': 10000000,
            'callback': 'https://example.com/callback',
        }
        lnurl_resp.raise_for_status.return_value = None
        invoice_resp = MagicMock()
        invoice_resp.json.return_value = {'pr': 'lnbc100n1...'}
        invoice_resp.raise_for_status.return_value = None
        mock_get.side_effect = [lnurl_resp, invoice_resp]
        response = auth_client.post(self.url, {'ln_account': 'user@example.com', 'sats': 100}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['invoice'] == 'lnbc100n1...'
