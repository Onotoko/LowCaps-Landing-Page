export interface TokenData {
    totalSupply: string;
    circulatingSupply: string;
    price: string;
    tokensPerSupra: string;
    marketCap: string;
}

export interface TokenMetrics {
    price: number;
    marketCap: number;
    lowcapsPerSupra: number;
}

export interface ReserveData {
    reserve_x: bigint;
    reserve_y: bigint;
    isTokenX: boolean;
}

export interface LoadingState {
    price: boolean;
    supply: boolean;
    marketCap: boolean;
}

export interface Notification {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
}