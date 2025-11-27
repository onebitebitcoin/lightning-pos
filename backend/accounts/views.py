from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from django.middleware.csrf import get_token
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, UserProfileUpdateSerializer
from .models import User
from products.models import Product
import requests


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def csrf_token_view(request):
    """
    CSRF 토큰 반환
    """
    return Response({
        'success': True,
        'csrf_token': get_token(request)
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    사용자 회원가입
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Give admin privileges to 'admin' username
        if user.username.lower() == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.is_kiosk_admin = True
            user.save()
        
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'success': True,
            'message': '계정이 성공적으로 생성되었습니다',
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    
    # Format validation errors
    errors = []
    for field, field_errors in serializer.errors.items():
        for error in field_errors:
            errors.append(str(error))
    
    return Response({
        'success': False,
        'message': errors[0] if errors else '잘못된 입력 데이터입니다',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    사용자 로그인
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'message': '로그인 성공',
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': '잘못된 사용자명/이메일 또는 비밀번호입니다',
        'errors': serializer.errors
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    사용자 로그아웃
    """
    try:
        request.user.auth_token.delete()
    except:
        pass
    
    logout(request)
    return Response({
        'success': True,
        'message': '로그아웃되었습니다'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    사용자 프로필 조회
    """
    return Response({
        'success': True,
        'user': UserSerializer(request.user).data
    }, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile_update_view(request):
    """
    사용자 프로필 업데이트
    """
    serializer = UserProfileUpdateSerializer(
        request.user, 
        data=request.data, 
        partial=request.method == 'PATCH'
    )
    
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'success': True,
            'message': '프로필이 성공적으로 업데이트되었습니다',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    # Format validation errors
    errors = []
    for field, field_errors in serializer.errors.items():
        for error in field_errors:
            errors.append(str(error))
    
    return Response({
        'success': False,
        'message': errors[0] if errors else '잘못된 입력 데이터입니다',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)



# Admin-only views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_users_list_view(request):
    """
    관리자 전용: 모든 사용자 목록 조회
    """
    if not request.user.is_kiosk_admin:
        return Response({
            'success': False,
            'message': '관리자 권한이 필요합니다'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get all users ordered by creation date
        users = User.objects.all().order_by('-created_at')
        
        # Add product count for each user
        users_data = []
        for user in users:
            user_data = UserSerializer(user).data
            user_data['product_count'] = Product.objects.filter(created_by=user).count()
            users_data.append(user_data)
        
        return Response({
            'success': True,
            'users': users_data,
            'total_count': users.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': '사용자 목록을 불러오는 중 오류가 발생했습니다'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_user_detail_view(request, user_id):
    """
    관리자 전용: 특정 사용자 상세 정보 및 상품 목록 조회
    """
    if not request.user.is_kiosk_admin:
        return Response({
            'success': False,
            'message': '관리자 권한이 필요합니다'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        user_products = Product.objects.filter(created_by=user).order_by('-created_at')
        
        # Serialize user data
        user_data = UserSerializer(user).data
        
        # Serialize products data
        products_data = []
        for product in user_products:
            product_data = {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': str(product.price),
                'category_name': product.category.name if product.category else None,
                'is_available': product.is_available,
                'stock_quantity': product.stock_quantity,
                'image_url': product.image_url,
                'created_at': product.created_at,
                'updated_at': product.updated_at,
            }
            products_data.append(product_data)
        
        return Response({
            'success': True,
            'user': user_data,
            'products': products_data,
            'product_count': user_products.count()
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': '사용자를 찾을 수 없습니다'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': '사용자 정보를 불러오는 중 오류가 발생했습니다'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def admin_delete_user_view(request, user_id):
    """
    관리자 전용: 사용자 삭제
    """
    if not request.user.is_kiosk_admin:
        return Response({
            'success': False,
            'message': '관리자 권한이 필요합니다'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user_to_delete = User.objects.get(id=user_id)
        
        # Prevent self-deletion
        if user_to_delete.id == request.user.id:
            return Response({
                'success': False,
                'message': '자기 자신을 삭제할 수 없습니다'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user info before deletion for response
        deleted_username = user_to_delete.username
        
        # Delete the user (this will cascade delete related products, cart items, etc.)
        user_to_delete.delete()
        
        return Response({
            'success': True,
            'message': f'사용자 "{deleted_username}"가 성공적으로 삭제되었습니다'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': '삭제할 사용자를 찾을 수 없습니다'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': '사용자 삭제 중 오류가 발생했습니다'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_lightning_invoice_view(request):
    """
    Generate Lightning Network invoice via LNURL
    This acts as a proxy to avoid CORS issues when calling external Lightning services
    """
    try:
        ln_account = request.data.get('ln_account')
        sats = request.data.get('sats')
        memo = request.data.get('memo', 'Payment')

        if not ln_account or not sats:
            return Response({
                'success': False,
                'error': 'ln_account and sats are required',
                'errorType': 'INVALID_REQUEST'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse Lightning address
        if '@' not in ln_account:
            return Response({
                'success': False,
                'error': 'Invalid Lightning address format',
                'errorType': 'INVALID_REQUEST'
            }, status=status.HTTP_400_BAD_REQUEST)

        ln_name, ln_domain = ln_account.split('@', 1)
        lnurl_endpoint = f'https://{ln_domain}/.well-known/lnurlp/{ln_name}'

        # Step 1: Get LNURL pay request details
        try:
            lnurl_response = requests.get(lnurl_endpoint, timeout=10)
            lnurl_response.raise_for_status()
            lnurl_data = lnurl_response.json()
        except requests.exceptions.RequestException as e:
            return Response({
                'success': False,
                'error': f'Failed to connect to Lightning service: {str(e)}',
                'errorType': 'NETWORK_ERROR'
            }, status=status.HTTP_502_BAD_GATEWAY)

        # Check for error response
        if lnurl_data.get('status') == 'ERROR':
            error_reason = lnurl_data.get('reason', 'Unknown error')
            error_type = 'WALLET_NOT_FOUND' if 'wallet' in error_reason.lower() else 'INVALID_RESPONSE'
            return Response({
                'success': False,
                'error': error_reason,
                'errorType': error_type
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate response
        if lnurl_data.get('tag') != 'payRequest':
            return Response({
                'success': False,
                'error': 'Invalid LNURL response: missing payRequest tag',
                'errorType': 'INVALID_RESPONSE'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check amount limits
        milli_sats = int(sats) * 1000
        min_sendable = lnurl_data.get('minSendable', 0)
        max_sendable = lnurl_data.get('maxSendable', 0)

        if milli_sats < min_sendable or milli_sats > max_sendable:
            return Response({
                'success': False,
                'error': f'Amount {sats} sats is outside allowed range ({min_sendable // 1000} - {max_sendable // 1000} sats)',
                'errorType': 'INVALID_AMOUNT'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Request invoice
        callback_url = lnurl_data.get('callback')
        if not callback_url:
            return Response({
                'success': False,
                'error': 'No callback URL in LNURL response',
                'errorType': 'INVALID_RESPONSE'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            invoice_response = requests.get(
                callback_url,
                params={'amount': milli_sats, 'comment': memo},
                timeout=10
            )
            invoice_response.raise_for_status()
            invoice_data = invoice_response.json()
        except requests.exceptions.RequestException as e:
            return Response({
                'success': False,
                'error': f'Failed to generate invoice: {str(e)}',
                'errorType': 'NETWORK_ERROR'
            }, status=status.HTTP_502_BAD_GATEWAY)

        # Check for error in invoice response
        if invoice_data.get('status') == 'ERROR':
            return Response({
                'success': False,
                'error': invoice_data.get('reason', 'Failed to generate invoice'),
                'errorType': 'INVALID_RESPONSE'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Extract invoice
        invoice = invoice_data.get('pr')
        if not invoice:
            return Response({
                'success': False,
                'error': 'No invoice returned from Lightning service',
                'errorType': 'INVALID_RESPONSE'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'invoice': invoice
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'errorType': 'UNKNOWN'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


 
