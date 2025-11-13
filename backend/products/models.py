from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Category(models.Model):
    """
    상품 카테고리 모델
    """
    name = models.CharField(max_length=100, verbose_name='카테고리명')
    description = models.TextField(blank=True, verbose_name='설명')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name='생성자')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '카테고리'
        verbose_name_plural = '카테고리들'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """
    상품 모델
    """
    name = models.CharField(max_length=200, verbose_name='상품명')
    description = models.TextField(blank=True, verbose_name='상품 설명')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='가격')
    regular_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='정가'
    )
    image_url = models.URLField(blank=True, verbose_name='이미지 URL')
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name='이미지 파일')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='카테고리')
    is_available = models.BooleanField(default=True, verbose_name='판매 가능')
    stock_quantity = models.PositiveIntegerField(default=0, verbose_name='재고 수량')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='생성자')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '상품'
        verbose_name_plural = '상품들'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def image_display_url(self):
        """이미지 URL 반환 (파일 또는 URL)"""
        if self.image:
            return self.image.url
        return self.image_url or ''


class CartItem(models.Model):
    """
    장바구니 아이템 모델
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='사용자')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='상품')
    quantity = models.PositiveIntegerField(default=1, verbose_name='수량')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '장바구니 아이템'
        verbose_name_plural = '장바구니 아이템들'
        unique_together = ['user', 'product']
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name} x{self.quantity}"
    
    @property
    def total_price(self):
        return self.product.price * self.quantity


class Order(models.Model):
    """
    주문 모델
    """
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('processing', '처리중'),
        ('completed', '완료'),
        ('cancelled', '취소'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', '현금'),
        ('lightning', '라이트닝'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='사용자')
    order_number = models.CharField(max_length=50, unique=True, verbose_name='주문번호')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='상태')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, verbose_name='결제 방법')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='소계')
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='할인율')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='할인 금액')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='총 금액')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '주문'
        verbose_name_plural = '주문들'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"주문 {self.order_number} - {self.user.username}"


class OrderItem(models.Model):
    """
    주문 아이템 모델
    """
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE, verbose_name='주문')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='상품')
    quantity = models.PositiveIntegerField(verbose_name='수량')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='단가')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='총가격')
    
    class Meta:
        verbose_name = '주문 아이템'
        verbose_name_plural = '주문 아이템들'
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product.name} x{self.quantity}"
