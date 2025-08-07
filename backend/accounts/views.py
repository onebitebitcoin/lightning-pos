from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, UserProfileUpdateSerializer
from .models import User
from products.models import Product


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    사용자 회원가입
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
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


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def demo_login_view(request):
    """
    데모 계정 로그인 (admin/password)
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username == 'admin' and password == 'password':
        # Create or get admin user
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@kiosk.com',
                'is_staff': True,
                'is_superuser': True,
                'is_kiosk_admin': True
            }
        )
        if created:
            user.set_password('password')
            user.save()
        
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'message': '관리자 로그인 성공',
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': '잘못된 관리자 계정 정보입니다'
    }, status=status.HTTP_401_UNAUTHORIZED)


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