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
    Asset,
    BlockfrostConfig,
    Minswap,
    BaseMetadataProvider,
    TokenRegistryProvider,
    Spectrum
} from '@indigo-labs/dexter'
import {
    Blockfrost,
    Lucid,
} from 'lucid-cardano';
import * as fs from 'fs';
import { Console } from 'console';

const seed = fs.readFileSync('./stuff/seed', 'utf8')
const seed2 = fs.readFileSync('./stuff/seed', 'utf8')
const fee_addr = "";
const raid_amt = 100n;
const fee_amt = raid_amt * 2n / 10n
const nov4ID = "98feb5c8619c0314ac0787bc59b0e63ad6c4232551fa35f1f735b1aa4e4f5634"
const nov4 = new Asset(nov4ID, '4e4f5634', 6)

const bfConfig: BlockfrostConfig = {
    url: 'https://cardano-mainnet.blockfrost.io/api/v0',
    projectId: 'mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78',
};

const lucid = await Lucid.new(
    new Blockfrost(
        "https://cardano-mainnet.blockfrost.io/api/v0",
        "mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78"
    ),
    "Mainnet",
);

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

declare module '@indigo-labs/dexter' {
    interface BaseWalletProvider {
        createFeeTx: DexTransaction;
    }
}

//BaseWalletProvider.prototype.createFeeTx = function(): DexTransaction {
//    const transaction: DexTransaction = new DexTransaction(walletProvider);
//    transaction.providerData.tx = lucid
//       .newTx()
//        .payToAddress(fee_addr, { [nov4ID]: (fee_amt) });
//
//    return transaction;
//};

const dexter: Dexter = new Dexter(dexterConfig, requestConfig);

const provider: BaseDataProvider = new BlockfrostProvider(bfConfig)
const metadataProvider: BaseMetadataProvider = new TokenRegistryProvider();
const walletProvider: BaseWalletProvider = new LucidProvider();

walletProvider.loadWalletFromSeedPhrase(seed2.split(" "), {}, bfConfig)
    .then((walletProvider: BaseWalletProvider) => {

        dexter.withDataProvider(provider)
            .withWalletProvider(walletProvider)
            .withMetadataProvider(metadataProvider)
            .newFetchRequest()
            .onAllDexs()
            .forTokens([nov4])
            .getLiquidityPools()
            .then((pools: LiquidityPool[]) => {
                console.log(pools);
            });
        console.log(nov4ID)
    });


function createFeeTx(): DexTransaction {
    const transaction: DexTransaction = new DexTransaction(walletProvider);
    transaction.providerData.tx = lucid
        .newTx()
        .payToAddress(fee_addr, { [nov4ID]: (fee_amt) });

    return transaction;
}


//function submitFeeTx(): DexTransaction {
//    if (!walletProvider) {
//        throw new Error('Wallet provider must be set before submitting a swap order.');
//    }
//    if (!walletProvider.isWalletLoaded) {
//        throw new Error('Wallet must be loaded before submitting a swap order.');
//   }
//
//    const swapTransaction: DexTransaction = walletProvider.createFeeTx;
//
//    if (!dexterConfig.shouldSubmitOrders) {
//        return swapTransaction;
//    }
//
//    this.getPaymentsToAddresses()
//        .then((payToAddresses: PayToAddress[]) => {
//            this.sendSwapOrder(swapTransaction, payToAddresses);
//        });
//
//    return swapTransaction;
//}
//dexter.newSwapRequest()
//    .withSwapInToken(nov4)
//    .withSwapOutToken('lovelace')
//    .withSwapInAmount(raid_amt - fee_amt)
//    .submit()
