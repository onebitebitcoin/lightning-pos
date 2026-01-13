/**
 * Composable for e-cash sending functionality
 * Handles Lightning invoices, Lightning addresses, and NUT-18 e-cash requests
 */

import { ref, computed, watch, type Ref } from 'vue'
import { type AxiosError } from 'axios'
import { useEcashStore, type CashuProof } from '@/stores/ecash'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useLocaleStore } from '@/stores/locale'
import apiClient from '@/services/api'
import { createBlindedOutputs, signaturesToProofs } from '@/services/cashuProtocol'
import { createPaymentPayload, parsePaymentRequest, sendPaymentViaPost, type Nut18PaymentRequest } from '@/services/nut18'
import { sendPaymentViaNostr } from '@/services/nostrTransport'
import {
  isBolt11Invoice,
  isLightningAddress,
  isEcashRequest,
  normalizeBolt11
} from '@/utils/inputValidators'

export interface InvoiceQuote {
  quoteData: any
  bolt11: string
  invoiceAmount: number
  feeReserve: number
  need: number
  available: number
}

interface ParsedRequest extends Nut18PaymentRequest {
  protocol?: 'nut18'
}

export interface EcashSendOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useEcashSend(options: EcashSendOptions = {}) {
  const { onSuccess, onError } = options

  const ecashStore = useEcashStore()
  const bitcoinStore = useBitcoinStore()
  const localeStore = useLocaleStore()
  const t = localeStore.t

  // State
  const sendInput = ref('')
  const sendAmount = ref('')
  const showScanner = ref(false)
  const scannerError = ref('')
  const fetchingQuote = ref(false)
  const invoiceQuote = ref<InvoiceQuote | null>(null)
  const invoiceError = ref('')
  const loading = ref(false)

  // Computed
  const ecashBalance = computed(() => Number(ecashStore.totalSats || 0))

  const formattedBalance = computed(() => bitcoinStore.formatSats(ecashBalance.value))

  const fiatHint = computed(() => {
    // TODO: Implement fiat conversion if needed
    return ''
  })

  const requestPayload = computed<ParsedRequest | null>(() => {
    if (!isEcashRequest(sendInput.value)) return null
    try {
      return parseEcashRequest(sendInput.value)
    } catch {
      return null
    }
  })

  const requestMintLabel = computed(() => {
    const mints = requestPayload.value?.mints
    if (!Array.isArray(mints) || !mints.length) return null
    return formatMintLabel(mints[0])
  })

  const requestTransportLabel = computed(() => {
    const transports = requestPayload.value?.transports
    if (!Array.isArray(transports) || !transports.length) return null
    const transport = transports[0]
    const type = transport?.t || transport?.type
    if (type === 'post') return 'HTTP POST'
    if (type === 'nostr') return 'Nostr DM'
    return type || null
  })

  const requestMemo = computed(() => {
    const description = requestPayload.value?.description
    return description && typeof description === 'string' ? description : null
  })

  const detectionMessage = computed(() => {
    const input = sendInput.value.trim()
    if (!input) return ''
    if (isBolt11Invoice(input)) return t('ecash.send.detected.invoice', '라이트닝 인보이스를 감지했습니다.')
    if (isLightningAddress(input)) return t('ecash.send.detected.address', '라이트닝 주소를 감지했습니다.')
    if (isEcashRequest(input)) return t('ecash.send.detected.ecashRequest', 'e-cash 요청을 감지했습니다.')
    return t('ecash.send.detected.unknown', '알 수 없는 형식입니다.')
  })

  const showAmountField = computed(() => {
    return isLightningAddress(sendInput.value)
  })

  const sendDisabled = computed(() => {
    if (loading.value) return true
    if (!sendInput.value.trim()) return true
    if (isLightningAddress(sendInput.value) && !sendAmount.value) return true
    if (invoiceQuote.value && invoiceError.value) return true
    return false
  })

