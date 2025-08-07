from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.profile_update_view, name='profile_update'),
    path('demo-login/', views.demo_login_view, name='demo_login'),
    # Admin-only endpoints
    path('admin/users/', views.admin_users_list_view, name='admin_users_list'),
    path('admin/users/<int:user_id>/', views.admin_user_detail_view, name='admin_user_detail'),
]