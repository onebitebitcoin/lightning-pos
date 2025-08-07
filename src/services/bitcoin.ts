export interface BitcoinPriceData {
  krw: number
  usd: number
  timestamp: number
}

export interface BitcoinPriceResponse {
  bitcoin: {
    krw: number
    usd: number
  }
}

class BitcoinService {
  private cache: BitcoinPriceData | null = null
  private cacheExpiration = 5 * 60 * 1000 // 5 minutes
  private apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=krw,usd'

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
        timestamp: Date.now()
      }
      
      return this.cache
    } catch (error) {
      console.error('Failed to fetch Bitcoin price:', error)
      
      // Return fallback price if API fails (approximately 100M KRW per BTC as of 2024)
      const fallbackPrice: BitcoinPriceData = {
        krw: 100000000,
        usd: 75000,
        timestamp: Date.now()
      }
      
      this.cache = fallbackPrice
      return fallbackPrice
    }
  }

  // Convert KRW amount to satoshis
  krwToSats(krwAmount: number, btcPriceKrw: number): number {
    const btcAmount = krwAmount / btcPriceKrw
    return Math.round(btcAmount * 100000000) // 1 BTC = 100,000,000 sats
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
}

export const bitcoinService = new BitcoinService()