  // Watch for invoice input changes
  let quoteTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => sendInput.value,
    value => {
      invoiceError.value = ''
      invoiceQuote.value = null
      if (quoteTimer) {
        clearTimeout(quoteTimer)
        quoteTimer = null
      }
      if (!isBolt11Invoice(value)) {
        fetchingQuote.value = false
        return
      }
      quoteTimer = setTimeout(() => {
        fetchInvoiceQuote(value)
      }, 350)
    }
  )

  // Helper Functions
  function parseEcashRequest(value: string): ParsedRequest {
    const trimmed = value.trim()
    const normalized = trimmed.toLowerCase()
    let payload = trimmed

    if (normalized.startsWith('cashu:')) {
      payload = trimmed.replace(/^cashu:/i, '')
    }

    const parsed = parsePaymentRequest(payload)
    return {
      ...parsed,
      protocol: 'nut18'
    }
  }

  function translateErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error
    if ((error as AxiosError)?.isAxiosError) {
      const axiosError = error as AxiosError<any>
      const detail = axiosError.response?.data?.detail || axiosError.response?.data?.error || axiosError.message
      if (typeof detail === 'string') return detail
    }
    if (error instanceof Error) {
      return error.message
    }
    return ''
  }

  function normalizeMintForCompare(url?: string): string {
    return (url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase()
  }

  function formatMintLabel(url?: string): string {
    if (!url) {
      return t('ecash.mintUnknown', '알 수 없음')
    }
    return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  }

  function getMintMismatchMessage(proofs: CashuProof[], targetMint?: string): string {
    if (!targetMint) return ''
    const normalizedTarget = normalizeMintForCompare(targetMint)
    const mismatch = proofs.find(proof => {
      const proofMint = normalizeMintForCompare(proof?.mintUrl || ecashStore.mintUrl)
      return proofMint && normalizedTarget && proofMint !== normalizedTarget
    })
    if (!mismatch) return ''
    return t(
      'ecash.send.errors.mintMismatch',
      '{proof} mint 토큰과 {target} mint 설정이 일치하지 않습니다.',
      {
        target: formatMintLabel(targetMint),
        proof: formatMintLabel(mismatch?.mintUrl)
      }
    )
  }

  async function verifyAndCleanProofs(
    selectedProofs: CashuProof[],
    mintUrl: string,
    requiredAmount: number
  ): Promise<CashuProof[]> {
    try {
      const { removeSpentProofs } = await import('@/services/cashuCheck')
      const { spent, unspent } = await removeSpentProofs(mintUrl, selectedProofs)

      if (spent.length > 0) {
        console.log(`[Ecash] Found ${spent.length} spent tokens, removing from store`)
        ecashStore.removeProofs(spent)

        const remainingTotal = unspent.reduce((sum, p) => sum + (p.amount || 0), 0)

        if (remainingTotal < requiredAmount) {
          const retrySelection = ecashStore.selectProofsForAmount(requiredAmount)
          if (!retrySelection.ok) {
            throw new Error(
              t(
                'ecash.send.errors.insufficientAfterCleanup',
                '일부 토큰이 이미 사용되어 잔액이 부족합니다. 리스트 탭에서 전체 새로고침을 먼저 실행해주세요.'
              )
            )
          }
          return retrySelection.picked
        }

        return unspent
      }

      return selectedProofs
    } catch (checkError) {
      console.warn('[Ecash] Failed to verify token state, proceeding with original selection:', checkError)
      return selectedProofs
    }
  }

  async function fetchMintKeys(targetMint: string) {
    const response = await apiClient.get('/cashu/keys/', {
      params: { mintUrl: targetMint }
    })
    return response.data
  }

  async function fetchInvoiceQuote(invoice: string) {
    if (!isBolt11Invoice(invoice)) return
    fetchingQuote.value = true
    invoiceError.value = ''
    try {
      const bolt11 = normalizeBolt11(invoice)
      const response = await apiClient.post('/cashu/melt/quote/', {
        request: bolt11,
        invoice: bolt11,
        mintUrl: ecashStore.mintUrl
      })
      const data = response.data
      const invoiceAmount = Number(data?.amount || 0)
      const feeReserve = Number(data?.fee_reserve || data?.fee || 0)
      const need = invoiceAmount + feeReserve
      const available = ecashBalance.value
      if (available < need) {
        invoiceError.value = t('ecash.send.errors.insufficient', '잔액이 부족합니다.')
      }
      invoiceQuote.value = {
        quoteData: data,
        bolt11,
        invoiceAmount,
        feeReserve,
        need,
        available
      }
    } catch (error) {
      console.error('Invoice quote failed:', error)
      invoiceError.value = translateErrorMessage(error) || t('ecash.send.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.')
    } finally {
      fetchingQuote.value = false
    }
  }

  // Main Send Functions
  async function handleNut18Send(request: Nut18PaymentRequest & { protocol: 'nut18' }) {
    const amount = Number(request.amount || 0)
    if (!amount || amount <= 0) {
      throw new Error(t('ecash.send.errors.invalidAmount', '금액이 올바르지 않습니다.'))
    }

    const allowedMints = Array.isArray(request.mints) ? request.mints : []
    if (allowedMints.length > 0) {
      const currentMint = normalizeMintForCompare(ecashStore.mintUrl)
      const allowed = allowedMints.some(mint => normalizeMintForCompare(mint) === currentMint)
      if (!allowed) {
        throw new Error(
          t(
            'ecash.send.errors.requestMintMismatch',
            '요청된 mint({request})와 현재 mint({current})가 일치하지 않습니다.',
            {
              request: formatMintLabel(allowedMints[0]),
              current: formatMintLabel(ecashStore.mintUrl)
            }
          )
        )
      }
    }

    const available = ecashBalance.value
    if (available < amount) {
      throw new Error(t('ecash.send.errors.insufficient', '잔액이 부족합니다.'))
    }

    let { ok, picked, total } = ecashStore.selectProofsForAmount(amount)
    if (!ok) {
      throw new Error(t('ecash.send.errors.insufficient', '잔액이 부족합니다.'))
    }

    const mismatch = getMintMismatchMessage(picked, ecashStore.mintUrl)
    if (mismatch) {
      throw new Error(mismatch)
    }

    picked = await verifyAndCleanProofs(picked, ecashStore.mintUrl, amount)
    total = picked.reduce((sum, p) => sum + (p.amount || 0), 0)

    const mintKeys = await fetchMintKeys(ecashStore.mintUrl)
    const paymentOutputs = await createBlindedOutputs(amount, mintKeys)
    const change = Math.max(0, Number(total) - Number(amount))
    const changeOutputs = change > 0 ? await createBlindedOutputs(change, mintKeys) : { outputs: [], outputDatas: [] }
    const combinedOutputs = [...paymentOutputs.outputs, ...changeOutputs.outputs]
    const combinedOutputDatas = [...paymentOutputs.outputDatas, ...changeOutputs.outputDatas]

    let response
    try {
      response = await apiClient.post('/cashu/swap/', {
        inputs: picked,
        outputs: combinedOutputs,
        mintUrl: ecashStore.mintUrl,
        requestId: request.id
      })
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message
      const errorCode = error?.response?.data?.code

      if (errorMsg && errorMsg.toLowerCase().includes('already spent')) {
        ecashStore.removeProofs(picked)

        throw new Error(
          t(
            'ecash.send.errors.tokenAlreadySpent',
            '토큰이 이미 사용되었습니다. 사용된 토큰을 제거했으니 다시 시도해주세요.'
          )
        )
      }

      throw new Error(errorMsg || t('ecash.send.errors.swapFailed', 'e-cash 교환에 실패했습니다.'))
    }

    const swapData = response.data
    const signatures = swapData?.signatures || swapData?.promises || []
    const allProofs = await signaturesToProofs(signatures, mintKeys, combinedOutputDatas)
    const paymentProofCount = paymentOutputs.outputDatas.length
    const paymentProofs = allProofs.slice(0, paymentProofCount)
    const changeProofs = allProofs.slice(paymentProofCount)

    const payload = createPaymentPayload({
      id: request.id,
      amount,
      memo: request.description || '',
      mint: ecashStore.mintUrl,
      unit: request.unit || 'sat',
      proofs: paymentProofs
    })

    try {
      const transports = Array.isArray(request.transports) ? request.transports : []
      const postTransport = transports.find(transport => (transport?.t || transport?.type) === 'post')
      const nostrTransport = transports.find(transport => (transport?.t || transport?.type) === 'nostr')

      if (postTransport?.a) {
        await sendPaymentViaPost(postTransport.a, payload)
      } else if (nostrTransport?.a) {
        await sendPaymentViaNostr({ nprofile: nostrTransport.a, payload })
      } else {
        throw new Error(t('ecash.send.errors.transportMissing', '전송 가능한 경로가 없습니다.'))
      }
      ecashStore.removeProofs(picked)
      if (changeProofs.length) {
        ecashStore.addProofs(changeProofs, ecashStore.mintUrl)
      }
    } catch (error) {
      console.error('Nut18 transport failed:', error)
      const fallbackProofs = [...paymentProofs, ...changeProofs]
      if (fallbackProofs.length) {
        ecashStore.addProofs(fallbackProofs, ecashStore.mintUrl)
      }
      throw error
    }
  }

  async function handleEcashRequestSend() {
    const payload = requestPayload.value
    if (!payload || payload.protocol !== 'nut18') {
      throw new Error(t('ecash.send.errors.invalidRequest', '유효하지 않은 e-cash 요청입니다.'))
    }

    await handleNut18Send(payload as Nut18PaymentRequest & { protocol: 'nut18' })
  }

  async function handleInvoiceSend() {
    if (!invoiceQuote.value) {
      throw new Error(t('ecash.send.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.'))
    }

    const { quoteData, need } = invoiceQuote.value
    let { ok, picked, total } = ecashStore.selectProofsForAmount(need)
    if (!ok) {
      throw new Error(t('ecash.send.errors.insufficient', '잔액이 부족합니다.'))
    }

    const mismatch = getMintMismatchMessage(picked, ecashStore.mintUrl)
    if (mismatch) {
      throw new Error(mismatch)
    }

    picked = await verifyAndCleanProofs(picked, ecashStore.mintUrl, need)
    total = picked.reduce((sum, p) => sum + (p.amount || 0), 0)

    const change = Math.max(0, Number(total) - Number(need))
    let changeOutputs: any[] | undefined
    let changeOutputDatas: any[] | undefined
    if (change > 0) {
      const mintKeys = await fetchMintKeys(ecashStore.mintUrl)
      const built = await createBlindedOutputs(change, mintKeys)
      changeOutputs = built.outputs
      changeOutputDatas = built.outputDatas
    }

    const meltPayload: any = {
      quote: quoteData?.quote || quoteData?.quote_id,
      inputs: picked,
      mintUrl: ecashStore.mintUrl
    }

    if (changeOutputs && changeOutputs.length > 0) {
      meltPayload.outputs = changeOutputs
    }

    let response
    try {
      response = await apiClient.post('/cashu/melt/', meltPayload)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.response?.data?.detail || error?.message

      if (errorMsg && (errorMsg.toLowerCase().includes('already spent') || errorMsg.toLowerCase().includes('token already'))) {
        ecashStore.removeProofs(picked)

        throw new Error(
          t(
            'ecash.send.errors.tokenAlreadySpent',
            '토큰이 이미 사용되었습니다. 사용된 토큰을 제거했으니 다시 시도해주세요.'
          )
        )
      }

      throw new Error(errorMsg || t('ecash.send.errors.meltFailed', '라이트닝 결제에 실패했습니다.'))
    }

    const data = response.data
    const signatures = data?.change || data?.signatures || data?.promises || []
    let changeProofs: CashuProof[] = []

    if (Array.isArray(signatures) && signatures.length && changeOutputDatas?.length) {
      const mintKeys = await fetchMintKeys(ecashStore.mintUrl)
      changeProofs = await signaturesToProofs(signatures, mintKeys, changeOutputDatas)
    }

    ecashStore.removeProofs(picked)
    if (changeProofs.length) {
      ecashStore.addProofs(changeProofs, ecashStore.mintUrl)
    }
  }

  async function handleLightningAddressSend() {
    const amount = Number(sendAmount.value)
    if (!amount || amount <= 0) {
      throw new Error(t('ecash.send.errors.amountRequired', '보낼 금액을 입력하세요.'))
    }

    const quoteResponse = await apiClient.post('/lightningaddr/quote/', {
      address: sendInput.value.trim(),
      amount
    })
    const invoice = quoteResponse.data?.request
    if (!invoice) {
      throw new Error(t('ecash.send.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.'))
    }

    sendInput.value = invoice
    await fetchInvoiceQuote(invoice)
    if (!invoiceQuote.value) {
      throw new Error(t('ecash.send.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.'))
    }
    await handleInvoiceSend()
  }

  async function prepareSend() {
    if (loading.value) return
    invoiceError.value = ''
    try {
      loading.value = true
      if (isEcashRequest(sendInput.value)) {
        await handleEcashRequestSend()
      } else if (isBolt11Invoice(sendInput.value)) {
        await handleInvoiceSend()
      } else if (isLightningAddress(sendInput.value)) {
        await handleLightningAddressSend()
      } else {
        throw new Error(t('ecash.send.errors.unsupportedInput', '지원하지 않는 형식입니다.'))
      }

      await ecashStore.refreshHoldings()
      sendInput.value = ''
      sendAmount.value = ''
      invoiceQuote.value = null
      invoiceError.value = ''

      const successMsg = t('ecash.send.success', '전송이 완료되었습니다.')
      if (onSuccess) onSuccess(successMsg)
    } catch (error) {
      console.error('Send failed:', error)
      const message = translateErrorMessage(error) || t('ecash.send.errors.generic', '전송에 실패했습니다.')
      invoiceError.value = message
      if (onError) onError(message)
    } finally {
      loading.value = false
    }
  }

  function formatSats(value: number): string {
    return bitcoinStore.formatSats(Math.max(0, Number(value) || 0))
  }

  return {
    // State
    sendInput,
    sendAmount,
    showScanner,
    scannerError,
    fetchingQuote,
    invoiceQuote,
    invoiceError,
    loading,

    // Computed
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

    // Methods
    prepareSend,
    formatSats,
    fetchInvoiceQuote
  }
}
