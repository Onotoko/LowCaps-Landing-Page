import { useState, useEffect, useCallback } from 'react';
import { Web3State, Web3Actions } from '@/types/web3';

export interface UseWeb3Return extends Web3State, Web3Actions {
    modalVisible: boolean;
}

export function useWeb3(): UseWeb3Return {
    const [state, setState] = useState<Web3State>({
        isConnected: false,
        address: null,
        isLoading: false,
        error: null,
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [wallet, setWallet] = useState<any>(null);

    const showModal = useCallback(() => setModalVisible(true), []);
    const hideModal = useCallback(() => setModalVisible(false), []);

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
        } else if (accounts[0] !== state.address) {
            setState(prev => ({
                ...prev,
                address: accounts[0],
                isConnected: true,
            }));
        }
    }, [state.address]);

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
                setState({
                    isConnected: true,
                    address: accounts[0],
                    isLoading: false,
                    error: null,
                });

                setWallet(provider);

                // Add event listeners if available
                if (provider.on && typeof provider.on === 'function') {
                    provider.on('accountsChanged', handleAccountsChanged);
                    provider.on('chainChanged', handleChainChanged);
                }

                // Auto-close modal on successful connection
                setModalVisible(false);
            } else {
                // throw new Error('No accounts returned from StarKey wallet');
            }
        } catch (error: any) {
            console.error('Wallet connection error:', error);

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to connect wallet',
            }));
        }
    }, [getProvider, handleAccountsChanged, handleChainChanged]);

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
    }, [wallet, handleAccountsChanged, handleChainChanged]);

    // Check for existing connection on mount - simplified version
    useEffect(() => {
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
                                    setState({
                                        isConnected: true,
                                        address: accounts[0],
                                        isLoading: false,
                                        error: null,
                                    });
                                    setWallet(provider);

                                    // Add event listeners
                                    if (provider.on && typeof provider.on === 'function') {
                                        provider.on('accountsChanged', handleAccountsChanged);
                                        provider.on('chainChanged', handleChainChanged);
                                    }
                                }
                            } catch (error) {
                                console.error('Error getting accounts:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        };

        // Add a small delay to ensure the extension is loaded
        const timeoutId = setTimeout(() => {
            checkConnection();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [getProvider, handleAccountsChanged, handleChainChanged]);

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
    };
}