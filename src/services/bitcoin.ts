import axios from "axios";
import { apiClient } from "./api";

export type FiatCurrency = 'KRW' | 'USD' | 'JPY'

export interface BitcoinPriceData {
  krw: number
  usd: number
  jpy: number
  timestamp: number
}

export interface BitcoinPriceResponse {
  bitcoin: {
    krw: number
    usd: number
    jpy: number
  }
}

class BitcoinService {
  private cache: BitcoinPriceData | null = null
  private cacheExpiration = 5 * 60 * 1000 // 5 minutes
  private apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=krw,usd,jpy'

  async getCurrentPrice(): Promise<BitcoinPriceData> {
    // Return cached data if still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheExpiration) {
      return this.cache
    }

    try {
      const response = await fetch(this.apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: BitcoinPriceResponse = await response.json()
      
      this.cache = {
        krw: data.bitcoin.krw,
        usd: data.bitcoin.usd,
        jpy: data.bitcoin.jpy,
        timestamp: Date.now()
      }
      
      return this.cache
    } catch (error) {
      console.error('비트코인 가격 조회 실패:', error)
      
      // Return fallback price if API fails (approximately 100M KRW per BTC as of 2024)
      const fallbackPrice: BitcoinPriceData = {
        krw: 100000000,
        usd: 75000,
        jpy: 11000000,
        timestamp: Date.now()
      }
      
      this.cache = fallbackPrice
      return fallbackPrice
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
