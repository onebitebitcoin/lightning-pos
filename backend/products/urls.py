from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category_detail'),
    path('categories/used/', views.user_product_categories_view, name='user_product_categories'),
    
    # Products
    path('', views.ProductListCreateView.as_view(), name='product_list_create'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('available/', views.available_products_view, name='available_products'),
    
    # Cart
    path('cart/', views.cart_view, name='cart'),
    path('cart/<int:item_id>/', views.cart_item_view, name='cart_item'),
    path('cart/clear/', views.clear_cart_view, name='clear_cart'),
    path('cart/add-custom/', views.add_custom_item_view, name='add_custom_item'),
    
    # Orders
    path('orders/', views.order_list_view, name='order_list'),
    path('orders/create/', views.create_order_view, name='create_order'),
    path('orders/<int:order_id>/', views.order_detail_view, name='order_detail'),

    # Cashu NUT-18 payment requests
    path('payments/requests/<str:payment_id>/', views.nut18_payment_request_view, name='nut18_payment_request'),

    # Cashu mint proxy endpoints
    path('cashu/keys/', views.cashu_keys_view, name='cashu_keys'),
    path('cashu/swap/', views.cashu_swap_view, name='cashu_swap'),
    path('cashu/melt/quote/', views.cashu_melt_quote_view, name='cashu_melt_quote'),
    path('cashu/melt/', views.cashu_melt_view, name='cashu_melt'),

    # Lightning address
    path('lightningaddr/quote/', views.lightning_address_quote_view, name='lightning_address_quote'),
]
