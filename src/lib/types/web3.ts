export interface StarKeyWallet {
    connect: () => Promise<string[]>;
    disconnect?: () => Promise<void>;
    isConnected?: () => boolean;
    getAccounts?: () => Promise<string[]>;
    on?: (event: string, handler: (...args: any[]) => void) => void;
    removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    supra?: any; // The actual supra provider
}

export interface Web3State {
    isConnected: boolean;
    address: string | null;
    isLoading: boolean;
    error: string | null;
    chainId?: string;
    balance?: string;
}

export interface Web3Actions {
    connect: () => Promise<void>;
    disconnect: () => void;
    showModal: () => void;
    hideModal: () => void;
    switchChain?: (chainId: string) => Promise<void>;
    getBalance?: () => Promise<string>;
}

export interface TeamMember {
    name: string;
    role: string;
    image: string;
    wallet: string;
    stats?: {
        projects: number;
        rating: number;
        specialties: string[];
    };
}

export interface Service {
    icon: string;
    title: string;
    description: string;
    features?: string[];
    pricing?: {
        starting: number;
        currency: string;
    };
}

declare global {
    interface Window {
        starkey?: {
            supra?: StarKeyWallet;
        };
        ethereum?: StarKeyWallet;
    }
}