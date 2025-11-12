<template>
  <div class="min-h-screen bg-bg-secondary">
    <header class="glass-header sticky top-0 z-30">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 shadow-soft">
            <UiIcon name="bookOpen" class="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-text-secondary">
              {{ localeStore.t('brand.name', '한입 POS') }}
            </p>
            <h1 class="text-xl font-semibold text-text-primary">
              {{ t('guide.title', '사용 가이드') }}
            </h1>
          </div>
        </div>
        <div class="flex gap-2">
          <RouterLink
            v-if="authStore.isLoggedIn"
            to="/shop"
            class="btn btn-secondary px-4 py-2 text-sm"
          >
            {{ t('settings.backToShop', '상점으로 돌아가기') }}
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="btn btn-primary px-4 py-2 text-sm"
          >
            {{ t('guide.login', '로그인하기') }}
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8 space-y-10">
      <!-- Hero -->
      <section class="card p-6 md:p-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p class="text-sm font-medium text-primary-600 mb-2">{{ t('guide.hero.badge', '시작 안내') }}</p>
            <h2 class="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              {{ t('guide.hero.heading', '키오스크 운영, 이 순서대로 따라 해보세요') }}
            </h2>
            <p class="text-text-secondary">
              {{ t('guide.hero.description', '입금용 라이트닝 주소 연결부터 상품 등록, 실제 결제 흐름까지 한 번에 정리했습니다. 필요한 항목만 골라 확인하고 현장에서 바로 적용하세요.') }}
            </p>
          </div>
          <div class="flex flex-col gap-3 w-full md:w-80">
            <div class="glass-panel rounded-2xl p-4">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-primary-600/10 text-primary-600">
                  <UiIcon name="checkCircle" class="h-6 w-6" />
                </div>
                <div>
                  <p class="text-sm text-text-secondary">{{ t('guide.hero.checklist.title', '핵심 체크리스트') }}</p>
                  <p class="text-lg font-semibold text-text-primary">{{ t('guide.hero.checklist.summary', '3 Step 완료') }}</p>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-dashed border-primary-200 dark:border-primary-900/40 p-4 text-sm text-text-secondary">
              {{ t('guide.hero.tipPrefix', '⚡ 팁: 먼저 ') }}
              <span class="text-primary-600 font-medium">{{ t('guide.hero.tipHighlight', '입금 라이트닝 주소') }}</span>
              {{ t('guide.hero.tipSuffix', '를 정확히 저장한 뒤 대표 상품을 등록하고, 마지막에 실제 결제 과정을 따라가며 검증하세요.') }}
            </div>
          </div>
        </div>
      </section>

      <!-- Product registration -->
      <section class="card p-6 md:p-8 space-y-6">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-2xl bg-success-100 text-success-600">
            <UiIcon name="box" class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-success-600">{{ t('guide.product.badge', '상품 등록') }}</p>
            <h3 class="text-2xl font-semibold text-text-primary">{{ t('guide.product.heading', '관리자 > 상품 관리') }}</h3>
          </div>
        </div>
        <div class="grid gap-5 md:grid-cols-2">
          <article
            v-for="item in productSteps"
            :key="item.title"
            class="rounded-2xl border border-border-primary p-5 bg-white/70 dark:bg-gray-900/40"
          >
            <p class="text-sm font-semibold text-text-secondary mb-1">{{ item.topic }}</p>
            <h4 class="text-lg font-semibold text-text-primary mb-2">{{ item.title }}</h4>
            <p class="text-sm text-text-secondary mb-3">{{ item.detail }}</p>
            <ul class="space-y-1 text-sm text-text-secondary">
              <li v-for="tip in item.tips" :key="tip">• {{ tip }}</li>
            </ul>
          </article>
        </div>
        <RouterLink to="/settings" class="btn btn-primary px-6 py-3 w-full md:w-auto">
          {{ t('guide.product.button', '상품 관리 화면으로 이동') }}
        </RouterLink>
      </section>

      <!-- Lightning guide -->
      <section class="card p-6 md:p-8 space-y-5">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-2xl bg-primary-100 text-primary-600">
            <UiIcon name="lightning" class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-primary-600">{{ t('guide.lightning.badge', '라이트닝 주소') }}</p>
            <h3 class="text-2xl font-semibold text-text-primary">{{ t('guide.lightning.heading', '수금 계좌 연결하기') }}</h3>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="step in lightningSteps"
            :key="step.title"
            class="rounded-2xl border border-border-primary p-5 bg-white/70 dark:bg-gray-900/40 flex flex-col gap-2"
          >
            <p class="text-xs font-medium text-primary-600">STEP {{ step.id }}</p>
            <h4 class="text-lg font-semibold text-text-primary">{{ step.title }}</h4>
            <p class="text-sm text-text-secondary">{{ step.description }}</p>
          </div>
        </div>
        <div class="rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 p-5">
          <h4 class="text-sm font-semibold text-primary-700 dark:text-primary-200 mb-2">
            {{ t('guide.lightning.checklist.title', '테스트 체크리스트') }}
          </h4>
          <ul class="text-sm text-primary-700/80 dark:text-primary-100 space-y-1">
            <li>{{ t('guide.lightning.checklist.item1', '• 최소/최대 송금 한도 확인 (Lightning 서비스마다 다릅니다)') }}</li>
            <li>{{ t('guide.lightning.checklist.item2', '• Settings > 사용자 설정에서 주소 저장 후 결제 페이지에서 인보이스 생성 테스트') }}</li>
            <li>{{ t('guide.lightning.checklist.item3', '• 테스트 완료 후 shop > 결제 화면에서 실제 라이트닝 인보이스가 뜨는지 확인') }}</li>
          </ul>
        </div>
      </section>

      <!-- Payment guide -->
      <section class="card p-6 md:p-8 space-y-6">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-2xl bg-warning-100 text-warning-700">
            <UiIcon name="coin" class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-warning-600">{{ t('guide.payment.badge', '결제 흐름') }}</p>
            <h3 class="text-2xl font-semibold text-text-primary">{{ t('guide.payment.heading', '현장 결제 절차') }}</h3>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <article class="rounded-2xl border border-border-primary p-5 bg-white/70 dark:bg-gray-900/40">
            <p class="text-sm font-semibold text-text-secondary mb-2">
              {{ t('guide.payment.operatorTitle', '매장 운영자 체크') }}
            </p>
            <ul class="space-y-3 text-sm text-text-secondary">
              <li><span class="font-semibold text-text-primary">1.</span> {{ t('guide.payment.operator.item1', '제품 스캔/터치로 장바구니 채우기 → 수량 조정') }}</li>
              <li><span class="font-semibold text-text-primary">2.</span> {{ t('guide.payment.operator.item2', '필요한 경우 할인 프리셋 또는 커스텀 할인 적용') }}</li>
              <li><span class="font-semibold text-text-primary">3.</span> {{ t('guide.payment.operator.item3', '결제 버튼 클릭 후 라이트닝 방식 선택') }}</li>
              <li><span class="font-semibold text-text-primary">4.</span> {{ t('guide.payment.operator.item4', '인보이스 생성 후 고객에게 QR 화면 제시') }}</li>
            </ul>
          </article>
          <article class="rounded-2xl border border-border-primary p-5 bg-white/70 dark:bg-gray-900/40">
            <p class="text-sm font-semibold text-text-secondary mb-2">
              {{ t('guide.payment.customerTitle', '고객 안내 스크립트') }}
            </p>
            <ul class="space-y-3 text-sm text-text-secondary">
              <li><span class="font-semibold text-text-primary">①</span> {{ t('guide.payment.customer.item1', '“라이트닝 지갑을 열고 QR을 스캔해주세요.”') }}</li>
              <li><span class="font-semibold text-text-primary">②</span> {{ t('guide.payment.customer.item2', '“결제가 완료되면 성공 알림을 보여주세요.”') }}</li>
              <li><span class="font-semibold text-text-primary">③</span> {{ t('guide.payment.customer.item3', '“POS에서 ‘결제 완료’ 버튼을 눌러 주문을 마감합니다.”') }}</li>
            </ul>
            <div class="mt-4 text-xs text-text-secondary">
              {{ t('guide.payment.customer.tip', '⚡ QR 생성에 실패하면 다른 라이트닝 주소를 자동으로 시도하니 잠시만 기다려 주세요.') }}
            </div>
          </article>
        </div>
      </section>

      <!-- CTA -->
      <section class="card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 class="text-xl font-semibold text-text-primary mb-1">
            {{ t('guide.cta.title', '더 필요한 내용이 있나요?') }}
          </h3>
          <p class="text-text-secondary text-sm">
            {{ t('guide.cta.description', '설정 화면에서 라이트닝 주소, 상품, 사용자 프로필을 항상 최신 상태로 유지하세요.') }}
          </p>
        </div>
        <div class="flex gap-2">
          <RouterLink to="/settings" class="btn btn-secondary px-6 py-3 text-sm">
            {{ t('guide.cta.settings', '설정 열기') }}
          </RouterLink>
          <RouterLink to="/payment" class="btn btn-primary px-6 py-3 text-sm">
            {{ t('guide.cta.payment', '결제 화면 보기') }}
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UiIcon from '@/components/ui/Icon.vue'
import { useLocaleStore } from '@/stores/locale'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const t = localeStore.t

