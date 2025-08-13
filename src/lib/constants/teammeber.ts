import { TeamMember, Service } from '@/lib/types/web3';

export const TEAM_MEMBERS: TeamMember[] = [
    {
        name: 'Brett',
        role: 'Project manager',
        image: '/assets/team/brett.png',
        wallet: '0x1234...5678',
        stats: {
            projects: 50,
            rating: 4.9,
            specialties: ['Project Management', 'Strategy', 'Client Relations']
        }
    },
    {
        name: 'Andy',
        role: 'Marketing Professional',
        image: '/assets/team/andy.png',
        wallet: '0x2345...6789',
        stats: {
            projects: 30,
            rating: 5.0,
            specialties: ['Marketing', 'Community', 'Brand Strategy']
        }
    },
    {
        name: 'Jena',
        role: 'Blockchain Specialist',
        image: '/assets/team/jena.png',
        wallet: '0x3456...7890',
        stats: {
            projects: 100,
            rating: 4.9,
            specialties: ['Smart Contracts', 'DeFi', 'Security Audits']
        }
    },
    {
        name: 'Mohit',
        role: 'Frontend Engineer',
        image: '/assets/team/mohit.png',
        wallet: '0x4567...8901',
        stats: {
            projects: 75,
            rating: 4.8,
            specialties: ['React', 'Web3 Integration', 'UI/UX']
        }
    },
    {
        name: 'Ryan',
        role: 'AI Professional',
        image: '/assets/team/ryan.png',
        wallet: '0x5678...9012',
        stats: {
            projects: 20,
            rating: 4.9,
            specialties: ['Machine Learning', 'AI Integration', 'Data Analysis']
        }
    },
];

export const SERVICES: Service[] = [
    {
        icon: '📜',
        title: 'Smart Contract Development',
        description: 'Custom smart contracts built with security and efficiency in mind. From simple tokens to complex DeFi protocols.',
        features: ['ERC-20/721/1155 Tokens', 'Custom Logic', 'Gas Optimization', 'Security Audits'],
        pricing: { starting: 2000, currency: 'USD' }
    },
    {
        icon: '🌐',
        title: 'DApp Development',
        description: 'End-to-end decentralized application development with modern frontend frameworks and seamless Web3 integration.',
        features: ['React/Next.js', 'Web3 Integration', 'Responsive Design', 'User Experience'],
        pricing: { starting: 5000, currency: 'USD' }
    },
    {
        icon: '🎨',
        title: 'NFT Platforms',
        description: 'Complete NFT marketplace solutions, minting platforms, and custom NFT collections with advanced features.',
        features: ['Minting Platform', 'Marketplace', 'Rarity System', 'Metadata Management'],
        pricing: { starting: 8000, currency: 'USD' }
    },
    {
        icon: '💰',
        title: 'DeFi Solutions',
        description: 'Yield farming, liquidity pools, DEX development, and other innovative DeFi protocol implementations.',
        features: ['Yield Farming', 'Liquidity Pools', 'DEX', 'Governance'],
        pricing: { starting: 15000, currency: 'USD' }
    },
    {
        icon: '🔍',
        title: 'Blockchain Consulting',
        description: 'Strategic guidance on blockchain technology adoption, tokenomics design, and project architecture planning.',
        features: ['Strategy Planning', 'Tokenomics', 'Architecture Review', 'Technical Audit'],
        pricing: { starting: 1000, currency: 'USD' }
    },
    {
        icon: '🛡️',
        title: 'Security Audits',
        description: 'Comprehensive smart contract audits and security assessments to ensure your code is bulletproof.',
        features: ['Code Review', 'Vulnerability Assessment', 'Gas Optimization', 'Security Report'],
        pricing: { starting: 3000, currency: 'USD' }
    }
];

export const SOCIAL_LINKS = {
    twitter: 'https://x.com/Low_Caps_',
    email: 'brett@lowcaps.io',
    website: 'https://lowcaps.io',
    supra: 'https://supra.com'
};

export const SUPRA_NETWORK = {
    chainId: '0x1', // Update with actual SUPRA chain ID
    chainName: 'SUPRA Network',
    rpcUrls: ['https://rpc.supra.com'], // Update with actual RPC
    blockExplorerUrls: ['https://explorer.supra.com'], // Update with actual explorer
    nativeCurrency: {
        name: 'SUPRA',
        symbol: 'SUPRA',
        decimals: 18
    }
};

export const WALLET_CONNECT_CONFIG = {
    starkey: {
        name: 'StarKey Wallet',
        icon: 'https://images.sftcdn.net/images/t_app-icon-m/p/4880d747-59d4-4550-9e96-647571541b84/4155430577/starkey-wallet-the-official-wallet-for-supra-logo',
        downloadUrl: 'https://www.starkey.app/'
    }
};