#!/bin/bash

set -e

echo "Ubuntu 서버 배포를 시작합니다..."

# Update system packages
echo "시스템 패키지 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "필수 패키지 설치 중..."
sudo apt install -y curl wget git build-essential software-properties-common python3 python3-pip python3-venv psmisc net-tools

# Install Node.js (if needed)
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 중..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install Docker (if needed)
if ! command -v docker &> /dev/null; then
    echo "Docker 설치 중..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose (if needed)
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose 설치 중..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx (if needed)
if ! command -v nginx &> /dev/null; then
    echo "Nginx 설치 중..."
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

# Setup firewall
echo "방화벽 설정 중..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup directories
FRONTEND_DEPLOY_DIR="/var/www/pos/"
CURRENT_DIR=$(pwd)

echo "현재 디렉터리: $CURRENT_DIR"
echo "프론트엔드 배포 디렉터리 생성: $FRONTEND_DEPLOY_DIR"
sudo mkdir -p $FRONTEND_DEPLOY_DIR
sudo chown -R $USER:$USER $FRONTEND_DEPLOY_DIR

# Deploy Django Backend
echo "=== Django 백엔드 배포 ==="
if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
    cd backend
    echo "파이썬 가상환경 설정 중..."
    python3 -m venv venv
    source venv/bin/activate
    
    echo "파이썬 의존성 설치 중..."
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install gunicorn
    
    echo "Django 마이그레이션 실행 중..."
    python manage.py migrate
    
    echo "정적 파일 수집 중..."
    python manage.py collectstatic --noinput
    
    echo "정적 파일을 프론트엔드 배포 디렉터리로 복사 중..."
    sudo mkdir -p $FRONTEND_DEPLOY_DIR/staticfiles
    sudo cp -r staticfiles/* $FRONTEND_DEPLOY_DIR/staticfiles/ 2>/dev/null || true
    sudo mkdir -p $FRONTEND_DEPLOY_DIR/media
    sudo cp -r media/* $FRONTEND_DEPLOY_DIR/media/ 2>/dev/null || true
    
    echo "Django 슈퍼유저 생성(필요 시)..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('슈퍼유저 생성됨: admin/admin123')
else:
    print('슈퍼유저가 이미 존재합니다')
"
    deactivate
    cd $CURRENT_DIR
fi

# Deploy Vue Frontend
echo "=== Vue 프론트엔드 배포 ==="
if [ -f "package.json" ]; then
    echo "Vue 프론트엔드 빌드 중..."
    
    if [ -f "package.json" ]; then
        echo "Node.js 의존성 설치 중..."
        npm install
        
        echo "프로덕션 빌드 생성 중..."
        npm run build-only
        
        echo "$FRONTEND_DEPLOY_DIR 에 배포 중..."
        sudo rm -rf $FRONTEND_DEPLOY_DIR/*
        sudo cp -r dist/* $FRONTEND_DEPLOY_DIR/
        sudo chown -R www-data:www-data $FRONTEND_DEPLOY_DIR/
        sudo chmod -R 755 $FRONTEND_DEPLOY_DIR/
        
        echo "프론트엔드 배포 완료!"
    fi
fi

# Setup systemd service for Django backend
SERVICE_NAME="shop-django-backend"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

echo "Django systemd 서비스 생성/업데이트 중..."
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Shop Django Backend
After=network.target

[Service]
Type=simple
User=$USER
Group=www-data
WorkingDirectory=$CURRENT_DIR/backend
Environment="PATH=$CURRENT_DIR/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONPATH=$CURRENT_DIR/backend"
Environment="DJANGO_SETTINGS_MODULE=kiosk_backend.settings"
ExecStart=$CURRENT_DIR/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8001 kiosk_backend.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
TimeoutStartSec=30
PrivateTmp=true
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
echo "Django 서비스 생성 및 활성화 완료"

# Start/restart the service
echo "=== Django 백엔드 서비스 시작 ==="
echo "실행 중인 서비스가 있으면 중지 중..."
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true

echo "Django 백엔드 서비스 시작 중..."
sudo systemctl start $SERVICE_NAME

# Wait for service to start
sleep 3

echo "서비스 상태 확인 중..."
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Django 서비스가 정상적으로 실행 중입니다"
    sudo systemctl status $SERVICE_NAME --no-pager
else
    echo "❌ Django 서비스 시작 실패. 로그 확인 중..."
    sudo journalctl -u $SERVICE_NAME --no-pager -n 20
    
    # Try to start manually as fallback
    echo "수동 시작 시도 중(대안)..."
    cd $CURRENT_DIR/backend
    source venv/bin/activate
    
    # Kill any existing processes on port 8001
    sudo fuser -k 8001/tcp 2>/dev/null || true
    sleep 2
    
    # Start Gunicorn manually in background
    echo "포트 8001에서 Gunicorn 수동 시작 중..."
    nohup $CURRENT_DIR/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8001 kiosk_backend.wsgi:application > /var/log/gunicorn.log 2>&1 &
    
    # Wait and check if port 8001 is responding
    sleep 5
    if curl -s http://localhost:8001/api/accounts/user/ > /dev/null 2>&1; then
        echo "✅ Django backend started manually on port 8001"
    else
        echo "❌ Failed to start Django backend. Trying development server..."
        # Kill gunicorn and try development server
        sudo fuser -k 8001/tcp 2>/dev/null || true
        sleep 2
        nohup python manage.py runserver 0.0.0.0:8001 > /var/log/django-dev.log 2>&1 &
        sleep 3
        if curl -s http://localhost:8001/api/accounts/user/ > /dev/null 2>&1; then
            echo "✅ 포트 8001에서 Django 개발 서버 시작"
        else
            echo "❌ 모든 시작 방법이 실패했습니다. 로그를 확인하세요:"
            echo "  - systemd: sudo journalctl -u $SERVICE_NAME"
            echo "  - gunicorn: tail -f /var/log/gunicorn.log"
            echo "  - django: tail -f /var/log/django-dev.log"
        fi
    fi
    deactivate
fi

# Setup Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/shop.local"
if ! grep -q "proxy_pass" $NGINX_CONFIG 2>/dev/null; then
    echo "Nginx 리버스 프록시 구성 중..."
    sudo bash -c "cat > $NGINX_CONFIG" <<EOF
server {
    listen 80;
    server_name shop.local localhost;
    
    # Increase file upload size limit
    client_max_body_size 50M;
    client_body_buffer_size 10M;
    client_body_timeout 120s;

    root $FRONTEND_DEPLOY_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for file uploads
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Allow large file uploads
        client_max_body_size 50M;
    }

    location /admin/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Allow large file uploads
        client_max_body_size 50M;
    }

    # Serve Django static files
    location /static/ {
        alias $FRONTEND_DEPLOY_DIR/staticfiles/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Serve media files
    location /media/ {
        alias $FRONTEND_DEPLOY_DIR/media/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Serve JavaScript, CSS, images, fonts, etc. from Vue build
    location ~* \.(?:js|css|ico|json|xml|jpg|jpeg|png|gif|woff|woff2|ttf|svg|map)$ {
        root $FRONTEND_DEPLOY_DIR;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        
        # Fallback for cache busting
        try_files \$uri \$uri/ =404;
    }
}
EOF

    # Enable the site
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/shop.local
    
    # Remove default site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    sudo nginx -t
    sudo systemctl reload nginx
fi

# Final setup and permissions
echo "=== 최종 설정 ==="
sudo chown -R www-data:www-data $FRONTEND_DEPLOY_DIR/
sudo chmod -R 755 $FRONTEND_DEPLOY_DIR/

# Enable and start nginx site
if [ -f "/etc/nginx/sites-available/shop.local" ]; then
    echo "Nginx 사이트 활성화 중..."
    sudo ln -sf /etc/nginx/sites-available/shop.local /etc/nginx/sites-enabled/
    sudo systemctl reload nginx
fi

echo "=== 최종 점검 ==="
echo "포트 8001에서 Django 백엔드가 실행 중인지 확인 중..."
if netstat -tlnp 2>/dev/null | grep -q ":8001 "; then
    echo "✅ 포트 8001 활성화됨"
    if curl -s http://localhost:8001/api/accounts/user/ > /dev/null 2>&1; then
        echo "✅ Django 백엔드 상태 점검 통과"
    else
        echo "⚠️ 포트 8001는 활성화됐으나 상태 점검 실패"
    fi
else
    echo "❌ 포트 8001가 활성화되어 있지 않음"
    echo "포트 8001에서 실행 중인 프로세스 확인 중..."
    sudo lsof -i :8001 || echo "포트 8001에서 실행 중인 프로세스가 없습니다"
fi

echo ""
echo "=== 배포 요약 ==="
BACKEND_STATUS="❌ Not Running"
if netstat -tlnp 2>/dev/null | grep -q ":8001 "; then
    BACKEND_STATUS="✅ http://localhost:8001 에서 실행 중"
fi

echo "🔧 Django 백엔드: $BACKEND_STATUS"
echo "✅ Vue 프론트엔드: $FRONTEND_DEPLOY_DIR/ 에 배포됨"
echo "✅ 저장소: $CURRENT_DIR/ 에서 작업"
echo "✅ Nginx: 로컬 접속 구성 완료"
echo "✅ Systemd 서비스: shop-django-backend"
echo ""
echo "🔧 추가 수동 설정 필요:"
echo "1. 프로덕션용 Django 설정 업데이트 (DEBUG=False, ALLOWED_HOSTS)"
echo "2. 데이터베이스 및 시크릿용 환경 변수 설정"
echo "3. 프로덕션용 SSL 인증서 구성"
echo ""
echo "📋 서비스 관리 명령어:"
echo "  sudo systemctl status shop-django-backend"
echo "  sudo systemctl restart shop-django-backend"
echo "  sudo systemctl reload nginx"
echo "  sudo journalctl -u shop-django-backend -f  # 로그 보기"
echo ""
echo "🔍 디버깅 명령어:"
echo "  netstat -tlnp | grep :8001  # 포트 8001 확인"
echo "  curl http://localhost:8001/api/accounts/user/  # 백엔드 테스트"
echo "  tail -f /var/log/gunicorn.log  # Gunicorn 로그"
echo "  tail -f /var/log/django-dev.log  # Django 개발 서버 로그"
echo ""
echo "🌐 사이트 접속: http://shop.local 또는 http://localhost"
echo "📝 Django 관리자: http://shop.local/admin/"
echo "🔑 기본 관리자 계정: admin/admin123"
