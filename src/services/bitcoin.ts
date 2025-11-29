import { apiClient } from "./api";

export type FiatCurrency = 'KRW' | 'USD' | 'JPY'

export interface BitcoinPriceData {
  krw: number
  usd: number
  jpy: number
  exchangeRates: {
    usd: number
    jpy: number
  }
  timestamp: number
}

class BitcoinService {
  private cache: BitcoinPriceData | null = null
  private cacheExpiration = 1 * 60 * 1000 // 1 minute
  private upbitTickerUrl = 'https://api.upbit.com/v1/ticker?markets=KRW-BTC,USDT-BTC'
  private forexUrl = 'https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD,FRX.KRWJPY'

  async getCurrentPrice(): Promise<BitcoinPriceData> {
    // Return cached data if still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheExpiration) {
      return this.cache
    }

    try {
      const [tickerResponse, forexResponse] = await Promise.all([
        fetch(this.upbitTickerUrl),
        fetch(this.forexUrl).catch(() => null) // Forex 데이터는 실패해도 KRW 가격은 사용할 수 있게 허용
      ])

      if (!tickerResponse.ok) {
        throw new Error(`Upbit ticker HTTP error: ${tickerResponse.status}`)
      }

      const tickerData: Array<{
        market: string
        trade_price: number
      }> = await tickerResponse.json()

      const forexData: Array<{
        code: string
        basePrice: number
        currencyUnit: number
      }> | null = forexResponse && forexResponse.ok ? await forexResponse.json() : null

      const krwTicker = tickerData.find(item => item.market === 'KRW-BTC')
      const usdTicker = tickerData.find(item => item.market === 'USDT-BTC')

      if (!krwTicker?.trade_price) {
        throw new Error('Upbit KRW-BTC 가격을 가져오지 못했습니다')
      }

      const usdRate = forexData?.find(rate => rate.code === 'FRX.KRWUSD')
      const jpyRate = forexData?.find(rate => rate.code === 'FRX.KRWJPY')

      const krwPerUsd = usdRate ? usdRate.basePrice / Math.max(usdRate.currencyUnit, 1) : 1350 // Fallback default
      const krwPerJpy = jpyRate ? jpyRate.basePrice / Math.max(jpyRate.currencyUnit, 1) : 9 // Fallback default

      const krwPrice = krwTicker.trade_price
      const usdPrice = usdTicker?.trade_price
        ?? (krwPerUsd ? krwPrice / krwPerUsd : 0)
      const jpyPrice = krwPerJpy ? krwPrice / krwPerJpy : 0

      this.cache = {
        krw: krwPrice,
        usd: usdPrice,
        jpy: jpyPrice,
        exchangeRates: {
          usd: krwPerUsd,
          jpy: krwPerJpy
        },
        timestamp: Date.now()
      }

      return this.cache
    } catch (error) {
      console.error('비트코인 가격 조회 실패:', error)

      if (this.cache) {
        return this.cache
      }
      
      throw error
    }
  }

  // Generic helper for any fiat amount
  convertToSats(fiatAmount: number, btcPriceFiat: number): number {
    if (!btcPriceFiat) return 0
    const btcAmount = fiatAmount / btcPriceFiat
    return Math.round(btcAmount * 100000000) // 1 BTC = 100,000,000 sats
  }

  // Convert KRW amount to satoshis (legacy helper)
  krwToSats(krwAmount: number, btcPriceKrw: number): number {
    return this.convertToSats(krwAmount, btcPriceKrw)
  }

  // Convert satoshis to KRW
  satsToKrw(sats: number, btcPriceKrw: number): number {
    const btcAmount = sats / 100000000
    return Math.round(btcAmount * btcPriceKrw)
  }

  // Format satoshis with proper formatting (no K/M units, always full numbers)
  formatSats(sats: number): string {
    return `${Math.round(sats).toLocaleString()} sats`
  }

  // Get the cache status
  isCacheValid(): boolean {
    return this.cache !== null && Date.now() - this.cache.timestamp < this.cacheExpiration
  }

  // Clear the cache (useful for manual refresh)
  clearCache(): void {
    this.cache = null
  }

  // Get Lightning Network LNURL invoice with detailed error handling
  // Now uses backend proxy to avoid CORS issues
  async getLnurl(ln_account: string, sats: number, memo: string): Promise<{
    success: boolean;
    invoice?: string;
    error?: string;
    errorType?: 'WALLET_NOT_FOUND' | 'INVALID_AMOUNT' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'UNKNOWN';
  }> {
    try {
      console.log(`⚡ LNURL 인보이스 요청: ${ln_account}`);
      console.log(`💸 요청 금액: ${sats} 사츠`);
      console.log(`📝 메모: ${memo}`);

      // Use backend proxy to avoid CORS issues
      const response = await apiClient.post('/auth/lightning/invoice/', {
        ln_account,
        sats,
        memo
      });

      console.log(`📨 백엔드 응답:`, response.data);

      if (response.data.success && response.data.invoice) {
        console.log("✅ 라이트닝 인보이스 생성 성공!");
        console.log(`📄 인보이스 길이: ${response.data.invoice.length}자`);
        console.log(`🔖 인보이스 미리보기: ${response.data.invoice.substring(0, 50)}...`);

        return {
          success: true,
          invoice: response.data.invoice
        };
      }

      // Handle error response from backend
      return {
        success: false,
        error: response.data.error || "인보이스 생성에 실패했습니다",
        errorType: response.data.errorType || 'UNKNOWN'
      };

    } catch (error: any) {
      console.error('라이트닝 인보이스 생성 오류:', error);

      // Check if backend returned error details
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData.error || errorData.message || "인보이스 생성에 실패했습니다",
          errorType: errorData.errorType || 'NETWORK_ERROR'
        };
      }

      if (error.request) {
        // Request was made but no response
        return {
          success: false,
          error: "네트워크 오류: 서버에 연결할 수 없습니다",
          errorType: 'NETWORK_ERROR'
        };
      }

      // Other errors
      return {
        success: false,
        error: error.message || "알 수 없는 오류가 발생했습니다",
        errorType: 'UNKNOWN'
      };
    }
  }

}

export const bitcoinService = new BitcoinService()
