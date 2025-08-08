from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category_detail'),
    
    # Products
    path('', views.ProductListCreateView.as_view(), name='product_list_create'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('available/', views.available_products_view, name='available_products'),
    path('users/', views.available_users_view, name='available_users'),
    
    # Cart
    path('cart/', views.cart_view, name='cart'),
    path('cart/<int:item_id>/', views.cart_item_view, name='cart_item'),
    path('cart/clear/', views.clear_cart_view, name='clear_cart'),
    
    # Orders
    path('orders/', views.order_list_view, name='order_list'),
    path('orders/create/', views.create_order_view, name='create_order'),
    path('orders/<int:order_id>/', views.order_detail_view, name='order_detail'),
]