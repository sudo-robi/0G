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
        }
        // Handle eth-crypto/eccrypto native bindings
        config.externals.push('eccrypto', 'pino-pretty', '@react-native-async-storage/async-storage');
        return config;
    },
};

export default nextConfig;
