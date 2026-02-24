/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
            // Prevent eccrypto from being bundled on client side
            config.resolve.alias = {
                ...config.resolve.alias,
                'eccrypto': false,
                'secp256k1': false,
            };
        }
        // Handle eth-crypto/eccrypto native bindings
        config.externals.push('eccrypto', 'secp256k1', 'pino-pretty', '@react-native-async-storage/async-storage');
        return config;
    },
};

export default nextConfig;
