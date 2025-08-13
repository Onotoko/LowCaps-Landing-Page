// SUPRA Network Configuration
export const SUPRA_CONFIG = {
    // Use the correct RPC endpoint for SUPRA mainnet
    CLIENT_URL: 'https://rpc-mainnet.supra.com',
    MODULE_ADDRESS_ROUTER: '0xdc694898dff98a1b0447e0992d0413e123ea80da1021d464a4fbaf0265870d8',
    CHAIN_ID: '8'
};

// Export individual items for backward compatibility
export const SUPRA_CLIENT_URL = SUPRA_CONFIG.CLIENT_URL;
export const MODULE_ADDRESS_ROUTER = SUPRA_CONFIG.MODULE_ADDRESS_ROUTER;

// Token Type Tags
export const SUPRA_COIN_TYPE = '0x1::supra_coin::SupraCoin';
export const DEXUSDC_COIN_TYPE = '0x8f7d16ade319b0fce368ca6cdb98589c4527ce7f5b51e544a9e68e719934458b::hyper_coin::DexlynUSDC';
export const CURVE_TYPE = '0xdc694898dff98a1b0447e0992d0413e123ea80da1021d464a4fbaf0265870d8::curves::Uncorrelated';

// Token Decimals
export const SUPRA_COIN_DECIMALS = 1e8; // 10^8
export const DEXUSDC_DECIMALS = 1_000_000; // 10^6

// LOWCAPS Token Configuration
export const LOWCAPS_TOKEN = {
    name: 'Low Cap Gems',
    symbol: 'LOWCAPS',
    typeTag: '0x35e70dea5a275dda4bdba9c5903d489891a10712dfbfa2bf04cc009f77026b94::lowCapGems::LOWCAPS',
    decimals: 1_000_000, // 10^6
    totalSupply: 1_000_000_000, // 1 billion tokens
    address: '0x35e70dea5a275dda4bdba9c5903d489891a10712dfbfa2bf04cc009f77026b94'
};

// Tokens Object for compatibility
export const TOKENS = {
    LOWCAPS: LOWCAPS_TOKEN,
    SUPRA: {
        name: 'SUPRA',
        symbol: 'SUPRA',
        typeTag: SUPRA_COIN_TYPE,
        decimals: SUPRA_COIN_DECIMALS
    },
    DEXUSDC: {
        name: 'dexUSDC',
        symbol: 'dexUSDC',
        typeTag: DEXUSDC_COIN_TYPE,
        decimals: DEXUSDC_DECIMALS
    }
};

// DEX Configuration
export const DEX_CONFIG = {
    name: 'Dexlyn',
    routerAddress: MODULE_ADDRESS_ROUTER,
    defaultSlippage: 0.5, // 0.5%
    defaultDeadline: 20, // 20 minutes
    feePercent: 0.25, // 0.25%
    feePct: 25,
    feeScale: 10000
};