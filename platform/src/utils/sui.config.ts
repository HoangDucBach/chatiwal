import { getFullnodeUrl } from '@mysten/sui/client';

const networks = {
    testnet: { url: getFullnodeUrl('testnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
};

const defaultNetwork = 'testnet' as const;

export default {
    networks,
    defaultNetwork,
}