import { http, createConfig } from 'wagmi';
import { zeroGGalileo } from './chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
    chains: [zeroGGalileo],
    connectors: [injected()],
    transports: {
        [zeroGGalileo.id]: http(),
    },
});
