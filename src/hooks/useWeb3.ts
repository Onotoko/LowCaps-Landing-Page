import { useState, useEffect, useCallback } from 'react';
import { Web3State, Web3Actions } from '@/lib/types/web3';

export interface UseWeb3Return extends Web3State, Web3Actions {
    modalVisible: boolean;
    justConnected: boolean;
}

// Constants for localStorage keys
const WALLET_CONNECTION_KEY = 'wallet_connected';
const WALLET_ADDRESS_KEY = 'wallet_address';

export function useWeb3(): UseWeb3Return {
    const [state, setState] = useState<Web3State>({
        isConnected: false,
        address: null,
        isLoading: false,
        error: null,
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [wallet, setWallet] = useState<any>(null);
    const [justConnected, setJustConnected] = useState(false);

    const showModal = useCallback(() => setModalVisible(true), []);
    const hideModal = useCallback(() => setModalVisible(false), []);

    // Sync state across tabs/windows
    const syncStateToStorage = useCallback((isConnected: boolean, address: string | null) => {
        if (typeof window !== 'undefined') {
            if (isConnected && address) {
                localStorage.setItem(WALLET_CONNECTION_KEY, 'true');
                localStorage.setItem(WALLET_ADDRESS_KEY, address);
            } else {
                localStorage.removeItem(WALLET_CONNECTION_KEY);
                localStorage.removeItem(WALLET_ADDRESS_KEY);
            }

            // Dispatch custom event to sync across tabs
            window.dispatchEvent(new CustomEvent('walletStateChanged', {
                detail: { isConnected, address }
            }));
        }
    }, []);

    // Get StarKey provider using the correct API
    const getProvider = useCallback(() => {
        if (typeof window !== 'undefined' && 'starkey' in window) {
            const provider = (window as any).starkey?.supra;
            if (provider) {
                return provider;
            }
        }
        return null;
    }, []);

    const handleAccountsChanged = useCallback((accounts: string[]) => {
        if (accounts.length === 0) {
            setState(prev => ({
                ...prev,
                isConnected: false,
                address: null,
            }));
            syncStateToStorage(false, null);
        } else if (accounts[0] !== state.address) {
            setState(prev => ({
                ...prev,
                address: accounts[0],
                isConnected: true,
            }));
            syncStateToStorage(true, accounts[0]);
        }
    }, [state.address, syncStateToStorage]);

    const handleChainChanged = useCallback(() => {
        console.log('Chain changed - please ensure you are on SUPRA network');
    }, []);

    const connect = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const provider = getProvider();

            if (!provider) {
                // Open StarKey wallet download page if not found
                window.open('https://starkey.app/', '_blank');
                throw new Error('StarKey wallet not found. Please install StarKey wallet extension.');
            }

            // Use the correct StarKey API - connect() method
            const accounts = await provider.connect();

            if (accounts && accounts.length > 0) {
                const newState = {
                    isConnected: true,
                    address: accounts[0],
                    isLoading: false,
                    error: null,
                };

                setState(newState);
                setWallet(provider);
                setJustConnected(true); // Mark as actively connected

                // Sync to storage and other tabs
                syncStateToStorage(true, accounts[0]);

                // Add event listeners if available
                if (provider.on && typeof provider.on === 'function') {
                    provider.on('accountsChanged', handleAccountsChanged);
                    provider.on('chainChanged', handleChainChanged);
                }

                // Auto-close modal on successful connection
                setModalVisible(false);
            } else {
                throw new Error('No accounts returned from StarKey wallet');
            }
        } catch (error: any) {
            console.error('Wallet connection error:', error);

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to connect wallet',
            }));
        }
    }, [getProvider, handleAccountsChanged, handleChainChanged, syncStateToStorage]);

    const disconnect = useCallback(() => {
        // Remove event listeners if they exist
        if (wallet) {
            if (wallet.removeListener && typeof wallet.removeListener === 'function') {
                try {
                    wallet.removeListener('accountsChanged', handleAccountsChanged);
                    wallet.removeListener('chainChanged', handleChainChanged);
                } catch (error) {
                    console.error('Error removing event listeners:', error);
                }
            }

            if (wallet.disconnect && typeof wallet.disconnect === 'function') {
                try {
                    wallet.disconnect();
                } catch (error) {
                    console.error('Error disconnecting wallet:', error);
                }
            }

            setWallet(null);
        }

        setState({
            isConnected: false,
            address: null,
            isLoading: false,
            error: null,
        });

        // Reset the just connected flag
        setJustConnected(false);

        // Sync disconnection to storage and other tabs
        syncStateToStorage(false, null);
    }, [wallet, handleAccountsChanged, handleChainChanged, syncStateToStorage]);

    // Listen for wallet state changes from other tabs
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === WALLET_CONNECTION_KEY || event.key === WALLET_ADDRESS_KEY) {
                const isConnected = localStorage.getItem(WALLET_CONNECTION_KEY) === 'true';
                const address = localStorage.getItem(WALLET_ADDRESS_KEY);

                setState(prev => ({
                    ...prev,
                    isConnected,
                    address: isConnected ? address : null,
                }));
            }
        };

        const handleWalletStateChanged = (event: CustomEvent) => {
            const { isConnected, address } = event.detail;
            setState(prev => ({
                ...prev,
                isConnected,
                address,
            }));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('walletStateChanged', handleWalletStateChanged as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('walletStateChanged', handleWalletStateChanged as EventListener);
        };
    }, []);

    // Check for existing connection on mount - load from storage first
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // First, check localStorage for persisted connection
        const storedConnection = localStorage.getItem(WALLET_CONNECTION_KEY) === 'true';
        const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);

        if (storedConnection && storedAddress) {
            setState(prev => ({
                ...prev,
                isConnected: true,
                address: storedAddress,
            }));
            // Don't set justConnected for restored connections
        }

        const checkConnection = async () => {
            try {
                const provider = getProvider();

                if (provider) {
                    // Only check if provider has the methods we need
                    if (provider.isConnected && typeof provider.isConnected === 'function') {
                        const isConnected = provider.isConnected();

                        if (isConnected && provider.getAccounts && typeof provider.getAccounts === 'function') {
                            try {
                                const accounts = await provider.getAccounts();
                                if (accounts && accounts.length > 0) {
                                    const newState = {
                                        isConnected: true,
                                        address: accounts[0],
                                        isLoading: false,
                                        error: null,
                                    };

                                    setState(newState);
                                    setWallet(provider);
                                    // Don't set justConnected for auto-detected connections

                                    // Update storage
                                    syncStateToStorage(true, accounts[0]);

                                    // Add event listeners
                                    if (provider.on && typeof provider.on === 'function') {
                                        provider.on('accountsChanged', handleAccountsChanged);
                                        provider.on('chainChanged', handleChainChanged);
                                    }
                                }
                            } catch (error) {
                                console.error('Error getting accounts:', error);
                                // If stored connection is invalid, clear it
                                if (storedConnection) {
                                    syncStateToStorage(false, null);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
                // If stored connection is invalid, clear it
                if (storedConnection) {
                    syncStateToStorage(false, null);
                }
            }
        };

        // Add a small delay to ensure the extension is loaded
        const timeoutId = setTimeout(() => {
            checkConnection();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [getProvider, handleAccountsChanged, handleChainChanged, syncStateToStorage]);

    return {
        isConnected: state.isConnected,
        address: state.address,
        isLoading: state.isLoading,
        error: state.error,
        modalVisible,
        connect,
        disconnect,
        showModal,
        hideModal,
        justConnected, // Expose this flag
    };
}