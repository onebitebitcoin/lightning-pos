from django.urls import path
from . import views

urlpatterns = [
    path('csrf/', views.csrf_token_view, name='csrf_token'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.profile_update_view, name='profile_update'),
    # Admin-only endpoints
    path('admin/users/', views.admin_users_list_view, name='admin_users_list'),
    path('admin/users/<int:user_id>/', views.admin_user_detail_view, name='admin_user_detail'),
    path('admin/users/<int:user_id>/delete/', views.admin_delete_user_view, name='admin_delete_user'),
]