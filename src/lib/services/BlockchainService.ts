import { supraClientService } from './SupraClientService';
import { MODULE_ADDRESS_ROUTER, CURVE_TYPE } from '../constants/blockchain';
import { ReserveData } from '../types/token';

class BlockchainService {
    private retryDelay = 1000;
    private maxRetries = 3;

    private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`${context} - Attempt ${attempt}/${this.maxRetries} failed:`, lastError.message);

                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }

        throw new Error(`${context} failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
    }

    async getReservesSize(tokenX: string, tokenY: string): Promise<ReserveData> {
        return this.withRetry(async () => {
            console.log(`🔍 Getting reserves for tokens...`);

            // Use the supraClientService directly
            const result = await supraClientService.getReservesSize(tokenX, tokenY);

            console.log(`✅ Got reserves: X=${result.reserve_x}, Y=${result.reserve_y}, isTokenX=${result.isTokenX}`);

            return result;
        }, `Get reserves`);
    }

    async getTokenBalance(accountAddress: string, tokenType: string): Promise<bigint> {
        return this.withRetry(async () => {
            console.log(`🔍 Getting token balance for ${accountAddress.slice(0, 10)}...`);

            const balance = await supraClientService.getTokenBalance(accountAddress, tokenType);

            console.log(`✅ Got balance: ${balance}`);
            return balance;
        }, `Get balance for ${accountAddress.slice(0, 10)}...`);
    }

    async healthCheck(): Promise<boolean> {
        try {
            console.log('🔍 Performing blockchain health check...');

            // Use the healthCheck method from SupraClientService
            const isHealthy = await supraClientService.healthCheck();

            if (isHealthy) {
                console.log(`✅ Health check passed`);
                return true;
            } else {
                console.log('❌ Health check failed');
                return false;
            }
        } catch (error) {
            console.error('❌ Health check error:', error);
            return false;
        }
    }

    // Get fees config (delegate to supraClientService)
    async getFeesConfig(tokenX: string, tokenY: string): Promise<{ fee_pct: number; fee_scale: number }> {
        try {
            return await supraClientService.getFeesConfig(tokenX, tokenY);
        } catch (error) {
            console.error('Error getting fees config, using defaults:', error);
            // Return default Dexlyn fees
            return { fee_pct: 25, fee_scale: 10000 }; // 0.25%
        }
    }
}

export const blockchainService = new BlockchainService();