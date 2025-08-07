from rest_framework import serializers
from .models import Category, Product, CartItem, Order, OrderItem
import base64
import uuid
from django.core.files.base import ContentFile


class CategorySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    is_global = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_by', 'created_by_username', 'is_global', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_by_username', 'created_at', 'updated_at']
    
    def get_is_global(self, obj):
        return obj.created_by is None


class ProductSerializer(serializers.ModelSerializer):
    image_display_url = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    # Override image_url to accept any string (including base64)
    image_url = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'image_url', 'image', 
            'image_display_url', 'category', 'category_name', 'is_available', 
            'stock_quantity', 'created_by', 'created_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_by_username', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """Custom validation to handle base64 image data"""
        # Process image data before validation
        attrs = self._process_image_data(attrs)
        return super().validate(attrs)
    
    def _process_image_data(self, validated_data):
        """Process base64 image data and convert to image file"""
        image_url = validated_data.get('image_url', '')
        
        # Check if image_url contains base64 data
        if image_url and image_url.startswith('data:image/'):
            try:
                # Extract format and data
                header, data = image_url.split(';base64,')
                format_type = header.split('/')[-1].lower()  # e.g., 'jpeg', 'png'
                
                # Validate image format
                allowed_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
                if format_type not in allowed_formats:
                    raise serializers.ValidationError({
                        'image_url': f'지원되지 않는 이미지 형식입니다. 지원 형식: {", ".join(allowed_formats)}'
                    })
                
                # Decode base64 data
                image_data = base64.b64decode(data)
                
                # Check image size (max 5MB)
                if len(image_data) > 5 * 1024 * 1024:
                    raise serializers.ValidationError({
                        'image_url': '이미지 파일이 너무 큽니다. 최대 5MB까지 업로드 가능합니다.'
                    })
                
                # Create a unique filename
                filename = f"product_{uuid.uuid4().hex[:8]}.{format_type}"
                
                # Create ContentFile from image data
                image_file = ContentFile(image_data, name=filename)
                
                # Set the image field and clear image_url
                validated_data['image'] = image_file
                validated_data['image_url'] = ''
                
            except ValueError as e:
                raise serializers.ValidationError({
                    'image_url': '잘못된 base64 이미지 데이터 형식입니다.'
                })
            except Exception as e:
                raise serializers.ValidationError({
                    'image_url': f'이미지 처리 중 오류가 발생했습니다: {str(e)}'
                })
        elif image_url and not image_url.startswith(('http://', 'https://')):
            # If it's not base64 and not a valid URL, raise error
            raise serializers.ValidationError({
                'image_url': '유효한 URL을 입력하거나 이미지 파일을 업로드해주세요.'
            })
        
        return validated_data
    
    def create(self, validated_data):
        # Set the creator as the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.CharField(source='product.image_display_url', read_only=True)
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 'product_image',
            'quantity', 'total_price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_name', 'status', 'payment_method',
            'subtotal', 'discount_percentage', 'discount_amount', 'total_amount',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'created_at', 'updated_at']


class CreateOrderSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    cart_items = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        write_only=True
    )
    
    def validate_cart_items(self, value):
        if not value:
            raise serializers.ValidationError("장바구니가 비어있습니다.")
        return value