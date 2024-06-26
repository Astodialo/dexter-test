import { Dexter, BlockfrostProvider, LucidProvider } from '@indigo-labs/dexter';
import * as fs from 'fs';
const seed = fs.readFileSync('./stuff/seed', 'utf8');
const dexterConfig = {
    shouldFetchMetadata: true, // Whether to fetch asset metadata (Best to leave this `true` for accurate pool info)
    shouldFallbackToApi: true, // Only use when using Blockfrost or Kupo as data providers. On failure, fallback to the DEX API to grab necessary data
    shouldSubmitOrders: false, // Allow Dexter to submit orders from swap requests. Useful during development
    metadataMsgBranding: 'Dexter', // Prepend branding name in Tx message
};
const requestConfig = {
    timeout: 5000, // How long outside network requests have to reply
    proxyUrl: '', // URL to prepend to all outside URLs. Useful when dealing with CORs
    retries: 3, // Number of times to reattempt any outside request
};
const dexter = new Dexter(dexterConfig, requestConfig);
const bfData = new BlockfrostProvider({
    url: 'https://cardano-mainnet.blockfrost.io/api/v0',
    projectId: 'mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78',
});
const lucidProvider = new LucidProvider();
lucidProvider.loadWalletFromSeedPhrase(seed.split(" "), {}, {
    url: 'https://cardano-mainnet.blockfrost.io/api/v0',
    projectId: 'mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78',
});
console.log(seed.split(" "));
console.log(lucidProvider);
// Basic fetch example
dexter.newFetchRequest()
    .onAllDexs()
    .getLiquidityPools()
    .then((pools) => {
    console.log(pools);
});
