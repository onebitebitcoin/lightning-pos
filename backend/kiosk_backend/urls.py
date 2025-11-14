"""
URL configuration for kiosk_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
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
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)