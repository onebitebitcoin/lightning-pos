<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-300">
    <header class="glass-header sticky top-0 z-20 border-b border-border-secondary/40">
      <div class="container mx-auto flex items-center justify-between px-4 py-4">
        <div class="flex items-center space-x-3">
          <button
            class="rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            @click="router.push('/settings')"
          >
            <span class="flex items-center space-x-2">
              <UiIcon name="arrowLeft" class="h-4 w-4" />
              <span>{{ t('ecash.backToSettings', '설정으로 돌아가기') }}</span>
            </span>
          </button>
          <h1 class="text-lg font-semibold text-text-primary sm:text-xl">
            {{ t('ecash.title', 'e-cash 관리') }}
          </h1>
        </div>
        <div class="flex items-center space-x-4">
          <div class="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-text-secondary dark:bg-gray-800">
            <span class="font-medium text-text-primary">{{ formattedBalance }}</span>
            <span class="ml-1 text-xs">{{ t('ecash.balance', '보유 잔액') }}</span>
          </div>
          <div class="hidden text-sm text-text-secondary sm:flex sm:items-center sm:space-x-2">
            <UiIcon name="user" class="h-4 w-4" />
            <span>{{ authStore.username }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Tabs -->
    <div class="border-b border-border-secondary/40 bg-white dark:bg-gray-900">
      <div class="container mx-auto px-4">
        <nav class="flex space-x-1" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'px-6 py-3 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <main class="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <!-- Send Tab -->
      <div v-if="activeTab === 'send'" class="card space-y-6 p-4 sm:p-6">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-primary-600">
              {{ t('ecash.send.label', '보유 e-cash 전송') }}
            </p>
            <p class="text-base font-medium text-text-primary sm:text-lg">
              {{ t('ecash.send.subtitle', '라이트닝 또는 e-cash 요청으로 보낼 수 있습니다') }}
            </p>
          </div>
        </div>

        <div v-if="toast" :class="toastClass" class="rounded-2xl px-4 py-3 text-sm">
          {{ toast.message }}
        </div>

        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="toggleScanner"
            >
              <UiIcon name="camera" class="h-4 w-4" />
              <span>
                {{ showScanner ? t('ecash.closeScanner', '스캐너 닫기') : t('ecash.scanQr', 'QR 스캔하기') }}
              </span>
            </button>
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="pasteFromClipboardSend"
            >
              <UiIcon name="clipboard" class="h-4 w-4" />
              <span>{{ t('ecash.paste', '붙여넣기') }}</span>
            </button>
            <button
              v-if="sendInput"
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="copyRequestText"
            >
              <UiIcon name="copy" class="h-4 w-4" />
              <span>{{ t('ecash.copy', '텍스트 복사') }}</span>
            </button>
          </div>

          <div v-if="showScanner" class="space-y-3">
            <QrScanner @scan="handleScannerResult" @error="handleScannerError" />
            <p v-if="scannerError" class="text-sm text-warning-600 dark:text-warning-400">
              {{ scannerError }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-text-primary">
              {{ t('ecash.send.inputLabel', '인보이스 · 라이트닝 주소 · e-cash 요청') }}
            </label>
            <textarea
              v-model="sendInput"
              :placeholder="t('ecash.send.inputPlaceholder', 'QR을 스캔하거나 요청 텍스트를 붙여넣으세요')"
              class="min-h-[96px] w-full rounded-2xl border border-border-primary/70 bg-white/90 px-4 py-3 text-sm text-text-primary shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-gray-900/70"
            />
            <p class="text-xs text-text-secondary">{{ detectionMessage }}</p>
          </div>

          <div v-if="showAmountField" class="space-y-2">
            <label class="text-sm font-medium text-text-primary">
              {{ t('ecash.send.amountLabel', '보낼 금액 (sats)') }}
            </label>
            <input
              v-model="sendAmount"
              type="number"
              min="1"
              :max="ecashBalance"
              class="w-full rounded-2xl border border-border-primary/70 bg-white/90 px-4 py-3 text-sm text-text-primary shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-gray-900/70"
              :placeholder="t('ecash.send.amountPlaceholder', '예: 2500')"
            />
            <div class="flex flex-wrap items-center text-xs text-text-secondary">
              <span>{{ t('ecash.send.availableBalance', '사용 가능') }}: {{ formattedBalance }}</span>
              <span v-if="fiatHint" class="ml-2 text-[11px] text-text-secondary/80">({{ fiatHint }})</span>
            </div>
          </div>

          <div v-if="requestPayload" class="rounded-2xl border border-dashed border-border-primary/60 bg-gray-50 p-4 text-sm dark:bg-gray-900/40">
            <p class="text-sm font-medium text-text-primary">
              {{ t('ecash.send.requestSummary', '요청 정보 요약') }}
            </p>
            <div class="mt-3 space-y-2 text-xs text-text-secondary">
              <div class="flex items-center justify-between gap-4">
                <span>{{ t('ecash.send.requestAmount', '요청 금액') }}</span>
                <span class="font-semibold text-text-primary">{{ formatSats(requestPayload.amount || 0) }}</span>
              </div>
              <div v-if="requestMintLabel" class="flex items-center justify-between gap-4">
                <span>{{ t('ecash.send.requestMint', '요청 Mint') }}</span>
                <span class="font-semibold text-text-primary">{{ requestMintLabel }}</span>
              </div>
              <div v-if="requestTransportLabel" class="flex items-center justify-between gap-4">
                <span>{{ t('ecash.send.requestTransport', '전송 방식') }}</span>
                <span class="font-semibold text-text-primary">{{ requestTransportLabel }}</span>
              </div>
              <div v-if="requestMemo" class="flex items-center justify-between gap-4">
                <span>{{ t('ecash.send.requestMemo', '메모') }}</span>
                <span class="text-right font-medium text-text-primary">{{ requestMemo }}</span>
              </div>
            </div>
          </div>

          <div v-if="invoiceQuote" class="rounded-2xl border border-border-primary/70 bg-gray-50 p-4 text-sm text-text-secondary dark:bg-gray-900/30">
            <p class="text-sm font-medium text-text-primary">
              {{ t('ecash.send.invoiceSummary', '인보이스 요약') }}
            </p>
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span>{{ t('ecash.send.invoiceAmount', '결제 금액') }}</span>
                <span class="font-semibold text-text-primary">{{ formatSats(invoiceQuote.invoiceAmount) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>{{ t('ecash.send.invoiceFee', '수수료 예약') }}</span>
                <span class="font-semibold text-text-primary">{{ formatSats(invoiceQuote.feeReserve) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>{{ t('ecash.send.remainingAfter', '결제 후 잔액') }}</span>
                <span class="font-semibold text-text-primary">
                  {{ formatSats(Math.max(invoiceQuote.available - invoiceQuote.need, 0)) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="invoiceError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {{ invoiceError }}
          </div>
        </div>

        <div class="pt-2">
          <button
            type="button"
            class="btn btn-primary inline-flex w-full items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-base font-semibold shadow-soft"
            :disabled="sendDisabled"
            @click="prepareSend"
          >
            <UiIcon name="send" class="h-5 w-5" />
            <span>
              {{ loading ? t('ecash.send.sending', '보내는 중...') : t('ecash.send.sendAction', 'e-cash 보내기') }}
            </span>
          </button>
        </div>
      </div>

      <!-- Receive Tab -->
      <div v-if="activeTab === 'receive'" class="card space-y-6 p-4 sm:p-6">
        <div>
          <p class="text-sm font-semibold text-primary-600">
            {{ t('ecash.receive.label', 'e-cash 받기') }}
          </p>
          <p class="text-base font-medium text-text-primary sm:text-lg">
            {{ t('ecash.receive.subtitle', '다른 지갑에서 복사한 e-cash 토큰을 붙여넣으세요') }}
          </p>
        </div>

        <div v-if="receiveToast" :class="receiveToastClass" class="rounded-2xl px-4 py-3 text-sm">
          {{ receiveToast.message }}
        </div>

        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="toggleReceiveScanner"
            >
              <UiIcon name="camera" class="h-4 w-4" />
              <span>
                {{ showReceiveScanner ? t('ecash.closeScanner', '스캐너 닫기') : t('ecash.scanQr', 'QR 스캔하기') }}
              </span>
            </button>
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="pasteFromClipboardReceive"
            >
              <UiIcon name="clipboard" class="h-4 w-4" />
              <span>{{ t('ecash.paste', '붙여넣기') }}</span>
            </button>
          </div>

          <div v-if="showReceiveScanner" class="space-y-3">
            <QrScanner @scan="handleReceiveScannerResult" @error="handleReceiveScannerError" />
            <p v-if="receiveScannerError" class="text-sm text-warning-600 dark:text-warning-400">
              {{ receiveScannerError }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-text-primary">
              {{ t('ecash.receive.inputLabel', 'e-cash 토큰 문자열') }}
            </label>
            <textarea
              v-model="receiveInput"
              :placeholder="t('ecash.receive.inputPlaceholder', '예: cashuA... 또는 cashuB...')"
              class="min-h-[120px] w-full rounded-2xl border border-border-primary/70 bg-white/90 px-4 py-3 text-sm text-text-primary shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-gray-900/70"
            />
            <p class="text-xs text-text-secondary">
              {{ t('ecash.receive.helper', 'cashuA 또는 cashuB로 시작하는 토큰 문자열을 입력하세요') }}
            </p>
          </div>

          <div v-if="receiveError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {{ receiveError }}
          </div>
        </div>

        <div class="pt-2">
          <button
            type="button"
            class="btn btn-primary inline-flex w-full items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-base font-semibold shadow-soft"
            :disabled="receiveDisabled"
            @click="handleReceiveSubmit"
          >
            <UiIcon name="download" class="h-5 w-5" />
            <span>
              {{ receivingEcash ? t('ecash.receive.receiving', '처리 중...') : t('ecash.receive.receiveAction', '잔액에 추가') }}
            </span>
          </button>
        </div>
      </div>

      <!-- List Tab -->
      <div v-if="activeTab === 'list'" class="card space-y-6 p-4 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-primary-600">
              {{ t('ecash.list.label', 'e-cash 토큰 관리') }}
            </p>
            <p class="text-base font-medium text-text-primary sm:text-lg">
              {{ t('ecash.list.subtitle', '보유 중인 토큰을 확인하고 관리하세요') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="handleBackup"
            >
              <UiIcon name="download" class="h-4 w-4" />
              <span>{{ t('ecash.list.backup', '백업') }}</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="triggerRestore"
            >
              <UiIcon name="upload" class="h-4 w-4" />
              <span>{{ t('ecash.list.restore', '복원') }}</span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handleFileChange"
            />
          </div>
        </div>

        <div class="space-y-4">
          <!-- Mint URL Configuration -->
          <div class="rounded-2xl border border-border-primary/70 bg-gray-50 p-4 dark:bg-gray-900/30">
            <label class="mb-2 block text-sm font-medium text-text-primary">
              {{ t('ecash.list.mintLabel', 'Mint 서버 URL') }}
            </label>
            <div class="flex gap-2">
              <input
                v-model="mintUrlInput"
                type="text"
                :placeholder="t('ecash.list.mintPlaceholder', '예: mint.coinos.io')"
                class="flex-1 rounded-xl border border-border-primary/70 bg-white px-4 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-gray-900"
              />
              <button
                type="button"
                class="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                @click="saveMintUrl"
              >
                {{ t('ecash.list.save', '저장') }}
              </button>
            </div>
            <p class="mt-1 text-xs text-text-secondary">
              {{ t('ecash.list.mintHelper', 'https:// 접두사가 없으면 자동으로 추가됩니다.') }}
            </p>
          </div>

          <!-- Holdings Summary -->
          <div class="rounded-2xl border border-border-primary/70 bg-gradient-to-br from-primary-50 to-indigo-50 p-4 dark:from-primary-900/20 dark:to-indigo-900/20">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-text-secondary">
                  {{ t('ecash.list.totalHoldings', '총 보유량') }}
                </p>
                <p class="text-2xl font-bold text-primary-600">
                  {{ formattedBalance }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-text-secondary">
                  {{ t('ecash.list.tokenCount', '토큰 수') }}
                </p>
                <p class="text-2xl font-bold text-text-primary">
                  {{ ecashStore.proofsCount }}
                </p>
              </div>
            </div>
          </div>

          <!-- Holdings by Mint -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-text-primary">
                {{ t('ecash.list.holdingsByMint', 'Mint 별 토큰 잔액') }}
              </h3>
              <button
                type="button"
                class="text-sm text-primary-600 hover:text-primary-700"
                @click="refreshHoldings"
              >
                {{ t('ecash.list.refresh', '새로고침') }}
              </button>
            </div>

            <div v-if="ecashHoldings.length === 0" class="rounded-2xl border border-dashed border-border-primary/60 bg-gray-50 p-8 text-center dark:bg-gray-900/40">
              <UiIcon name="box" class="mx-auto h-12 w-12 text-text-secondary/50" />
              <p class="mt-2 text-sm text-text-secondary">
                {{ t('ecash.list.empty', '보유 중인 e-cash 토큰이 없습니다.') }}
              </p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(holding, index) in ecashHoldings"
                :key="index"
                class="rounded-2xl border border-border-primary/70 bg-white p-4 transition-all hover:shadow-md dark:bg-gray-900"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-text-primary">
                      {{ formatMintLabel(holding.mintUrl) }}
                    </p>
                    <p class="mt-1 text-xs text-text-secondary">
                      {{ t('ecash.list.tokenCountInMint', '{count}개의 토큰', { count: holding.count }) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold text-primary-600">
                      {{ formatSats(holding.amount) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl border border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30"
              :disabled="!hasEcashHoldings"
              @click="refreshHoldings"
            >
              {{ t('ecash.list.refreshAll', '전체 새로고침') }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl border border-red-600 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
              :disabled="!hasEcashHoldings"
              @click="deleteAllTokens"
            >
              {{ t('ecash.list.deleteAll', '모두 삭제') }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import QrScanner from '@/components/ui/QrScanner.vue'
import { useEcashStore } from '@/stores/ecash'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useEcashSend } from '@/composables/useEcashSend'
import { useEcashReceive } from '@/composables/useEcashReceive'
import { useEcashList } from '@/composables/useEcashList'
import { useToast } from '@/composables/useToast'
import { useClipboard } from '@/composables/useClipboard'
import { formatSats as formatSatsUtil } from '@/utils/formatters'

// Stores and router
const router = useRouter()
const authStore = useAuthStore()
const ecashStore = useEcashStore()
const localeStore = useLocaleStore()
const bitcoinStore = useBitcoinStore()
const t = localeStore.t

// Tab state
type TabId = 'send' | 'receive' | 'list'
const activeTab = ref<TabId>('send')
const tabs = computed(() => [
  { id: 'send' as const, label: t('ecash.tabs.send', '보내기') },
  { id: 'receive' as const, label: t('ecash.tabs.receive', '받기') },
  { id: 'list' as const, label: t('ecash.tabs.list', '리스트') }
])

// Toast notifications
const { showSuccess, showError, showInfo } = useToast()

// Send composable with toast callbacks
const sendComposable = useEcashSend({
  onSuccess: (msg) => showSuccess(msg),
  onError: (msg) => showError(msg)
})

// Receive composable with toast callbacks
const receiveComposable = useEcashReceive({
  onSuccess: (msg) => showSuccess(msg),
  onError: (msg) => showError(msg)
})

// List composable with toast callbacks
const listComposable = useEcashList({
  onSuccess: (msg) => showSuccess(msg),
  onError: (msg) => showError(msg)
})

// Clipboard composable
const { copyToClipboard, pasteFromClipboard } = useClipboard()

// Destructure send composable
const {
  sendInput,
  sendAmount,
  showScanner,
  scannerError,
  fetchingQuote,
  invoiceQuote,
  invoiceError,
  loading,
  ecashBalance,
  formattedBalance,
  fiatHint,
  requestPayload,
  requestMintLabel,
  requestTransportLabel,
  requestMemo,
  detectionMessage,
  showAmountField,
  sendDisabled,
  prepareSend,
  formatSats
} = sendComposable

// Destructure receive composable
const {
  receiveInput,
  receiveError,
  receivingEcash,
  showReceiveScanner,
  receiveScannerError,
  handleReceiveSubmit,
  toggleReceiveScanner,
  handleReceiveScannerResult,
  handleReceiveScannerError
} = receiveComposable

// Destructure list composable
const {
  mintUrlInput,
  fileInput,
  ecashHoldings,
  hasEcashHoldings,
  refreshHoldings,
  saveMintUrl,
  handleBackup,
  triggerRestore,
  handleFileChange,
  deleteAllTokens
} = listComposable

// Send tab - QR Scanner handlers
function toggleScanner() {
  showScanner.value = !showScanner.value
  scannerError.value = ''
}

function handleScannerResult(value: string) {
  sendInput.value = value
  showScanner.value = false
  scannerError.value = ''
  showInfo(t('ecash.scanned', 'QR 코드에서 값을 불러왔습니다.'))
}

function handleScannerError(message: string) {
  scannerError.value = message
}

// Send tab - Clipboard handlers
async function pasteFromClipboardSend() {
  const text = await pasteFromClipboard()
  if (text) {
    sendInput.value = text
    showInfo(t('ecash.pasted', '클립보드 내용을 불러왔습니다.'))
  } else {
    showError(t('ecash.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

async function copyRequestText() {
  const success = await copyToClipboard(sendInput.value.trim())
  if (success) {
    showSuccess(t('ecash.copied', '요청 텍스트를 복사했습니다.'))
  } else {
    showError(t('ecash.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

// Receive tab - Clipboard handlers
async function pasteFromClipboardReceive() {
  const text = await pasteFromClipboard()
  if (text) {
    receiveInput.value = text
    showInfo(t('ecash.pasted', '클립보드 내용을 불러왔습니다.'))
  } else {
    showError(t('ecash.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

// Helper to format mint label
function formatMintLabel(url?: string): string {
  if (!url) {
    return t('ecash.mintUnknown', '알 수 없음')
  }
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

// Computed for receive disabled state
const receiveDisabled = computed(() => {
  return receivingEcash.value || !receiveInput.value.trim()
})

// Deprecated toast refs (for backward compatibility with template)
const toast = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const receiveToast = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

const toastClass = computed(() => {
  if (!toast.value) return ''
  if (toast.value.type === 'error') {
    return 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200'
  }
  if (toast.value.type === 'success') {
    return 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-200'
  }
  return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
})

const receiveToastClass = computed(() => {
  if (!receiveToast.value) return ''
  if (receiveToast.value.type === 'error') {
    return 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200'
  }
  if (receiveToast.value.type === 'success') {
    return 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-200'
  }
  return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
})
</script>
