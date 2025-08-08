from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction, models
from django.utils.crypto import get_random_string
from decimal import Decimal
from .models import Category, Product, CartItem, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, CartItemSerializer,
    OrderSerializer, CreateOrderSerializer
)


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Show categories created by the current user and global categories (created_by=None)
        return Category.objects.filter(
            models.Q(created_by=self.request.user) | models.Q(created_by__isnull=True)
        ).order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only access their own categories and global categories
        return Category.objects.filter(
            models.Q(created_by=self.request.user) | models.Q(created_by__isnull=True)
        )


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Show only products created by the current user
        queryset = Product.objects.filter(created_by=self.request.user, is_available=True)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        return queryset.order_by('-created_at')


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only access their own products
        return Product.objects.filter(created_by=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_products_view(request):
    """
    Get available products for the current user (read-only view for shopping)
    This endpoint shows only products created by the current user
    """
    products = Product.objects.filter(
        created_by=request.user,
        is_available=True
    ).order_by('-created_at')
    
    category = request.query_params.get('category')
    if category:
        products = products.filter(category_id=category)
    
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response({
        'success': True,
        'products': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_product_categories_view(request):
    """
    Get categories that are actually used in the current user's available products
    """
    categories = Category.objects.filter(
        product__created_by=request.user,
        product__is_available=True
    ).distinct().order_by('name')
    
    serializer = CategorySerializer(categories, many=True)
    return Response({
        'success': True,
        'categories': serializer.data
    })



@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def cart_view(request):
    """
    장바구니 조회 및 아이템 추가
    """
    if request.method == 'GET':
        if request.user.is_authenticated:
            # Authenticated user - use database cart
            cart_items = CartItem.objects.filter(user=request.user)
            serializer = CartItemSerializer(cart_items, many=True)
            subtotal = sum(item.total_price for item in cart_items)
            items_data = serializer.data
        else:
            # Anonymous user - use session cart
            session_cart = request.session.get('cart', {})
            items_data = []
            subtotal = 0
            
            for product_id, item_data in session_cart.items():
                try:
                    product = Product.objects.get(id=product_id, is_available=True)
                    total_price = product.price * item_data['quantity']
                    items_data.append({
                        'id': f"session_{product_id}",
                        'product': {
                            'id': product.id,
                            'name': product.name,
                            'price': str(product.price),
                            'image_url': product.image.url if product.image else None,
                        },
                        'quantity': item_data['quantity'],
                        'total_price': str(total_price)
                    })
                    subtotal += total_price
                except Product.DoesNotExist:
                    continue
        
        return Response({
            'success': True,
            'items': items_data,
            'subtotal': str(subtotal),
            'item_count': len(items_data)
        })
    
    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            # Allow adding any available product to cart
            product = Product.objects.get(id=product_id, is_available=True)
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'message': '상품을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.user.is_authenticated:
            # Authenticated user - use database cart
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            item_data = CartItemSerializer(cart_item).data
        else:
            # Anonymous user - use session cart
            session_cart = request.session.get('cart', {})
            product_id_str = str(product_id)
            
            if product_id_str in session_cart:
                session_cart[product_id_str]['quantity'] += quantity
            else:
                session_cart[product_id_str] = {'quantity': quantity}
            
            request.session['cart'] = session_cart
            request.session.modified = True
            
            # Create item data for response
            total_price = product.price * session_cart[product_id_str]['quantity']
            item_data = {
                'id': f"session_{product_id}",
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'price': str(product.price),
                    'image_url': product.image.url if product.image else None,
                },
                'quantity': session_cart[product_id_str]['quantity'],
                'total_price': str(total_price)
            }
        
        return Response({
            'success': True,
            'message': '장바구니에 추가되었습니다.',
            'item': item_data
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.AllowAny])
def cart_item_view(request, item_id):
    """
    장바구니 아이템 수정 및 삭제
    """
    # Check if this is a session-based cart item
    if str(item_id).startswith('session_'):
        product_id = str(item_id).replace('session_', '')
        session_cart = request.session.get('cart', {})
        
        if product_id not in session_cart:
            return Response({
                'success': False,
                'message': '장바구니 아이템을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'PUT':
            quantity = int(request.data.get('quantity', 1))
            if quantity <= 0:
                del session_cart[product_id]
            else:
                session_cart[product_id]['quantity'] = quantity
            
            request.session['cart'] = session_cart
            request.session.modified = True
            
            if quantity <= 0:
                return Response({
                    'success': True,
                    'message': '장바구니에서 제거되었습니다.'
                })
            else:
                try:
                    product = Product.objects.get(id=product_id, is_available=True)
                    total_price = product.price * quantity
                    item_data = {
                        'id': f"session_{product_id}",
                        'product': {
                            'id': product.id,
                            'name': product.name,
                            'price': str(product.price),
                            'image_url': product.image.url if product.image else None,
                        },
                        'quantity': quantity,
                        'total_price': str(total_price)
                    }
                    return Response({
                        'success': True,
                        'message': '수량이 변경되었습니다.',
                        'item': item_data
                    })
                except Product.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': '상품을 찾을 수 없습니다.'
                    }, status=status.HTTP_404_NOT_FOUND)
        
        elif request.method == 'DELETE':
            del session_cart[product_id]
            request.session['cart'] = session_cart
            request.session.modified = True
            return Response({
                'success': True,
                'message': '장바구니에서 제거되었습니다.'
            })
    
    else:
        # Database cart item - requires authentication
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': '로그인이 필요합니다.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
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
@permission_classes([permissions.AllowAny])
def clear_cart_view(request):
    """
    장바구니 비우기
    """
    if request.user.is_authenticated:
        CartItem.objects.filter(user=request.user).delete()
    else:
        request.session['cart'] = {}
        request.session.modified = True
    
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