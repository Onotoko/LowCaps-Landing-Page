'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Info, RefreshCw, Database, Coins, TrendingUp, Layers, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useTokenData } from '@/hooks/useTokenData';

interface Notification {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
}

export default function StatsPage() {
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    // Fix: Explicitly type the hoveredCard state
    const [, setHoveredCard] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Use the new hook for token data management with enhanced options
    const {
        tokenData,
        isLoading,
        error,
        connectionStatus,
        lastUpdated,
        refreshData,
        forceRefresh,
    } = useTokenData({
        autoRefreshInterval: 60000, // Auto-refresh every 60s
        enableRetry: true,
        retryDelay: 5000
    });

    // Ensure client-side rendering to avoid hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Show error notifications
    useEffect(() => {
        if (error) {
            showNotification(error, 'error');
        }
    }, [error]);

    // Show connection status changes
    useEffect(() => {
        if (connectionStatus === 'connected' && lastUpdated > 0) {
            const timeSinceUpdate = Date.now() - lastUpdated;
            if (timeSinceUpdate < 5000) { // Only show if recently updated
                showNotification("Data updated successfully!", 'success');
            }
        } else if (connectionStatus === 'error') {
            showNotification("Connection issues detected. Retrying...", 'warning');
        }
    }, [connectionStatus, lastUpdated]);

    const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
        setNotification({ message, type, visible: true });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRefresh = async (): Promise<void> => {
        try {
            showNotification("Refreshing data...", "info");
            await refreshData();
        } catch (error) {
            console.error("Error refreshing data:", error);
            // Error notification will be handled by useEffect
        }
    };

    const handleForceRefresh = async (): Promise<void> => {
        try {
            showNotification("Force refreshing all data...", "info");
            await forceRefresh();
            showNotification("All data refreshed successfully!", "success");
        } catch (error) {
            console.error("Error force refreshing data:", error);
            // Error notification will be handled by useEffect
        }
    };

    const formatLastUpdated = (timestamp: number): string => {
        if (!timestamp) return 'Never';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (minutes > 0) return `${minutes}m ${seconds}s ago`;
        return `${seconds}s ago`;
    };

    const getConnectionIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                return <Wifi size={16} color="#10B981" />;
            case 'connecting':
                return <RefreshCw size={16} color="#F59E0B" className="animate-spin" />;
            case 'error':
                return <WifiOff size={16} color="#EF4444" />;
            default:
                return <AlertTriangle size={16} color="#6B7280" />;
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'error':
                return 'Connection Error';
            case 'disconnected':
                return 'Disconnected';
            default:
                return 'Unknown';
        }
    };

    // Fix: Create properly typed handler functions
    const handleMouseEnter = (cardId: string) => {
        setHoveredCard(cardId);
    };

    const handleMouseLeave = () => {
        setHoveredCard(null);
    };

    if (!isClient) {
        return null; // Prevent SSR hydration issues
    }

    return (
        <Layout currentPage="stats">
            <div className="stats-container">
                <div className="background-effects">
                    <div className="bg-blur bg-blur-1"></div>
                    <div className="bg-blur bg-blur-2"></div>
                    <div className="bg-blur bg-blur-3"></div>
                </div>

                <div className="analytics-block">
                    <div className="block-header">
                        <div className="title-group">
                            <h2>Low Cap Gems (LOWCAPS)</h2>
                            <p>Token performance metrics and supply information</p>
                            {/* <div className="connection-status">
                                {getConnectionIcon()}
                                <span className={`status-text ${connectionStatus}`}>
                                    {getConnectionStatusText()}
                                </span>
                                {lastUpdated > 0 && (
                                    <span className="last-updated">
                                        • Updated {formatLastUpdated(lastUpdated)}
                                    </span>
                                )}
                            </div> */}
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
                                disabled={Object.values(isLoading).some(v => v) || connectionStatus === 'connecting'}
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

                            {connectionStatus === 'error' && (
                                <button
                                    onClick={handleForceRefresh}
                                    disabled={Object.values(isLoading).some(v => v)}
                                    className="force-refresh-btn"
                                >
                                    {Object.values(isLoading).some(v => v) ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            Reconnecting...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={16} />
                                            Force Refresh
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid with Enhanced Loading States */}
                    <div className="stats-grid">
                        {/* Total Supply */}
                        <div
                            className={`stats-card ${connectionStatus === 'error' ? 'connection-error' : ''}`}
                            onMouseEnter={() => handleMouseEnter('total-supply')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="card-gradient blue"></div>
                            <div className="card-header">
                                <div className="icon-wrapper blue">
                                    <Database size={20} color="#60A5FA" />
                                </div>
                                <h3 className="card-title">Total Supply</h3>
                            </div>
                            <div className="stats-number">
                                {tokenData.totalSupply} LOWCAPS
                            </div>
                            <p className="card-description">Total tokens issued</p>
                            <div className="card-bottom-line blue"></div>
                        </div>

                        {/* Circulating Supply */}
                        <div
                            className={`stats-card ${connectionStatus === 'error' ? 'connection-error' : ''}`}
                            onMouseEnter={() => handleMouseEnter('circulating-supply')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="card-gradient blue"></div>
                            <div className="card-header">
                                <div className="icon-wrapper blue">
                                    <Coins size={20} color="#60A5FA" />
                                </div>
                                <h3 className="card-title">Circulating Supply</h3>
                            </div>
                            <div className="stats-number">
                                {isLoading.supply ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    `${tokenData.circulatingSupply} LOWCAPS`
                                )}
                            </div>
                            <p className="card-description">Tokens available in circulation</p>
                            <div className="card-bottom-line blue"></div>
                        </div>

                        {/* LOWCAPS Price */}
                        <div
                            className={`stats-card ${connectionStatus === 'error' ? 'connection-error' : ''} ${isLoading.price ? 'loading' : ''}`}
                            onMouseEnter={() => handleMouseEnter('price')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="card-gradient purple"></div>
                            <div className="card-header">
                                <div className="icon-wrapper purple">
                                    <TrendingUp size={20} color="#A78BFA" />
                                </div>
                                <h3 className="card-title">
                                    Lowcaps Price
                                    {isLoading.price && (
                                        <div className="inline-spinner"></div>
                                    )}
                                </h3>
                            </div>
                            <div className="stats-number">
                                {isLoading.price ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    tokenData.price
                                )}
                            </div>
                            <p className="card-description">
                                Price in USD (dexUSDC) on Dexlyn
                                {connectionStatus === 'error' && (
                                    <span className="error-indicator"> • Stale Data</span>
                                )}
                            </p>
                            <div className="card-bottom-line purple"></div>
                        </div>

                        {/* LOWCAPS per SUPRA */}
                        <div
                            className={`stats-card ${connectionStatus === 'error' ? 'connection-error' : ''} ${isLoading.price ? 'loading' : ''}`}
                            onMouseEnter={() => handleMouseEnter('tokens-per-supra')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="card-gradient violet"></div>
                            <div className="card-header">
                                <div className="icon-wrapper violet">
                                    <Layers size={20} color="#8B5CF6" />
                                </div>
                                <h3 className="card-title">
                                    LOWCAPS per SUPRA
                                    {isLoading.price && (
                                        <div className="inline-spinner"></div>
                                    )}
                                </h3>
                            </div>
                            <div className="stats-number">
                                {isLoading.price ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    `${tokenData.tokensPerSupra} LOWCAPS`
                                )}
                            </div>
                            <p className="card-description">
                                LOWCAPS tokens per 1 SUPRA
                                {connectionStatus === 'error' && (
                                    <span className="error-indicator"> • Stale Data</span>
                                )}
                            </p>
                            <div className="card-bottom-line violet"></div>
                        </div>

                        {/* Market Cap */}
                        <div
                            className={`stats-card ${connectionStatus === 'error' ? 'connection-error' : ''} ${isLoading.marketCap ? 'loading' : ''}`}
                            onMouseEnter={() => handleMouseEnter('market-cap')}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="card-gradient teal"></div>
                            <div className="card-header">
                                <div className="icon-wrapper teal">
                                    <TrendingUp size={20} color="#60A5FA" />
                                </div>
                                <h3 className="card-title">
                                    Market Cap
                                    {isLoading.marketCap && (
                                        <div className="inline-spinner"></div>
                                    )}
                                </h3>
                            </div>
                            <div className="stats-number">
                                {isLoading.marketCap ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    tokenData.marketCap
                                )}
                            </div>
                            <p className="card-description">
                                Market cap in USD (dexUSDC)
                                {connectionStatus === 'error' && (
                                    <span className="error-indicator"> • Stale Data</span>
                                )}
                            </p>
                            <div className="card-bottom-line teal"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Notification System */}
            {notification && (
                <div className={`notification ${notification.type} ${notification.visible ? 'visible' : ''}`}>
                    <div className="notification-content">
                        {notification.type === 'warning' && <AlertTriangle size={16} />}
                        {notification.type === 'error' && <WifiOff size={16} />}
                        {notification.type === 'success' && <Wifi size={16} />}
                        {notification.type === 'info' && <Info size={16} />}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Connection Error Banner */}
            {connectionStatus === 'error' && (
                <div className="connection-error-banner">
                    <div className="banner-content">
                        <WifiOff size={20} />
                        <div className="banner-text">
                            <strong>Connection Issue Detected</strong>
                            <p>Data may be outdated. Attempting to reconnect...</p>
                        </div>
                        <button onClick={handleForceRefresh} className="banner-action">
                            Retry Now
                        </button>
                    </div>
                </div>
            )}

            {/* Info Modal */}
            {showInfoModal && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowInfoModal(false);
                    }
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <div className="modal-icon">
                                    <Info size={20} color="#60A5FA" />
                                </div>
                                <h2 className="modal-title">About LOWCAPS Dashboard</h2>
                            </div>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="close-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="info-section">
                                <h4>About This Dashboard</h4>
                                <p>Real-time analytics for Low Cap Gems (LOWCAPS) on Dexlyn.</p>
                                <p>Prices in USD (dexUSDC), updated every 60 seconds for accuracy.</p>
                                <p>Supply data reflects tokens issued and available on the platform.</p>
                                <p>Market cap calculated based on Dexlyn liquidity pools.</p>
                            </div>

                            {lastUpdated > 0 && (
                                <div className="info-section">
                                    <h4>Last Updated</h4>
                                    <p>{new Date(lastUpdated).toLocaleString()} ({formatLastUpdated(lastUpdated)})</p>
                                </div>
                            )}

                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="close-modal-btn"
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