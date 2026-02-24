/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }
        // Externalize native modules completely
        config.externals = [...(config.externals || []), 'eccrypto', 'secp256k1', 'pino-pretty', '@react-native-async-storage/async-storage'];
        
        // Ignore these modules on client side
        config.plugins = config.plugins || [];
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(eccrypto|secp256k1)$/,
            })
        );
        
        return config;
    },
};

export default nextConfig;
