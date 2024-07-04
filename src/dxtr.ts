import {
    DexterConfig,
    RequestConfig,
    Dexter,
    BaseDataProvider,
    BaseWalletProvider,
    BlockfrostProvider,
    LucidProvider,
    LiquidityPool,
    DexTransaction,
} from '@indigo-labs/dexter'
import {
    Blockfrost,
    Lucid,
} from 'lucid-cardano';
import * as fs from 'fs';

const seed = fs.readFileSync('./stuff/seed', 'utf8')
const fee_addr = "";
const raid_amt = 100n;
const fee_amt = raid_amt * 2n / 10n
const token = ""

const lucid = await Lucid.new(
    new Blockfrost(
        "https://cardano-mainnet.blockfrost.io/api/v0",
        "mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78"
    ),
    "Mainnet",
);

function createFeeTx(): DexTransaction {
    const transaction: DexTransaction = new DexTransaction(lucidProvider);
    transaction.providerData.tx = lucid
        .newTx()
        .payToAddress(fee_addr, { [token]: (fee_amt) });

    return transaction;
}

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

const bfData: BaseDataProvider = new BlockfrostProvider(
    {
        url: 'https://cardano-mainnet.blockfrost.io/api/v0',
        projectId: 'mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78',
    }
);

const lucidProvider: LucidProvider = new LucidProvider();
lucidProvider.loadWalletFromSeedPhrase(seed.split(" "), {}, {
    url: 'https://cardano-mainnet.blockfrost.io/api/v0',
    projectId: 'mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78',
})


console.log(seed.split(" "))
console.log(lucidProvider)

// Basic fetch example
dexter.newFetchRequest()
    .onAllDexs()
    .getLiquidityPools()
    .then((pools: LiquidityPool[]) => {
        console.log(pools);
    });
