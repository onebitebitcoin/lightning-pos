from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return attrs
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 존재하는 사용자명입니다.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 존재하는 이메일입니다.")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Try to authenticate with username first
            user = authenticate(username=username, password=password)
            
            # If that fails, try with email
            if not user:
                try:
                    user_obj = User.objects.get(email=username)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError("잘못된 사용자명/이메일 또는 비밀번호입니다.")
            
            if not user.is_active:
                raise serializers.ValidationError("계정이 비활성화되었습니다.")
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError("사용자명과 비밀번호를 모두 입력해주세요.")
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'lightning_address', 'usdt_address', 'created_at', 'is_kiosk_admin')
        read_only_fields = ('id', 'created_at')


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information"""

    class Meta:
        model = User
        fields = ('username', 'email', 'lightning_address', 'usdt_address')

    def validate_username(self, value):
        # Allow current user to keep their username
        if self.instance and self.instance.username == value:
            return value

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 존재하는 사용자명입니다.")
        return value

    def validate_email(self, value):
        # Allow current user to keep their email
        if self.instance and self.instance.email == value:
            return value

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 존재하는 이메일입니다.")
        return value

    def validate_lightning_address(self, value):
        """Validate lightning address format"""
        if value and value.strip():
            value = value.strip()
            # Basic validation for lightning address format (user@domain.com)
            if '@' not in value or value.count('@') != 1:
                raise serializers.ValidationError("올바른 라이트닝 주소 형식이 아닙니다. (예: test@walletofsatoshi.com)")

            local, domain = value.split('@')
            if not local or not domain or '.' not in domain:
                raise serializers.ValidationError("올바른 라이트닝 주소 형식이 아닙니다. (예: test@walletofsatoshi.com)")

        return value

    def validate_usdt_address(self, value):
        """Validate USDT address format"""
        if value and value.strip():
            value = value.strip()
            # Basic validation for USDT address format (user@domain.com)
            if '@' not in value or value.count('@') != 1:
                raise serializers.ValidationError("올바른 USDT 주소 형식이 아닙니다. (예: username@speed.app)")

            local, domain = value.split('@')
            if not local or not domain or '.' not in domain:
                raise serializers.ValidationError("올바른 USDT 주소 형식이 아닙니다. (예: username@speed.app)")

        return value