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
    Spectrum,
    MuesliSwap,
    SundaeSwap,
    //} from '@indigo-labs/dexter'
} from '../dexter'
import {
    Blockfrost,
    Lucid,
    Cardano
} from 'lucid-cardano';
import * as fs from 'fs';
import { Console } from 'console';

const seed = fs.readFileSync('stuff/seed', 'utf8')
const fee_addr = "addr1q9aenca4a37ey9h2wmj5vmda9egs6qt9kf8k3kkmdaqavn5u6evll4jw08ha52vy8eg70vnsnfvjwn5tqvq8l05t0qds2zggq2";
const raid_amt = 800n;
const fee_amt = raid_amt * 2n / 10n
const nov4ID = "98feb5c8619c0314ac0787bc59b0e63ad6c4232551fa35f1f735b1aa"
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

const lucid_wallet = await lucid.selectWalletFromSeed(fs.readFileSync('stuff/seed', 'utf8'))

const dexterConfig: DexterConfig = {
    shouldFetchMetadata: true,      // Whether to fetch asset metadata (Best to leave this `true` for accurate pool info)
    shouldFallbackToApi: true,      // Only use when using Blockfrost or Kupo as data providers. On failure, fallback to the DEX API to grab necessary data
    shouldSubmitOrders: true,      // Allow Dexter to submit orders from swap requests. Useful during development
    metadataMsgBranding: 'Dexter',  // Prepend branding name in Tx message
};
const requestConfig: RequestConfig = {
    timeout: 1000000,  // How long outside network requests have to reply
    proxyUrl: '',   // URL to prepend to all outside URLs. Useful when dealing with CORs
    retries: 30,     // Number of times to reattempt any outside request
};

const dexter: Dexter = new Dexter(dexterConfig, requestConfig);

const provider: BaseDataProvider = new BlockfrostProvider(bfConfig)
const metadataProvider: BaseMetadataProvider = new TokenRegistryProvider();
const walletProvider: BaseWalletProvider = new LucidProvider();

const fee_tx = await lucid.newTx()
    .payToAddress("addr..", { [nov4ID]: fee_amt })
    .complete();
const signed_fee_tx = await fee_tx.sign().complete();

walletProvider.loadWalletFromSeedPhrase(seed.split(" "), {}, bfConfig)
    .then((walletProvider: BaseWalletProvider) => {

        console.log(walletProvider)
        dexter.withDataProvider(provider)
            .withWalletProvider(walletProvider)
            .withMetadataProvider(metadataProvider)
            .newFetchRequest()
            .onDexs([Spectrum.identifier])
            .forTokens([nov4])
            .getLiquidityPools()
            .then((pools: LiquidityPool[]) => {
                console.log(pools)

                let tx = dexter.withDataProvider(provider)
                    .withWalletProvider(walletProvider)
                    .withMetadataProvider(metadataProvider)
                    .newSwapRequest()
                    .forLiquidityPool(pools[0])
                    .withSwapInToken(nov4)
                    .withSwapOutToken('lovelace')
                    .withSwapInAmount(raid_amt - fee_amt)
                    .submit()
                //.submitFeeTx(nov4ID, fee_addr, fee_amt);

                const txHash = signed_fee_tx.submit();

                tx.onBuilding(() => {
                    console.log('Tx building');
                });
                tx.onSigning(() => {
                    console.log('Tx signing');
                });

                tx.onError((tx: DexTransaction) => {
                    console.log(tx.error);
                });

                tx.onSubmitting(() => {
                    console.log('Tx submitting to chain');
                });

                tx.onSubmitted(() => {
                    console.log('Tx submitted');
                });

                tx.onFinally(() => {
                    console.log('All complete or has errored');
                });

                console.log(tx)

            });

        //        dexter.newSwapRequest()
        //            .withSwapInToken(nov4)
        //            .withSwapOutToken('lovelace')
        //            .withSwapInAmount(raid_amt - fee_amt)
        //            .submitFeeTx(nov4ID, fee_addr, fee_amt)
    });
