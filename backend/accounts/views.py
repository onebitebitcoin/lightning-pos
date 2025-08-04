from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from .models import User


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