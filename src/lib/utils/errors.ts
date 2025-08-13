export class BlockchainError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class PricingError extends Error {
    constructor(message: string, public tokenPair?: string) {
        super(message);
        this.name = 'PricingError';
    }
}