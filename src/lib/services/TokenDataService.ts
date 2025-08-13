import { supraClientService } from './SupraClientService';
import { LOWCAPS_TOKEN } from '../constants/blockchain';
import { TokenData } from '../types/token';

// Format number utility
const formatNumber = (num: number, decimals: number = 2): string => {
    if (isNaN(num)) return "0.00";
    const str = num.toString();
    const parts = str.split(".");
    if (parts.length === 1) return `${parts[0]}.${Array(decimals).fill("0").join("")}`;
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";
    if (decimalPart.length <= decimals) {
        return `${integerPart}.${decimalPart.padEnd(decimals, "0")}`;
    }
    return `${integerPart}.${decimalPart.substring(0, decimals)}`;
};

class TokenDataService {
    private lastSuccessfulFetch: number = 0;
    private consecutiveErrors: number = 0;
    private maxConsecutiveErrors: number = 5;
    private cachedData: TokenData | null = null;

    // Format functions
    private formatPrice(price: number): string {
        if (price === 0) return "$0.000000";
        if (price < 0.000001) return `$${price.toFixed(12)}`;
        if (price < 0.01) return `$${price.toFixed(8)}`;
        return `$${price.toFixed(6)}`;
    }

    private formatMarketCap(marketCap: number): string {
        if (marketCap === 0) return "$0.00";
        if (marketCap < 1000) return `$${marketCap.toFixed(2)}`;
        if (marketCap < 1000000) return `$${(marketCap / 1000).toFixed(2)}K`;
        return `$${(marketCap / 1000000).toFixed(2)}M`;
    }

    private formatLowcapsPerSupra(lowcapsPerSupra: number): string {
        if (lowcapsPerSupra === 0) return "0.0000";
        return formatNumber(lowcapsPerSupra, 4);
    }

    async fetchAllTokenData(): Promise<TokenData> {
        try {
            console.log('📊 Fetching all LOWCAPS token data...');

            // Health check first
            const isHealthy = await supraClientService.healthCheck();
            if (!isHealthy) {
                console.warn('⚠️ SupraClient health check failed, attempting anyway...');
            }

            // Get token metrics directly from supraClientService
            const metrics = await supraClientService.getLowcapsMetrics();

            const tokenData: TokenData = {
                totalSupply: formatNumber(LOWCAPS_TOKEN.totalSupply, 2),
                circulatingSupply: formatNumber(LOWCAPS_TOKEN.totalSupply, 2), // For now, same as total
                price: this.formatPrice(metrics.price),
                tokensPerSupra: this.formatLowcapsPerSupra(metrics.lowcapsPerSupra),
                marketCap: this.formatMarketCap(metrics.marketCap)
            };

            // Cache the successful data
            this.cachedData = tokenData;
            this.consecutiveErrors = 0;
            this.lastSuccessfulFetch = Date.now();

            console.log('✅ Successfully fetched LOWCAPS token data:', tokenData);
            return tokenData;

        } catch (error) {
            this.consecutiveErrors++;
            console.error(`❌ Error fetching token data (attempt ${this.consecutiveErrors}):`, error);

            // Return cached data if available
            if (this.cachedData) {
                console.warn('⚠️ Returning cached data due to error');
                return this.cachedData;
            }

            // Return fallback data
            const fallbackData: TokenData = {
                totalSupply: formatNumber(LOWCAPS_TOKEN.totalSupply, 2),
                circulatingSupply: formatNumber(LOWCAPS_TOKEN.totalSupply, 2),
                price: "$0.00007971",
                tokensPerSupra: "52.9172",
                marketCap: "$79.71K"
            };

            console.warn('⚠️ Using fallback data');
            return fallbackData;
        }
    }

    async refreshPriceData(): Promise<Partial<TokenData>> {
        try {
            console.log('🔄 Refreshing LOWCAPS price data...');

            const metrics = await supraClientService.getLowcapsMetrics();

            const priceData = {
                price: this.formatPrice(metrics.price),
                tokensPerSupra: this.formatLowcapsPerSupra(metrics.lowcapsPerSupra),
                marketCap: this.formatMarketCap(metrics.marketCap)
            };

            // Update cached data if exists
            if (this.cachedData) {
                this.cachedData = { ...this.cachedData, ...priceData };
            }

            this.consecutiveErrors = 0;
            console.log('✅ Successfully refreshed price data:', priceData);
            return priceData;

        } catch (error) {
            this.consecutiveErrors++;
            console.error(`❌ Error refreshing price data (attempt ${this.consecutiveErrors}):`, error);

            // Return cached price data if available
            if (this.cachedData) {
                return {
                    price: this.cachedData.price,
                    tokensPerSupra: this.cachedData.tokensPerSupra,
                    marketCap: this.cachedData.marketCap
                };
            }

            throw error;
        }
    }

    // Get service status for debugging
    getServiceStatus() {
        const now = Date.now();
        return {
            lastSuccessfulFetch: this.lastSuccessfulFetch,
            timeSinceLastSuccess: now - this.lastSuccessfulFetch,
            consecutiveErrors: this.consecutiveErrors,
            hasCachedData: this.cachedData !== null,
            isHealthy: this.consecutiveErrors < this.maxConsecutiveErrors,
            timestamp: now
        };
    }

    // Force refresh with cleanup
    async forceRefresh(): Promise<TokenData> {
        console.log('🔄 Force refreshing all LOWCAPS data...');
        this.consecutiveErrors = 0;

        // Clean up and reinitialize
        await supraClientService.cleanup();

        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));

        return this.fetchAllTokenData();
    }

    // Get cached data without fetching
    getCachedData(): TokenData | null {
        return this.cachedData;
    }
}

export const tokenDataService = new TokenDataService();