const productSteps = computed(() => [
  {
    topic: t('guide.product.step1.topic', '상품 추가'),
    title: t('guide.product.step1.title', '이미지 · 가격 · 카테고리 입력'),
    detail: t('guide.product.step1.detail', 'Settings > 상품 관리에서 “새 상품 추가” 버튼을 눌러 필수 정보를 작성합니다.'),
    tips: [
      t('guide.product.step1.tip1', '이미지는 1:1 비율을 권장 (최소 512px)'),
      t('guide.product.step1.tip2', '판매가와 정가를 입력하면 할인율이 자동 표시됩니다'),
      t('guide.product.step1.tip3', '가격 입력 후 자동으로 Sats 가격이 계산됩니다')
    ]
  },
  {
    topic: t('guide.product.step2.topic', '빠른 수정'),
    title: t('guide.product.step2.title', '목록에서 바로 편집/삭제'),
    detail: t('guide.product.step2.detail', '상품 리스트의 액션 버튼으로 즉시 수정하거나 삭제할 수 있습니다.'),
    tips: [
      t('guide.product.step2.tip1', '수정 시 실시간으로 장바구니에 반영됩니다'),
      t('guide.product.step2.tip2', '삭제 전에는 꼭 판매 중지 상태인지 확인하세요')
    ]
  }
])

const lightningSteps = computed(() => [
  {
    id: 1,
    title: t('guide.lightning.step1.title', '라이트닝 지갑 준비'),
    description: t('guide.lightning.step1.description', 'Wallet of Satoshi, Alby, Blink 등에서 LN 주소를 발급받습니다.')
  },
  {
    id: 2,
    title: t('guide.lightning.step2.title', 'Settings > 사용자 설정'),
    description: t('guide.lightning.step2.description', '라이트닝 주소 입력란에 `username@domain.com` 형태로 저장합니다.')
  },
  {
    id: 3,
    title: t('guide.lightning.step3.title', '결제하는 방법'),
    description: t('guide.lightning.step3.description', 'Shop에서 상품을 담은 뒤 “결제하기” → 할인/팁 선택 → 라이트닝 인보이스 생성 → QR 스캔으로 결제 완료 여부를 확인합니다.')
  }
])
</script>
