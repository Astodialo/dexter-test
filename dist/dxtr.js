import { Dexter, BlockfrostProvider, LucidProvider, Asset, TokenRegistryProvider } from '@indigo-labs/dexter';
import { Blockfrost, Lucid, } from 'lucid-cardano';
import * as fs from 'fs';
const seed = fs.readFileSync('./stuff/seed', 'utf8');
const seed2 = fs.readFileSync('./stuff/seed', 'utf8');
const fee_addr = "";
const raid_amt = 100n;
const fee_amt = raid_amt * 2n / 10n;
const nov4ID = "98feb5c8619c0314ac0787bc59b0e63ad6c4232551fa35f1f735b1aa";
const nov4 = new Asset(nov4ID, '4e4f5634', 6);
const bfConfig = {
    url: 'https://cardano-mainnet.blockfrost.io/api/v0',
    projectId: 'mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78',
};
const lucid = await Lucid.new(new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", "mainnetSilnqcY9CHmK7l2AzXAlX7HEaoLchT78"), "Mainnet");
const dexterConfig = {
    shouldFetchMetadata: false, // Whether to fetch asset metadata (Best to leave this `true` for accurate pool info)
    shouldFallbackToApi: true, // Only use when using Blockfrost or Kupo as data providers. On failure, fallback to the DEX API to grab necessary data
    shouldSubmitOrders: false, // Allow Dexter to submit orders from swap requests. Useful during development
    metadataMsgBranding: 'Dexter', // Prepend branding name in Tx message
};
const requestConfig = {
    timeout: 1000000, // How long outside network requests have to reply
    proxyUrl: '', // URL to prepend to all outside URLs. Useful when dealing with CORs
    retries: 30, // Number of times to reattempt any outside request
};
const dexter = new Dexter(dexterConfig, requestConfig);
const provider = new BlockfrostProvider(bfConfig);
const metadataProvider = new TokenRegistryProvider();
const walletProvider = new LucidProvider();
walletProvider.loadWalletFromSeedPhrase(seed2.split(" "), {}, bfConfig)
    .then((walletProvider) => {
    dexter.withDataProvider(provider)
        .withWalletProvider(walletProvider)
        .withMetadataProvider(metadataProvider)
        .newFetchRequest()
        .onAllDexs()
        .forTokens([nov4])
        //.onDexs([Spectrum.identifier])
        .getLiquidityPools()
        .then((pools) => {
        let transaction = dexter.newSwapRequest()
            .forLiquidityPool(pools[0])
            .withSwapInToken(nov4)
            .withSwapOutToken('lovelace')
            .withSwapInAmount(1000000n)
            //.withSwapInAmount(raid_amt - fee_amt)
            .submit();
        console.log(transaction);
    });
    console.log(nov4ID);
    //        dexter.newSwapRequest()
    //            .withSwapInToken(nov4)
    //            .withSwapOutToken('lovelace')
    //            .withSwapInAmount(raid_amt - fee_amt)
    //            .submitFeeTx(nov4ID, fee_addr, fee_amt)
});
