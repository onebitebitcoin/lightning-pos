import axios from "axios";

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
  async getLnurl(ln_account: string, sats: number, memo: string): Promise<{
    success: boolean;
    invoice?: string;
    error?: string;
    errorType?: 'WALLET_NOT_FOUND' | 'INVALID_AMOUNT' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'UNKNOWN';
  }> {
    try {
      const ln_name = ln_account.split("@")[0];
      const ln_domain = ln_account.split("@")[1];
      const api = `https://${ln_domain}/.well-known/lnurlp/${ln_name}`;
      
      console.log(`⚡ LNURL 정보 가져오는 중: ${ln_account}`);
      console.log(`🌐 API 엔드포인트: ${api}`);
      
      const { data } = await axios.get(api);
      console.log(`📡 LNURL 응답:`, data);

      // Check for error response (wallet not found, etc.)
      if (data.status === "ERROR") {
        const errorMessage = data.reason || "알 수 없는 LNURL 오류";
        console.error(`❌ LNURL 오류: ${errorMessage}`);
        
        if (errorMessage.includes("Unable to find valid user wallet")) {
          return {
            success: false,
            error: `해당 라이트닝 주소의 지갑을 찾을 수 없습니다: ${ln_account}`,
            errorType: 'WALLET_NOT_FOUND'
          };
        }
        
        return {
          success: false,
          error: errorMessage,
          errorType: 'INVALID_RESPONSE'
        };
      }

      if (data.tag !== "payRequest") {
        return {
          success: false,
          error: '유효하지 않은 LNURL 응답입니다. "payRequest" 태그가 필요합니다.',
          errorType: 'INVALID_RESPONSE'
        };
      }

      console.log(`💰 최소 전송 가능: ${data.minSendable / 1000} 사츠`);
      console.log(`💰 최대 전송 가능: ${data.maxSendable / 1000} 사츠`);

      // Step 2: Request an invoice for the specified satoshis
      const milli_sats = sats * 1000; // Convert sats to millisatoshis
      console.log(`💸 요청 금액: ${sats} 사츠 (${milli_sats} 밀리사츠)`);
      
      if (milli_sats < data.minSendable || milli_sats > data.maxSendable) {
        console.error(`❌ 금액 ${sats} 사츠가 허용 범위를 벗어났습니다 (${data.minSendable / 1000} - ${data.maxSendable / 1000} 사츠)`);
        return {
          success: false,
          error: `금액 ${sats} 사츠가 허용 범위를 벗어났습니다 (${data.minSendable / 1000} - ${data.maxSendable / 1000} 사츠).`,
          errorType: 'INVALID_AMOUNT'
        };
      }
      
      console.log(`🔗 콜백 호출: ${data.callback}`);
      console.log(`📝 파라미터: amount=${milli_sats}, comment="${memo}"`);
      
      const response = await axios.get(data.callback, {
        params: {
          amount: milli_sats,
          comment: memo,
        },
      });
      
      console.log(`📨 인보이스 응답:`, response.data);
      
      // Check for error in invoice response
      if (response.data.status === "ERROR") {
        console.error(`❌ 인보이스 생성 실패:`, response.data.reason);
        return {
          success: false,
          error: response.data.reason || "인보이스 생성에 실패했습니다",
          errorType: 'INVALID_RESPONSE'
        };
      }
      
      const { pr: invoice } = response.data;
      if (!invoice) {
        console.error(`❌ 라이트닝 서비스에서 인보이스가 반환되지 않았습니다`);
        return {
          success: false,
          error: "라이트닝 서비스에서 인보이스가 반환되지 않았습니다",
          errorType: 'INVALID_RESPONSE'
        };
      }
      
      console.log("✅ 라이트닝 인보이스 생성 성공!");
      console.log(`📄 인보이스 길이: ${invoice.length}자`);
      console.log(`🔖 인보이스 미리보기: ${invoice.substring(0, 50)}...`);
      
      return {
        success: true,
        invoice: invoice
      };
    } catch (error: any) {
      console.error('라이트닝 인보이스 생성 오류:', error);
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 404) {
          return {
            success: false,
            error: `라이트닝 주소를 찾을 수 없습니다: ${ln_account}`,
            errorType: 'WALLET_NOT_FOUND'
          };
        }
        
        return {
          success: false,
          error: errorData?.message || errorData?.reason || `HTTP ${status} 오류`,
          errorType: 'NETWORK_ERROR'
        };
      } else if (error.request) {
        // Request was made but no response
        return {
          success: false,
          error: "네트워크 오류: 라이트닝 서비스에 연결할 수 없습니다",
          errorType: 'NETWORK_ERROR'
        };
      } else {
        // Other errors
        return {
          success: false,
          error: error.message || "알 수 없는 오류가 발생했습니다",
          errorType: 'UNKNOWN'
        };
      }
    }
  }
}

export const bitcoinService = new BitcoinService()
