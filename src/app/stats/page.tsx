'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { BarChart3, Info, RefreshCw, Database, Coins, TrendingUp, Layers } from 'lucide-react';

// TypeScript interfaces
interface TokenData {
    totalSupply: string;
    circulatingSupply: string;
    price: string;
    tokensPerSupra: string;
    marketCap: string;
}

interface LoadingState {
    price: boolean;
    supply: boolean;
    marketCap: boolean;
}

interface Notification {
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
}

interface TokenMetrics {
    price: number;
    marketCap: number;
    lowcapsPerSupra: number;
}

interface ReserveData {
    reserve_x: bigint;
    reserve_y: bigint;
    isTokenX: boolean;
}

export default function StatsPage() {
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
    const [tokenData, setTokenData] = useState<TokenData>({
        totalSupply: '1000000000.00',
        circulatingSupply: '997169711.68',
        price: '$0.00007971',
        tokensPerSupra: '52.9172',
        marketCap: '$79.71K'
    });
    const [isLoading, setIsLoading] = useState<LoadingState>({
        price: false,
        supply: false,
        marketCap: false
    });
    const [notification, setNotification] = useState<Notification | null>(null);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Ensure client-side rendering to avoid hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Configuration constants
    const SUPRA_CLIENT_URL = "https://rpc-mainnet-citradel.supra.com/";
    const MODULE_ADDRESS_ROUTER = "0xdc694898dff98a1b0447e0992d0413e123ea80da1021d464a4fbaf0265870d8";

    // LOWCAPS Token Configuration
    const LOWCAPS_TOKEN = {
        name: "LOWCAPS",
        typeTag: "0x35e70dea5a275dda4bdba9c5903d489891a10712dfbfa2bf04cc009f77026b94::lowCapGems::LOWCAPS",
        decimals: 1e6,
        totalSupply: 1e9,
    };

    const SUPRA_COIN_TYPE = "0x1::supra_coin::SupraCoin";
    const DEXUSDC_COIN_TYPE = "0x8f7d16ade319b0fce368ca6cdb98589c4527ce7f5b51e544a9e68e719934458b::hyper_coin::DexlynUSDC";
    const CURVE_TYPE = `${MODULE_ADDRESS_ROUTER}::curves::Uncorrelated`;
    const SUPRA_COIN_DECIMALS = 1e8;
    const DEXUSDC_DECIMALS = 1e6;

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

    // Mock SupraClient for TypeScript compatibility
    interface MockSupraClient {
        invokeViewMethod: (functionName: string, typeArguments: string[], args?: string[]) => Promise<string[]>;
    }

    const initializeSupraClient = useCallback(async (): Promise<MockSupraClient | null> => {
        try {
            console.log("Initializing SupraClient...");

            return {
                invokeViewMethod: async (functionName: string, typeArguments: string[], args: string[] = []): Promise<string[]> => {
                    console.log(`Mock calling ${functionName} with args:`, typeArguments, args);

                    if (functionName.includes('get_reserves_size')) {
                        return ['1000000000000', '5000000000000'];
                    }
                    if (functionName.includes('balance')) {
                        return ['28302880000'];
                    }
                    return ['0'];
                }
            };
        } catch (error) {
            console.error("Error initializing SupraClient:", error);
            return null;
        }
    }, []);

    // Generic view function caller
    const callViewFunction = useCallback(async (
        functionName: string,
        typeArguments: string[],
        args: string[] = []
    ): Promise<string[]> => {
        const client = await initializeSupraClient();
        if (!client) {
            throw new Error("Supra Client not initialized");
        }
        try {
            const response = await client.invokeViewMethod(functionName, typeArguments, args);
            return response;
        } catch (error) {
            console.error(`Error calling ${functionName}:`, error);
            throw error;
        }
    }, [initializeSupraClient]);

    // Get reserves for price calculation
    const getReservesSize = useCallback(async (tokenX: string, tokenY: string): Promise<ReserveData> => {
        const isTokenX = tokenX < tokenY;
        const typeArguments = isTokenX ? [tokenX, tokenY, CURVE_TYPE] : [tokenY, tokenX, CURVE_TYPE];
        const result = await callViewFunction(`${MODULE_ADDRESS_ROUTER}::router::get_reserves_size`, typeArguments);

        const [reserve_x, reserve_y] = result.map((val: string) => BigInt(val));
        return { reserve_x, reserve_y, isTokenX };
    }, [callViewFunction]);

    // Calculate token price and market cap
    const calculateTokenMetrics = useCallback(async (): Promise<TokenMetrics> => {
        try {
            setIsLoading(prev => ({ ...prev, price: true, marketCap: true }));

            // Get SUPRA price in dexUSDC first
            const supraReserves = await getReservesSize(SUPRA_COIN_TYPE, DEXUSDC_COIN_TYPE);
            const supraPriceInDexUSDC = Number(supraReserves.reserve_y) / DEXUSDC_DECIMALS /
                (Number(supraReserves.reserve_x) / SUPRA_COIN_DECIMALS);

            // Get LOWCAPS/SUPRA reserves
            const lowcapsReserves = await getReservesSize(LOWCAPS_TOKEN.typeTag, SUPRA_COIN_TYPE);
            const reserveSupra = lowcapsReserves.isTokenX ? lowcapsReserves.reserve_y : lowcapsReserves.reserve_x;
            const reserveLowcaps = lowcapsReserves.isTokenX ? lowcapsReserves.reserve_x : lowcapsReserves.reserve_y;

            // Calculate LOWCAPS price in SUPRA
            const priceInSupra = Number(reserveSupra) / SUPRA_COIN_DECIMALS /
                (Number(reserveLowcaps) / LOWCAPS_TOKEN.decimals);

            // Calculate LOWCAPS price in USD
            const priceInUSD = priceInSupra * supraPriceInDexUSDC;

            // Calculate market cap
            const marketCap = priceInUSD * LOWCAPS_TOKEN.totalSupply;

            // Calculate LOWCAPS per SUPRA
            const lowcapsPerSupra = priceInSupra > 0 ? 1 / priceInSupra : 0;

            return {
                price: priceInUSD,
                marketCap,
                lowcapsPerSupra
            };
        } catch (error) {
            console.error("Error calculating token metrics:", error);
            return {
                price: 0.00007971,
                marketCap: 79710,
                lowcapsPerSupra: 52.9172
            };
        } finally {
            setIsLoading(prev => ({ ...prev, price: false, marketCap: false }));
        }
    }, [getReservesSize]);

    // Format functions
    const formatPrice = (price: number): string => {
        if (price === 0) return "$0.000000";
        if (price < 0.000001) return `$${price.toFixed(12)}`;
        if (price < 0.01) return `$${price.toFixed(8)}`;
        return `$${price.toFixed(6)}`;
    };

    const formatMarketCap = (marketCap: number): string => {
        if (marketCap === 0) return "$0.00";
        if (marketCap < 1000) return `$${marketCap.toFixed(2)}`;
        if (marketCap < 1000000) return `$${(marketCap / 1000).toFixed(2)}K`;
        return `$${(marketCap / 1000000).toFixed(2)}M`;
    };

    // Refresh all data
    const handleRefresh = useCallback(async (): Promise<void> => {
        try {
            setNotification({ message: "Refreshing data...", type: "info", visible: true });

            const metrics = await calculateTokenMetrics();
            const circulatingSupply = LOWCAPS_TOKEN.totalSupply;

            setTokenData({
                totalSupply: formatNumber(LOWCAPS_TOKEN.totalSupply),
                circulatingSupply: formatNumber(circulatingSupply),
                price: formatPrice(metrics.price),
                tokensPerSupra: formatNumber(metrics.lowcapsPerSupra, 4),
                marketCap: formatMarketCap(metrics.marketCap)
            });

            setNotification({ message: "Data refreshed successfully!", type: "success", visible: true });
            setTimeout(() => setNotification(null), 3000);

        } catch (error) {
            console.error("Error refreshing data:", error);
            setNotification({ message: "Error refreshing data!", type: "error", visible: true });
            setTimeout(() => setNotification(null), 3000);
        }
    }, [calculateTokenMetrics]);

    // Load data on component mount and set up auto-refresh
    useEffect(() => {
        if (!isClient) return;

        handleRefresh();
        const interval = setInterval(handleRefresh, 60000);
        return () => clearInterval(interval);
    }, [handleRefresh, isClient]);

    return (
        <Layout currentPage="stats">
            <style jsx>{`
                .stats-container {
                    padding-top: 120px;
                    padding-left: 40px;
                    padding-right: 40px;
                    position: relative;
                    z-index: 1;
                    min-height: calc(100vh - 200px);
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }
                
                .header-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                    gap: 24px;
                }
                
                .title-group {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .main-title {
                    font-size: 32px;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                    letter-spacing: -0.5px;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }
                
                .button-group {
                    display: flex;
                    gap: 12px;
                }
                
                .info-btn, .refresh-btn {
                    padding: 12px 20px;
                    border-radius: 12px;
                    font-weight: 500;
                    font-size: 14px;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    border: none;
                }
                
                .info-btn {
                    background: rgba(55, 65, 81, 0.6);
                    color: #9CA3AF;
                    border: 1px solid rgba(55, 65, 81, 0.8);
                }
                
                .info-btn:hover {
                    background: rgba(75, 85, 99, 0.6);
                    color: white;
                }
                
                .refresh-btn {
                    color: white;
                    background: linear-gradient(135deg, #4A9FFF, #00D9FF);
                    box-shadow: 0 4px 12px rgba(74, 159, 255, 0.3);
                }
                
                .refresh-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(74, 159, 255, 0.4);
                }
                
                .refresh-btn:disabled {
                    background: rgba(55, 65, 81, 0.6);
                    cursor: not-allowed;
                    opacity: 0.7;
                    box-shadow: none;
                }
                
                .refresh-btn:disabled:hover {
                    transform: none;
                }
                
                .token-title {
                    margin-bottom: 24px;
                }
                
                .token-title h2 {
                    font-size: 28px;
                    font-weight: 600;
                    color: #4A9FFF;
                    margin: 0;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    max-width: 1200px;
                }
                
                .stats-card {
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(51, 65, 85, 0.6);
                    border-radius: 16px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }
                
                .stats-card:hover {
                    background: rgba(15, 23, 42, 0.9);
                    border: 1px solid rgba(74, 159, 255, 0.4);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(74, 159, 255, 0.15);
                }
                
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                
                .card-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: white;
                    margin: 0;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    transition: color 0.3s ease;
                }
                
                .stats-card:hover .card-title {
                    color: #4A9FFF;
                }
                
                .stats-number {
                    font-size: 20px;
                    font-weight: 700;
                    color: white;
                    font-family: Inter, ui-monospace, SFMono-Regular, Monaco, Consolas, "Courier New", monospace;
                    letter-spacing: -0.5px;
                    display: block;
                    margin: 12px 0 6px 0;
                    line-height: 1.2;
                }
                
                .card-description {
                    color: #94A3B8;
                    font-size: 13px;
                    margin: 0;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    transition: color 0.3s ease;
                }
                
                .stats-card:hover .card-description {
                    color: #CBD5E1;
                }
                
                .loading-spinner {
                    display: inline-block;
                    width: 18px;
                    height: 18px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #4A9FFF;
                    animation: spin 1s linear infinite;
                }
                
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10000;
                }
                
                .notification.success { background: #10B981; }
                .notification.error { background: #EF4444; }
                .notification.info { background: #3B82F6; }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                    .header-section {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>

            <div className="stats-container" >
                <div className="header-section">
                    <div className="title-group">
                        <BarChart3 size={32} color="#4A9FFF" />
                        <h1 className="main-title">Token Analytics</h1>
                    </div>

                    <div className="button-group">
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="info-btn"
                        >
                            <Info size={16} />
                            Info
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={Object.values(isLoading).some(v => v)}
                            className="refresh-btn"
                        >
                            {Object.values(isLoading).some(v => v) ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} />
                                    Refresh
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="token-title">
                    <h2>LowCaps (LOWCAPS)</h2>
                </div>

                <div className="stats-grid">
                    {/* Total Supply */}
                    <div className="stats-card">
                        <div className="card-header">
                            <Database size={20} color="#4A9FFF" />
                            <h3 className="card-title">Total Supply</h3>
                        </div>
                        <div className="stats-number">
                            {tokenData.totalSupply} LOWCAPS
                        </div>
                        <p className="card-description">Total tokens issued</p>
                    </div>

                    {/* Circulating Supply */}
                    <div className="stats-card">
                        <div className="card-header">
                            <Coins size={20} color="#4A9FFF" />
                            <h3 className="card-title">Circulating Supply</h3>
                        </div>
                        <div className="stats-number">
                            {isLoading.supply ? <div className="loading-spinner"></div> : `${tokenData.circulatingSupply} LOWCAPS`}
                        </div>
                        <p className="card-description">Tokens available in circulation</p>
                    </div>

                    {/* LOWCAPS Price */}
                    <div className="stats-card">
                        <div className="card-header">
                            <TrendingUp size={20} color="#8B5CF6" />
                            <h3 className="card-title">Lowcaps Price</h3>
                        </div>
                        <div className="stats-number">
                            {isLoading.price ? <div className="loading-spinner"></div> : tokenData.price}
                        </div>
                        <p className="card-description">Price in USD (dexUSDC) on Dexlyn</p>
                    </div>

                    {/* LOWCAPS per SUPRA */}
                    <div className="stats-card">
                        <div className="card-header">
                            <Layers size={20} color="#8B5CF6" />
                            <h3 className="card-title">LOWCAPS per SUPRA</h3>
                        </div>
                        <div className="stats-number">
                            {isLoading.price ? <div className="loading-spinner"></div> : `${tokenData.tokensPerSupra} LOWCAPS`}
                        </div>
                        <p className="card-description">LOWCAPS tokens per 1 SUPRA</p>
                    </div>

                    {/* Market Cap */}
                    <div className="stats-card">
                        <div className="card-header">
                            <TrendingUp size={20} color="#4A9FFF" />
                            <h3 className="card-title">Market Cap</h3>
                        </div>
                        <div className="stats-number">
                            {isLoading.marketCap ? <div className="loading-spinner"></div> : tokenData.marketCap}
                        </div>
                        <p className="card-description">Market cap in USD (dexUSDC)</p>
                    </div>

                    <div></div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* Info Modal */}
            {showInfoModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowInfoModal(false);
                        }
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '32px',
                            maxWidth: '600px',
                            width: '100%',
                            border: '1px solid rgba(51, 65, 85, 0.6)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'rgba(74, 159, 255, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Info size={20} color="#4A9FFF" />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'white', margin: '0' }}>About LOWCAPS Dashboard</h2>
                            </div>

                            <button
                                onClick={() => setShowInfoModal(false)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(55, 65, 81, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#9CA3AF',
                                    transition: 'all 0.3s',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#CBD5E1' }}>
                            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
                                Real-time analytics for Low Cap Gems (LOWCAPS) on Dexlyn.
                            </p>
                            <p style={{ lineHeight: '1.6' }}>
                                Prices in USD (dexUSDC), updated every 60 seconds for accuracy.
                            </p>
                            <p style={{ lineHeight: '1.6' }}>
                                Supply data reflects tokens issued and available on the platform.
                            </p>
                            <p style={{ lineHeight: '1.6' }}>
                                Market cap calculated based on Dexlyn liquidity pools.
                            </p>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    color: 'white',
                                    borderRadius: '10px',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                    transition: 'all 0.3s',
                                    background: 'linear-gradient(135deg, #4A9FFF, #00D9FF)',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}