#!/bin/bash

# Kiosk Shop Deployment Script for Ubuntu
# This script sets up the Django backend and Vue frontend on Ubuntu

set -e  # Exit on any error

echo "🚀 Starting Kiosk Shop Deployment on Ubuntu..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="kiosk-shop"
PROJECT_DIR="/var/www/$PROJECT_NAME"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"
NGINX_AVAILABLE="/etc/nginx/sites-available/$PROJECT_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$PROJECT_NAME"
SYSTEMD_SERVICE="/etc/systemd/system/$PROJECT_NAME.service"

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    apt update
    
    # Install Python and pip
    apt install -y python3 python3-pip python3-venv python3-dev
    
    # Install Node.js and npm
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs
    
    # Install Nginx
    apt install -y nginx
    
    # Install SQLite (should already be installed)
    apt install -y sqlite3
    
    # Install other dependencies
    apt install -y git curl wget unzip
    
    print_status "System dependencies installed successfully!"
}

setup_project_directory() {
    print_status "Setting up project directory..."
    
    # Create project directory
    mkdir -p $PROJECT_DIR
    
    # Copy project files (assuming script is run from project root)
    if [ -d "./backend" ] && [ -f "./package.json" ]; then
        cp -r . $PROJECT_DIR/
        print_status "Project files copied to $PROJECT_DIR"
    else
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Set permissions
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
}

setup_backend() {
    print_status "Setting up Django backend..."
    
    cd $BACKEND_DIR
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Set up environment variables for production
    cat > .env << EOF
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,$(hostname -I | awk '{print $1}'),$(hostname -f)
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://$(hostname -I | awk '{print $1}'),http://$(hostname -f)
EOF
    
    # Run Django setup
    python manage.py collectstatic --noinput
    python manage.py makemigrations accounts
    python manage.py makemigrations products
    python manage.py migrate
    
    # Create superuser (you'll need to set password manually)
    echo "from accounts.models import User; User.objects.create_superuser('admin', 'admin@kiosk.com', 'password') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell
    
    print_status "Django backend setup completed!"
}

setup_frontend() {
    print_status "Setting up Vue frontend..."
    
    cd $FRONTEND_DIR
    
    # Install Node dependencies
    npm install
    
    # Build for production
    npm run build
    
    print_status "Vue frontend built successfully!"
}

setup_systemd_service() {
    print_status "Setting up systemd service..."
    
    cat > $SYSTEMD_SERVICE << EOF
[Unit]
Description=Kiosk Shop Django Application
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin
ExecStart=$BACKEND_DIR/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 kiosk_backend.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable and start the service
    systemctl daemon-reload
    systemctl enable $PROJECT_NAME
    systemctl start $PROJECT_NAME
    
    print_status "Systemd service created and started!"
}

setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    cat > $NGINX_AVAILABLE << EOF
server {
    listen 80;
    server_name localhost $(hostname -I | awk '{print $1}') $(hostname -f);
    
    # Frontend (Vue.js built files)
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Django static files
    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
    }
    
    # Django media files
    location /media/ {
        alias $BACKEND_DIR/media/;
    }
}
EOF
    
    # Enable the site
    ln -sf $NGINX_AVAILABLE $NGINX_ENABLED
    
    # Remove default site if it exists
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    
    print_status "Nginx configuration completed!"
}

setup_firewall() {
    print_status "Setting up firewall..."
    
    # Install ufw if not installed
    apt install -y ufw
    
    # Configure firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    
    print_status "Firewall configured!"
}

show_completion_info() {
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}Your Kiosk Shop is now running!${NC}"
    echo ""
    echo "📋 Service Information:"
    echo "  • Frontend: http://$(hostname -I | awk '{print $1}')/"
    echo "  • Admin Panel: http://$(hostname -I | awk '{print $1}')/admin/"
    echo "  • API Endpoints: http://$(hostname -I | awk '{print $1}')/api/"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • Check backend status: systemctl status $PROJECT_NAME"
    echo "  • Restart backend: systemctl restart $PROJECT_NAME"
    echo "  • Check Nginx status: systemctl status nginx"
    echo "  • View backend logs: journalctl -u $PROJECT_NAME -f"
    echo ""
    echo "👤 Default Admin Account:"
    echo "  • Username: admin"
    echo "  • Password: password"
    echo "  • Admin URL: http://$(hostname -I | awk '{print $1}')/admin/"
    echo ""
    echo "📁 Project Location: $PROJECT_DIR"
    echo ""
    print_warning "Remember to:"
    echo "  1. Change the default admin password"
    echo "  2. Update the SECRET_KEY in production"
    echo "  3. Set up SSL/HTTPS for production use"
    echo "  4. Configure domain name in ALLOWED_HOSTS if needed"
}

# Main execution
main() {
    print_status "Starting deployment process..."
    
    check_root
    install_dependencies
    setup_project_directory
    setup_backend
    setup_frontend
    setup_systemd_service
    setup_nginx
    setup_firewall
    show_completion_info
}

# Handle script interruption
trap 'print_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main "$@"