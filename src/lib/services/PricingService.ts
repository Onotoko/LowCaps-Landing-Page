import { supraClientService } from './SupraClientService';
import { TOKENS } from '../constants/blockchain';
import { TokenMetrics } from '../types/token';

class PricingService {
    private priceCache = new Map<string, { price: number; timestamp: number }>();
    private cacheDuration = 30000; // 30 seconds cache

    private getCachedPrice(key: string): number | null {
        const cached = this.priceCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.price;
        }
        return null;
    }

    private setCachedPrice(key: string, price: number): void {
        this.priceCache.set(key, { price, timestamp: Date.now() });
    }

    async calculateTokenMetrics(): Promise<TokenMetrics> {
        try {
            console.log('📄 Starting token metrics calculation...');

            // Get metrics directly from supraClientService
            const metrics = await supraClientService.getLowcapsMetrics();

            // Cache the results
            this.setCachedPrice('lowcaps-usd', metrics.price);
            this.setCachedPrice('lowcaps-marketcap', metrics.marketCap);
            this.setCachedPrice('lowcaps-per-supra', metrics.lowcapsPerSupra);

            console.log('✅ Token metrics calculated:', {
                priceUSD: `$${metrics.price.toFixed(8)}`,
                marketCap: `$${metrics.marketCap.toFixed(2)}`,
                lowcapsPerSupra: metrics.lowcapsPerSupra.toFixed(4)
            });

            return metrics;
        } catch (error) {
            console.error("❌ Critical error calculating token metrics:", error);

            // Check cache for any values
            const cachedPrice = this.priceCache.get('lowcaps-usd');
            const cachedMarketCap = this.priceCache.get('lowcaps-marketcap');
            const cachedLowcapsPerSupra = this.priceCache.get('lowcaps-per-supra');

            if (cachedPrice && cachedMarketCap && cachedLowcapsPerSupra) {
                console.warn('Using cached values due to error');
                return {
                    price: cachedPrice.price,
                    marketCap: cachedMarketCap.price,
                    lowcapsPerSupra: cachedLowcapsPerSupra.price
                };
            }

            // Return safe fallback values
            return {
                price: 0.00007971,
                marketCap: 79710,
                lowcapsPerSupra: 52.9172
            };
        }
    }

    // Clear cache method for manual refresh
    clearCache(): void {
        this.priceCache.clear();
        console.log('Price cache cleared');
    }

    // Get cache status for debugging
    getCacheStatus(): { key: string; age: number; price: number }[] {
        const now = Date.now();
        return Array.from(this.priceCache.entries()).map(([key, { price, timestamp }]) => ({
            key,
            age: now - timestamp,
            price
        }));
    }

    // Direct pass-through methods for compatibility
    async getSupraPriceInUSD(): Promise<number> {
        const cacheKey = 'supra-usd';
        const cached = this.getCachedPrice(cacheKey);
        if (cached !== null) {
            return cached;
        }

        try {
            const price = await supraClientService.getSupraPriceInUSD();
            this.setCachedPrice(cacheKey, price);
            return price;
        } catch (error) {
            console.error('Error getting SUPRA price:', error);
            const cached = this.priceCache.get(cacheKey);
            if (cached) {
                console.warn('Using expired cached SUPRA price');
                return cached.price;
            }
            return 0.4217; // Fallback
        }
    }

    async getLowcapsPriceInSupra(): Promise<number> {
        const cacheKey = 'lowcaps-supra';
        const cached = this.getCachedPrice(cacheKey);
        if (cached !== null) {
            return cached;
        }

        try {
            const metrics = await supraClientService.getLowcapsMetrics();
            const price = metrics.lowcapsPerSupra > 0 ? 1 / metrics.lowcapsPerSupra : 0.0000336;
            this.setCachedPrice(cacheKey, price);
            return price;
        } catch (error) {
            console.error('Error getting LOWCAPS price in SUPRA:', error);
            const cached = this.priceCache.get(cacheKey);
            if (cached) {
                console.warn('Using expired cached LOWCAPS price');
                return cached.price;
            }
            return 0.0000336; // Fallback
        }
    }
}

export const pricingService = new PricingService();