from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for the kiosk system
    """
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_kiosk_admin = models.BooleanField(default=False)
    
    # Override username to make it optional since we use email for login
    username = models.CharField(max_length=150, unique=True)
    
    USERNAME_FIELD = 'username'  # Can be changed to 'email' if preferred
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
    
    def __str__(self):
        return self.username