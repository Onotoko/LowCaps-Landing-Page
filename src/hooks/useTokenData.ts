import { useState, useEffect, useCallback, useRef } from 'react';
import { TokenData, LoadingState } from '@/lib/types/token';
import { tokenDataService } from '@/lib/services/TokenDataService';

interface UseTokenDataOptions {
    autoRefreshInterval?: number;
    enableRetry?: boolean;
    retryDelay?: number;
}

export function useTokenData(options: UseTokenDataOptions = {}) {
    const {
        autoRefreshInterval = 60000, // 1 minute default
        enableRetry = true,
        retryDelay = 5000 // 5 seconds
    } = options;

    const [tokenData, setTokenData] = useState<TokenData>({
        totalSupply: '1000000000.00',
        circulatingSupply: '1000000000.00',
        price: '$0.00000000',
        tokensPerSupra: '0.0000',
        marketCap: '$0.00'
    });

    const [isLoading, setIsLoading] = useState<LoadingState>({
        price: false,
        supply: false,
        marketCap: false
    });

    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    // Fix: Provide initial values for useRef
    const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const updateConnectionStatus = useCallback((status: typeof connectionStatus) => {
        setConnectionStatus(status);
        console.log(`Connection status changed to: ${status}`);
    }, []);

    const refreshData = useCallback(async (isInitialLoad = false) => {
        try {
            setIsLoading(prev => ({
                price: true,
                supply: isInitialLoad,
                marketCap: true
            }));
            setError(null);

            if (connectionStatus === 'disconnected') {
                updateConnectionStatus('connecting');
            }

            const data = await tokenDataService.fetchAllTokenData();
            setTokenData(data);
            setLastUpdated(Date.now());
            updateConnectionStatus('connected');

            console.log('Token data refreshed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token data';
            setError(errorMessage);
            updateConnectionStatus('error');

            console.error('Token data refresh failed:', err);

            // Retry logic
            if (enableRetry && retryDelay > 0) {
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                retryTimeoutRef.current = setTimeout(() => {
                    refreshData(isInitialLoad);
                }, retryDelay);
            }
        } finally {
            setIsLoading({ price: false, supply: false, marketCap: false });
        }
    }, [connectionStatus, enableRetry, retryDelay, updateConnectionStatus]);

    const refreshPriceOnly = useCallback(async () => {
        try {
            setIsLoading(prev => ({ ...prev, price: true, marketCap: true }));
            setError(null);

            const priceData = await tokenDataService.refreshPriceData();
            setTokenData(prev => ({ ...prev, ...priceData }));
            setLastUpdated(Date.now());

            if (connectionStatus !== 'connected') {
                updateConnectionStatus('connected');
            }

            console.log('Price data refreshed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh price data';
            setError(errorMessage);
            updateConnectionStatus('error');

            console.error('Price data refresh failed:', err);
        } finally {
            setIsLoading(prev => ({ ...prev, price: false, marketCap: false }));
        }
    }, [connectionStatus, updateConnectionStatus]);

    const forceRefresh = useCallback(async () => {
        try {
            setIsLoading({ price: true, supply: true, marketCap: true });
            setError(null);
            updateConnectionStatus('connecting');

            // Clear any retry timeouts
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = undefined;
            }

            const data = await tokenDataService.forceRefresh();
            setTokenData(data);
            setLastUpdated(Date.now());
            updateConnectionStatus('connected');

            console.log('Force refresh completed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to force refresh';
            setError(errorMessage);
            updateConnectionStatus('error');

            console.error('Force refresh failed:', err);
        } finally {
            setIsLoading({ price: false, supply: false, marketCap: false });
        }
    }, [updateConnectionStatus]);

    // Get service status for debugging
    const getServiceStatus = useCallback(() => {
        return {
            ...tokenDataService.getServiceStatus(),
            connectionStatus,
            lastUpdated,
            isLoading
        };
    }, [connectionStatus, lastUpdated, isLoading]);

    // Auto-refresh effect
    useEffect(() => {
        // Initial load
        refreshData(true);

        // Set up auto-refresh interval
        if (autoRefreshInterval > 0) {
            refreshIntervalRef.current = setInterval(() => {
                if (connectionStatus === 'connected') {
                    refreshPriceOnly();
                } else {
                    refreshData();
                }
            }, autoRefreshInterval);
        }

        // Cleanup function
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = undefined;
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = undefined;
            }
        };
    }, [refreshData, refreshPriceOnly, autoRefreshInterval, connectionStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = undefined;
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = undefined;
            }
        };
    }, []);

    return {
        tokenData,
        isLoading,
        error,
        connectionStatus,
        lastUpdated,
        refreshData: () => refreshData(),
        refreshPriceOnly,
        forceRefresh,
        getServiceStatus
    };
}
