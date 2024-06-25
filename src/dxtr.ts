import { DexterConfig,
  RequestConfig,
  Dexter,
  BaseDataProvider,
  MockDataProvider,
  BaseWalletProvider,
  MockWalletProvider,
  LiquidityPool
} from '@indigo-labs/dexter'

const dexterConfig: DexterConfig = {
    shouldFetchMetadata: true,      // Whether to fetch asset metadata (Best to leave this `true` for accurate pool info)
    shouldFallbackToApi: true,      // Only use when using Blockfrost or Kupo as data providers. On failure, fallback to the DEX API to grab necessary data
    shouldSubmitOrders: false,      // Allow Dexter to submit orders from swap requests. Useful during development
    metadataMsgBranding: 'Dexter',  // Prepend branding name in Tx message
};
const requestConfig: RequestConfig = {
    timeout: 5000,  // How long outside network requests have to reply
    proxyUrl: '',   // URL to prepend to all outside URLs. Useful when dealing with CORs
    retries: 3,     // Number of times to reattempt any outside request
};

const dexter: Dexter = new Dexter(dexterConfig, requestConfig);

const mockData: BaseDataProvider = new MockDataProvider();
const mockWallet: BaseWalletProvider = new MockWalletProvider();

// Basic fetch example
dexter.newFetchRequest()
    .onAllDexs()
    .getLiquidityPools()
    .then((pools: LiquidityPool[]) => {
        console.log(pools);
    });
