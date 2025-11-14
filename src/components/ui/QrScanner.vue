<template>
  <div class="relative overflow-hidden rounded-2xl border border-border-primary bg-black/40">
    <video
      ref="videoEl"
      class="block h-64 w-full object-cover"
      autoplay
      playsinline
      muted
    ></video>
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="h-48 w-48 rounded-2xl border-2 border-white/60"></div>
    </div>
    <div class="absolute left-0 right-0 bottom-0 bg-black/50 px-4 py-2 text-sm text-white">
      <p v-if="errorMessage">{{ errorMessage }}</p>
      <p v-else>
        {{ t('ecashSend.scannerHint', 'QR 코드를 프레임 안에 맞추면 자동으로 인식합니다.') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useLocaleStore } from '@/stores/locale'

const emit = defineEmits<{
  (event: 'scan', value: string): void
  (event: 'error', value: string): void
}>()

const localeStore = useLocaleStore()
const t = localeStore.t

const videoEl = ref<HTMLVideoElement | null>(null)
const errorMessage = ref('')
let mediaStream: MediaStream | null = null
let detector: any = null
let rafId: number | null = null

const barcodeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window

async function startScanner() {
  if (!barcodeSupported) {
    const message = t('ecashSend.scannerUnsupported', '이 기기에서 QR 스캔을 지원하지 않습니다.')
    errorMessage.value = message
    emit('error', message)
    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream
    }

    const BarcodeDetectorCtor = (window as any).BarcodeDetector
    detector = new BarcodeDetectorCtor({ formats: ['qr_code'] })
    scheduleDetection()
  } catch (error) {
    const message = t('ecashSend.scannerError', '카메라를 열 수 없습니다. 권한을 확인해주세요.')
    console.error('QR scanner error:', error)
    errorMessage.value = message
    emit('error', message)
  }
}

function scheduleDetection() {
  cancelDetection()
  const detect = async () => {
    if (!videoEl.value || !detector) {
      return
    }
    try {
      const barcodes = await detector.detect(videoEl.value)
      const first = Array.isArray(barcodes) ? barcodes[0] : null
      if (first) {
        const rawValue = first.rawValue || first.data || ''
        if (rawValue) {
          emit('scan', String(rawValue).trim())
          stopScanner()
          return
        }
      }
    } catch (error) {
      console.error('QR detection error:', error)
    }
    rafId = requestAnimationFrame(detect)
  }
  rafId = requestAnimationFrame(detect)
}

function cancelDetection() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function stopScanner() {
  cancelDetection()
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  detector = null
}

onMounted(() => {
  startScanner()
})

onBeforeUnmount(() => {
  stopScanner()
})
</script>
