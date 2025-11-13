<template>
  <div class="min-h-screen bg-bg-secondary">
    <header class="glass-header sticky top-0 z-30 transition-colors duration-200">
      <div class="container mx-auto px-4 py-3 md:py-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center md:hidden">
          <div class="flex items-center space-x-2">
            <button
              @click="$router.push('/shop')"
              class="text-text-secondary hover:text-text-primary p-1 transition-colors duration-200"
              :aria-label="t('settings.backToShop', '상점으로 돌아가기')"
            >
              <UiIcon name="arrowLeft" class="h-5 w-5" />
            </button>
            <div class="flex items-center space-x-2">
              <div class="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 shadow-soft">
                <UiIcon name="bookOpen" class="h-5 w-5 text-primary-600" />
              </div>
              <h1 class="text-lg font-bold text-text-primary">
                {{ t('guide.title', '사용 가이드') }}
              </h1>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <div class="text-right text-xs">
              <div class="flex items-center space-x-1">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" :title="t('settings.priceUnavailable', '가격 정보를 불러올 수 없습니다')">
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
                <template v-else>
                  <UiIcon name="btc" class="h-4 w-4 text-orange-500" />
                  <span class="text-gray-900 dark:text-white">{{ formattedBtcPrice }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" :title="t('common.priceStale', '가격 정보가 오래되었습니다')">
                    <UiIcon name="warning" class="h-4 w-4" />
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="themeStore.isDark ? t('settings.theme.switchLight', '라이트 모드로 전환') : t('settings.theme.switchDark', '다크 모드로 전환')"
            >
              <UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" class="h-5 w-5" />
            </button>
            <span v-if="authStore.username" class="text-sm text-text-secondary hidden sm:inline">{{ authStore.username }}님</span>
            <RouterLink
              v-else
              to="/login"
              class="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              {{ t('guide.login', '로그인하기') }}
            </RouterLink>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/shop')"
              class="text-text-secondary hover:text-text-primary flex items-center space-x-1 transition-colors duration-200"
            >
              <UiIcon name="arrowLeft" class="h-4 w-4" />
              <span>{{ t('settings.backToShop', '상점으로 돌아가기') }}</span>
            </button>
            <div class="flex items-center space-x-3">
              <div class="p-2 rounded-xl bg-white/70 dark:bg-gray-800/70 shadow-soft">
                <UiIcon name="bookOpen" class="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-text-secondary">
                  {{ localeStore.t('brand.name', '한입 POS') }}
                </p>
                <h1 class="text-2xl font-bold text-text-primary">
                  {{ t('guide.title', '사용 가이드') }}
                </h1>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <div class="text-sm text-text-secondary">
                {{ t('header.btcPrice', 'BTC 가격') }}
              </div>
              <div class="flex items-center space-x-1 text-sm font-medium">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" :title="t('settings.priceUnavailable', '가격 정보를 불러올 수 없습니다')">
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
                <template v-else>
                  <UiIcon name="btc" class="h-4 w-4 text-orange-500" />
                  <span class="text-gray-900 dark:text-white">{{ formattedBtcPrice }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" :title="t('common.priceStale', '가격 정보가 오래되었습니다')">
                    <UiIcon name="warning" class="h-4 w-4" />
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="themeStore.isDark ? t('settings.theme.switchLight', '라이트 모드로 전환') : t('settings.theme.switchDark', '다크 모드로 전환')"
            >
              <UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" class="h-5 w-5" />
            </button>
            <span v-if="authStore.username" class="text-gray-600 dark:text-gray-300">{{ authStore.username }}님</span>
            <RouterLink
              v-else
              to="/login"
              class="text-primary-600 hover:text-primary-500 font-medium"
            >
              {{ t('guide.login', '로그인하기') }}
            </RouterLink>
          </div>
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
        </div>
      </section>

      <!-- Lightning guide -->
      <section class="card p-6 md:p-8 space-y-5">
        <div class="flex items-center gap-3">
          <div class="px-4 py-2 rounded-2xl bg-primary-100 text-primary-700 text-xs font-semibold tracking-widest">
            STEP 1
          </div>
          <div>
            <p class="text-sm font-medium text-primary-600">{{ t('guide.lightning.badge', '라이트닝 주소') }}</p>
            <h3 class="text-2xl font-semibold text-text-primary">{{ t('guide.lightning.heading', '입금 지갑 연결하기') }}</h3>
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
            <li>{{ t('guide.lightning.checklist.item2', '• "라이트닝 주소 입력" 섹션에 주소 저장 후 결제 페이지에서 인보이스 생성 테스트') }}</li>
            <li>{{ t('guide.lightning.checklist.item3', '• 테스트 완료 후 shop > 결제 화면에서 실제 라이트닝 인보이스가 뜨는지 확인') }}</li>
          </ul>
        </div>
        <div class="flex justify-end">
          <RouterLink to="/settings" class="btn btn-primary px-6 py-3 text-sm">
            {{ t('guide.lightning.button', '지갑 등록하기') }}
          </RouterLink>
        </div>
      </section>

      <!-- Product registration -->
      <section class="card p-6 md:p-8 space-y-6">
        <div class="flex items-center gap-3">
          <div class="px-4 py-2 rounded-2xl bg-primary-100 text-primary-700 text-xs font-semibold tracking-widest">
            STEP 2
          </div>
          <div>
            <p class="text-sm font-medium text-success-600">{{ t('guide.product.badge', '상품 등록') }}</p>
            <h3 class="text-2xl font-semibold text-text-primary">{{ t('guide.product.heading', '상품 추가하기') }}</h3>
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
        <div class="flex justify-end">
          <RouterLink to="/products/new" class="btn btn-primary px-6 py-3 text-sm">
            {{ t('guide.product.button', '새 상품 추가하기') }}
          </RouterLink>
        </div>
      </section>

      <!-- Payment guide -->
      <section class="card p-6 md:p-8 space-y-6">
        <div class="flex items-center gap-3">
          <div class="px-4 py-2 rounded-2xl bg-primary-100 text-primary-700 text-xs font-semibold tracking-widest">
            STEP 3
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

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UiIcon from '@/components/ui/Icon.vue'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const t = localeStore.t

const formattedBtcPrice = computed(() => bitcoinStore.formatBtcPrice())

onMounted(async () => {
  try {
    await bitcoinStore.initialize()
  } catch (error) {
    console.error('비트코인 가격 초기화 실패:', error)
  }
})

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
    title: t('guide.lightning.step1.title', '입금 지갑 연결하기'),
    description: t('guide.lightning.step1.description', 'Wallet of Satoshi, Strike, Coinos 같은 라이트닝 지갑에서 LN 주소를 발급받아 수금 계좌로 사용하세요.')
  },
  {
    id: 2,
    title: t('guide.lightning.step2.title', '라이트닝 주소 입력'),
    description: t('guide.lightning.step2.description', '“라이트닝 주소 입력” 메뉴에서 `username@domain.com` 형식으로 저장해 테스트 결제를 준비하세요.')
  },
  {
    id: 3,
    title: t('guide.lightning.step3.title', '결제하는 방법'),
    description: t('guide.lightning.step3.description', 'Shop에서 상품을 담고 “결제하기” → 할인/팁 선택 → 라이트닝 인보이스 생성 → QR 스캔으로 결제를 진행합니다. ⚠️ 결제 완료는 지갑에서 입금 알림을 직접 확인해야 합니다.')
  }
])
</script>
