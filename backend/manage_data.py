#!/usr/bin/env python
"""
Data management script for Kiosk Shop
This script helps populate the database with initial data
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kiosk_backend.settings')
django.setup()

from products.models import Category, Product
from accounts.models import User
from decimal import Decimal


def create_default_categories():
    """Create default product categories"""
    categories = [
        {'name': '음료', 'description': '커피, 차, 주스 등 다양한 음료'},
        {'name': '식사', 'description': '샌드위치, 피자 등 식사류'},
        {'name': '간식', 'description': '과자, 쿠키 등 간식류'},
        {'name': '기타', 'description': '기타 상품'},
    ]
    
    created_categories = []
    for cat_data in categories:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        created_categories.append(category)
        print(f"{'Created' if created else 'Found'} category: {category.name}")
    
    return created_categories


def create_default_products():
    """Create default products"""
    categories = {cat.name: cat for cat in Category.objects.all()}
    
    products = [
        {
            'name': '커피',
            'description': '신선하게 내린 아메리카노',
            'price': Decimal('4.50'),
            'image_url': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop',
            'category': categories.get('음료'),
            'stock_quantity': 100
        },
        {
            'name': '샌드위치',
            'description': '신선한 재료로 만든 클럽 샌드위치',
            'price': Decimal('8.99'),
            'image_url': 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=300&h=200&fit=crop',
            'category': categories.get('식사'),
            'stock_quantity': 50
        },
        {
            'name': '과자',
            'description': '바삭한 감자칩',
            'price': Decimal('2.75'),
            'image_url': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop',
            'category': categories.get('간식'),
            'stock_quantity': 200
        },
        {
            'name': '탄산음료',
            'description': '시원한 콜라',
            'price': Decimal('2.25'),
            'image_url': 'https://images.unsplash.com/photo-1592888760797-2c8f46ab7ee8?w=300&h=200&fit=crop',
            'category': categories.get('음료'),
            'stock_quantity': 150
        },
        {
            'name': '피자',
            'description': '치즈가 듬뿍 올라간 피자 한 조각',
            'price': Decimal('5.99'),
            'image_url': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop',
            'category': categories.get('식사'),
            'stock_quantity': 30
        },
        {
            'name': '쿠키',
            'description': '달콤한 초콜릿 쿠키',
            'price': Decimal('3.50'),
            'image_url': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=200&fit=crop',
            'category': categories.get('간식'),
            'stock_quantity': 80
        },
        {
            'name': '에너지바',
            'description': '건강한 에너지바',
            'price': Decimal('3.25'),
            'image_url': 'https://images.unsplash.com/photo-1571175351734-79a3d50b8180?w=300&h=200&fit=crop',
            'category': categories.get('간식'),
            'stock_quantity': 60
        },
        {
            'name': '생수',
            'description': '깨끗한 생수',
            'price': Decimal('1.99'),
            'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop',
            'category': categories.get('음료'),
            'stock_quantity': 300
        }
    ]
    
    for product_data in products:
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults=product_data
        )
        print(f"{'Created' if created else 'Found'} product: {product.name}")


def create_admin_user():
    """Create admin user if it doesn't exist"""
    try:
        admin_user = User.objects.get(username='admin')
        print(f"Admin user already exists: {admin_user.username}")
    except User.DoesNotExist:
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@kiosk.com',
            password='password',
            is_kiosk_admin=True
        )
        print(f"Created admin user: {admin_user.username}")
    
    return admin_user


def main():
    """Main function to populate database"""
    print("🚀 Starting database population...")
    
    print("\n📂 Creating categories...")
    create_default_categories()
    
    print("\n📦 Creating products...")
    create_default_products()
    
    print("\n👤 Creating admin user...")
    create_admin_user()
    
    print("\n✅ Database population completed!")
    print("\nDefault login credentials:")
    print("  Username: admin")
    print("  Password: password")


if __name__ == '__main__':
    main()