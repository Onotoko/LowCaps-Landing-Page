// lib/config/index.ts
import { SUPRA_CONFIG, TOKENS } from '../constants/blockchain';

interface AppConfig {
    supra: {
        rpcUrl: string;
        routerAddress: string;
    };
    tokens: typeof TOKENS;
    features: {
        autoRefresh: boolean;
        refreshInterval: number;
        enableNotifications: boolean;
    };
}

export const appConfig: AppConfig = {
    supra: {
        rpcUrl: SUPRA_CONFIG.CLIENT_URL,
        routerAddress: SUPRA_CONFIG.MODULE_ADDRESS_ROUTER,
    },
    tokens: TOKENS,
    features: {
        autoRefresh: true,
        refreshInterval: 60000, // 1 minute
        enableNotifications: true,
    }
};

// Export individual parts for convenience
export const { supra, tokens, features } = appConfig;

// Export types for use in other files
export type { AppConfig };