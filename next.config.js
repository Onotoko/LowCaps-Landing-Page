/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.sftcdn.net',
                port: '',
                pathname: '/images/**',
            },
            {
                protocol: 'https',
                hostname: 'supra.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    // Optimize for static export if needed
    // output: 'export',
    // trailingSlash: true,

    // Enable experimental features for Web3 development
    experimental: {
        esmExternals: true,
    },

    // Webpack config for Web3 libraries
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;