# 한입 POS (Kiosk Shop)

Vue 3 + Django REST Framework로 구축된 한국어 키오스크 시스템입니다.

## 📋 기능

### 🛒 프론트엔드 (Vue 3 + TypeScript + Tailwind CSS)
- **로그인/회원가입**: 사용자 인증 시스템
- **상품 목록**: 카테고리별 상품 브라우징
- **장바구니**: 실시간 장바구니 관리
- **결제 시스템**: 다양한 결제 방법 (현금, 카드, 라이트닝)
- **할인 적용**: 5%, 10%, 15%, 20%, 25% 할인 옵션
- **QR 코드**: 결제용 QR 코드 생성
- **상품 관리**: 관리자용 상품 CRUD 시스템

### 🔧 백엔드 (Django + SQLite3)
- **REST API**: Django REST Framework 기반
- **사용자 관리**: 커스텀 User 모델
- **상품 관리**: 카테고리, 상품, 재고 관리
- **주문 시스템**: 완전한 주문 처리 플로우
- **장바구니**: 사용자별 장바구니 관리
- **인증**: 토큰 기반 인증 시스템

## 🚀 빠른 시작

### 개발 환경 설정

#### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd shop
```

#### 2. 백엔드 설정
```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\\Scripts\\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 초기 데이터 생성
python manage_data.py

# 개발 서버 시작
python manage.py runserver
```

#### 3. 프론트엔드 설정
```bash
# 새 터미널에서
cd shop  # 프로젝트 루트로

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 접속 정보
- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8002/api/
- **Django 관리자**: http://localhost:8002/admin/

### 기본 계정
- **사용자명**: admin
- **비밀번호**: password

## 🐧 Ubuntu 배포

### 자동 배포 (권장)
```bash
# 프로젝트 루트에서
sudo ./deploy.sh
```

### 수동 배포
1. **시스템 의존성 설치**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm nginx sqlite3
```

2. **프로젝트 복사**
```bash
sudo mkdir -p /var/www/kiosk-shop
sudo cp -r . /var/www/kiosk-shop/
sudo chown -R www-data:www-data /var/www/kiosk-shop
```

3. **백엔드 설정**
```bash
cd /var/www/kiosk-shop/backend
sudo -u www-data python3 -m venv venv
sudo -u www-data venv/bin/pip install -r requirements.txt
sudo -u www-data venv/bin/python manage.py migrate
sudo -u www-data venv/bin/python manage_data.py
```

4. **프론트엔드 빌드**
```bash
cd /var/www/kiosk-shop
sudo -u www-data npm install
sudo -u www-data npm run build
```

5. **Systemd 서비스 설정**
```bash
sudo nano /etc/systemd/system/kiosk-shop.service
```

6. **Nginx 설정**
```bash
sudo nano /etc/nginx/sites-available/kiosk-shop
sudo ln -s /etc/nginx/sites-available/kiosk-shop /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

## 📚 API 엔드포인트

### 인증
- `POST /api/auth/register/` - 회원가입
- `POST /api/auth/login/` - 로그인
- `POST /api/auth/logout/` - 로그아웃
- `GET /api/auth/profile/` - 프로필 조회

### 상품
- `GET /api/products/` - 상품 목록
- `POST /api/products/` - 상품 생성 (관리자)
- `GET /api/products/{id}/` - 상품 상세
- `PUT /api/products/{id}/` - 상품 수정 (관리자)
- `DELETE /api/products/{id}/` - 상품 삭제 (관리자)

### 장바구니
- `GET /api/products/cart/` - 장바구니 조회
- `POST /api/products/cart/` - 장바구니 추가
- `PUT /api/products/cart/{id}/` - 수량 변경
- `DELETE /api/products/cart/{id}/` - 아이템 제거

### 주문
- `GET /api/products/orders/` - 주문 목록
- `POST /api/products/orders/create/` - 주문 생성
- `GET /api/products/orders/{id}/` - 주문 상세

## 🛠️ 기술 스택

### 프론트엔드
- **Vue 3**: 컴포지션 API
- **TypeScript**: 정적 타입 검사
- **Tailwind CSS**: 유틸리티 기반 CSS
- **Pinia**: 상태 관리
- **Vue Router**: 라우팅
- **QRCode.js**: QR 코드 생성

### 백엔드
- **Django 4.2**: 웹 프레임워크
- **Django REST Framework**: API 구축
- **SQLite3**: 데이터베이스
- **django-cors-headers**: CORS 처리
- **Gunicorn**: WSGI 서버

### 배포
- **Nginx**: 리버스 프록시 및 정적 파일 서빙
- **Systemd**: 서비스 관리
- **Ubuntu**: 운영체제

## 📁 프로젝트 구조

```
shop/
├── backend/                 # Django 백엔드
│   ├── kiosk_backend/      # Django 프로젝트 설정
│   ├── accounts/           # 사용자 관리 앱
│   ├── products/           # 상품 관리 앱
│   ├── requirements.txt    # Python 의존성
│   └── manage_data.py      # 초기 데이터 생성
├── src/                    # Vue 프론트엔드
│   ├── components/         # Vue 컴포넌트
│   ├── views/             # 페이지 컴포넌트
│   ├── stores/            # Pinia 스토어
│   └── router/            # 라우터 설정
├── deploy.sh              # Ubuntu 배포 스크립트
├── package.json           # Node.js 의존성
└── README.md              # 프로젝트 문서
```

## 🔧 관리 명령어

### 백엔드
```bash
# 데이터베이스 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 관리자 계정 생성
python manage.py createsuperuser

# 정적 파일 수집
python manage.py collectstatic

# 개발 서버 시작
python manage.py runserver
```

### 프론트엔드
```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint
```

### 배포 후 관리
```bash
# 서비스 상태 확인
sudo systemctl status kiosk-shop

# 서비스 재시작
sudo systemctl restart kiosk-shop

# 로그 확인
sudo journalctl -u kiosk-shop -f

# Nginx 상태 확인
sudo systemctl status nginx
```

## 🔐 보안 고려사항

### 개발 환경
- 기본 관리자 계정 사용 (admin/password)
- DEBUG=True 설정
- 개발용 SECRET_KEY 사용

### 프로덕션 환경
- [ ] 강력한 SECRET_KEY 생성
- [ ] DEBUG=False 설정
- [ ] 기본 관리자 비밀번호 변경
- [ ] HTTPS 설정
- [ ] 방화벽 구성
- [ ] 정기적인 보안 업데이트

## 📞 지원 및 문의

문제가 발생하거나 기능 개선 제안이 있으시면 이슈를 등록해 주세요.

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.