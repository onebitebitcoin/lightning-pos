"""
URL configuration for kiosk_backend project.
"""
import re
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from products import views as products_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),

    # Cashu endpoints (direct routing for frontend compatibility)
    path('api/cashu/keys/', products_views.cashu_keys_view, name='cashu_keys_direct'),
    path('api/cashu/swap/', products_views.cashu_swap_view, name='cashu_swap_direct'),
    path('api/cashu/melt/quote/', products_views.cashu_melt_quote_view, name='cashu_melt_quote_direct'),
    path('api/cashu/melt/', products_views.cashu_melt_view, name='cashu_melt_direct'),

    # Lightning address endpoint (direct routing for frontend compatibility)
    path('api/lightningaddr/quote/', products_views.lightning_address_quote_view, name='lightning_address_quote_direct'),

    # Payment request proxy (CORS workaround)
    path('api/payment-request-proxy/', products_views.payment_request_proxy_view, name='payment_request_proxy'),
]

# Serve media files — use serve view directly (Django's static() skips when DEBUG=False)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# SPA catch-all: serve index.html for all non-API/admin/media/static routes
def _spa_index(request, *args, **kwargs):
    return serve(request, 'index.html', document_root=str(settings.BASE_DIR / 'frontend' / 'dist'))

urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|static/).*$', _spa_index),
]