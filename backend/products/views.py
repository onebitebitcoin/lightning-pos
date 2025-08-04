from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from django.utils.crypto import get_random_string
from decimal import Decimal
from .models import Category, Product, CartItem, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, CartItemSerializer,
    OrderSerializer, CreateOrderSerializer
)


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_available=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def cart_view(request):
    """
    장바구니 조회 및 아이템 추가
    """
    if request.method == 'GET':
        cart_items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(cart_items, many=True)
        
        # Calculate totals
        subtotal = sum(item.total_price for item in cart_items)
        
        return Response({
            'success': True,
            'items': serializer.data,
            'subtotal': subtotal,
            'item_count': len(cart_items)
        })
    
    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id, is_available=True)
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'message': '상품을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        cart_item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return Response({
            'success': True,
            'message': '장바구니에 추가되었습니다.',
            'item': CartItemSerializer(cart_item).data
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cart_item_view(request, item_id):
    """
    장바구니 아이템 수정 및 삭제
    """
    try:
        cart_item = CartItem.objects.get(id=item_id, user=request.user)
    except CartItem.DoesNotExist:
        return Response({
            'success': False,
            'message': '장바구니 아이템을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            cart_item.delete()
            return Response({
                'success': True,
                'message': '장바구니에서 제거되었습니다.'
            })
        else:
            cart_item.quantity = quantity
            cart_item.save()
            return Response({
                'success': True,
                'message': '수량이 변경되었습니다.',
                'item': CartItemSerializer(cart_item).data
            })
    
    elif request.method == 'DELETE':
        cart_item.delete()
        return Response({
            'success': True,
            'message': '장바구니에서 제거되었습니다.'
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def clear_cart_view(request):
    """
    장바구니 비우기
    """
    CartItem.objects.filter(user=request.user).delete()
    return Response({
        'success': True,
        'message': '장바구니가 비워졌습니다.'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_order_view(request):
    """
    주문 생성
    """
    serializer = CreateOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': '잘못된 주문 데이터입니다.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    cart_items = CartItem.objects.filter(user=request.user)
    if not cart_items.exists():
        return Response({
            'success': False,
            'message': '장바구니가 비어있습니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with transaction.atomic():
            # Calculate totals
            subtotal = sum(item.total_price for item in cart_items)
            discount_percentage = serializer.validated_data.get('discount_percentage', 0)
            discount_amount = subtotal * (discount_percentage / 100)
            total_amount = subtotal - discount_amount
            
            # Create order
            order = Order.objects.create(
                user=request.user,
                order_number=get_random_string(10).upper(),
                payment_method=serializer.validated_data['payment_method'],
                subtotal=subtotal,
                discount_percentage=discount_percentage,
                discount_amount=discount_amount,
                total_amount=total_amount,
                status='pending'
            )
            
            # Create order items
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.price,
                    total_price=cart_item.total_price
                )
            
            # Clear cart
            cart_items.delete()
            
            return Response({
                'success': True,
                'message': '주문이 생성되었습니다.',
                'order': OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': f'주문 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_list_view(request):
    """
    사용자 주문 목록 조회
    """
    orders = Order.objects.filter(user=request.user)
    serializer = OrderSerializer(orders, many=True)
    return Response({
        'success': True,
        'orders': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_detail_view(request, order_id):
    """
    주문 상세 조회
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response({
            'success': True,
            'order': serializer.data
        })
    except Order.DoesNotExist:
        return Response({
            'success': False,
            'message': '주문을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)