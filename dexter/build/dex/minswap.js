import { LiquidityPool } from './models/liquidity-pool';
import { Asset } from './models/asset';
import { BaseDex } from './base-dex';
import { DefinitionBuilder } from '../definition-builder';
import { correspondingReserves } from '../utils';
import { AddressType, DatumParameterKey } from '../constants';
import order from './definitions/minswap/order';
import { MinswapApi } from './api/minswap-api';
import pool from './definitions/minswap/pool';
class Minswap extends BaseDex {
    constructor(requestConfig = {}) {
        super();
        /**
         * On-Chain constants.
         */
        this.marketOrderAddress = 'addr1wxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uwc0h43gt';
        this.limitOrderAddress = 'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70';
        this.lpTokenPolicyId = 'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86';
        this.poolNftPolicyId = '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1';
        this.poolValidityAsset = '13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f4d494e53574150';
        this.cancelDatum = 'd87a80';
        this.orderScript = {
            type: 'PlutusV1',
            script: '59014f59014c01000032323232323232322223232325333009300e30070021323233533300b3370e9000180480109118011bae30100031225001232533300d3300e22533301300114a02a66601e66ebcc04800400c5288980118070009bac3010300c300c300c300c300c300c300c007149858dd48008b18060009baa300c300b3754601860166ea80184ccccc0288894ccc04000440084c8c94ccc038cd4ccc038c04cc030008488c008dd718098018912800919b8f0014891ce1317b152faac13426e6a83e06ff88a4d62cce3c1634ab0a5ec133090014a0266008444a00226600a446004602600a601a00626600a008601a006601e0026ea8c03cc038dd5180798071baa300f300b300e3754601e00244a0026eb0c03000c92616300a001375400660106ea8c024c020dd5000aab9d5744ae688c8c0088cc0080080048c0088cc00800800555cf2ba15573e6e1d200201',
        };
        this.api = new MinswapApi(this, requestConfig);
    }
    async liquidityPoolAddresses(provider) {
        const validityAsset = Asset.fromIdentifier(this.poolValidityAsset);
        const assetAddresses = await provider.assetAddresses(validityAsset);
        return Promise.resolve([...new Set(assetAddresses.map((assetAddress) => assetAddress.address))]);
    }
    async liquidityPools(provider) {
        const validityAsset = Asset.fromIdentifier(this.poolValidityAsset);
        const poolAddresses = await this.liquidityPoolAddresses(provider);
        const addressPromises = poolAddresses.map(async (address) => {
            const utxos = await provider.utxos(address, validityAsset);
            return await Promise.all(utxos.map(async (utxo) => {
                return await this.liquidityPoolFromUtxo(provider, utxo);
            }))
                .then((liquidityPools) => {
                return liquidityPools.filter((liquidityPool) => {
                    return liquidityPool !== undefined;
                });
            });
        });
        return Promise.all(addressPromises)
            .then((liquidityPools) => liquidityPools.flat());
    }
    async liquidityPoolFromUtxo(provider, utxo) {
        if (!utxo.datumHash) {
            return Promise.resolve(undefined);
        }
        const relevantAssets = utxo.assetBalances
            .filter((assetBalance) => {
            const assetBalanceId = assetBalance.asset === 'lovelace' ? 'lovelace' : assetBalance.asset.identifier();
            return assetBalanceId !== this.poolValidityAsset
                && !assetBalanceId.startsWith(this.lpTokenPolicyId)
                && !assetBalanceId.startsWith(this.poolNftPolicyId);
        });
        // Irrelevant UTxO
        if (relevantAssets.length < 2) {
            return Promise.resolve(undefined);
        }
        // Could be ADA/X or X/X pool
        const assetAIndex = relevantAssets.length === 2 ? 0 : 1;
        const assetBIndex = relevantAssets.length === 2 ? 1 : 2;
        const liquidityPool = new LiquidityPool(Minswap.identifier, relevantAssets[assetAIndex].asset, relevantAssets[assetBIndex].asset, relevantAssets[assetAIndex].quantity, relevantAssets[assetBIndex].quantity, utxo.address, this.marketOrderAddress, this.limitOrderAddress);
        // Load additional pool information
        const poolNft = utxo.assetBalances.find((assetBalance) => {
            return assetBalance.asset !== 'lovelace' && assetBalance.asset.policyId === this.poolNftPolicyId;
        })?.asset;
        if (!poolNft)
            return undefined;
        liquidityPool.lpToken = new Asset(this.lpTokenPolicyId, poolNft.nameHex);
        liquidityPool.identifier = liquidityPool.lpToken.identifier();
        liquidityPool.poolFeePercent = 0.3;
        try {
            liquidityPool.poolFeePercent = 0.3;
            const builder = await (new DefinitionBuilder())
                .loadDefinition(pool);
            const datum = await provider.datumValue(utxo.datumHash);
            const parameters = builder.pullParameters(datum);
            // Ignore Zap orders
            if (typeof parameters.PoolAssetBPolicyId === 'string' && parameters.PoolAssetBPolicyId === this.lpTokenPolicyId) {
                return undefined;
            }
            liquidityPool.totalLpTokens = typeof parameters.TotalLpTokens === 'number'
                ? BigInt(parameters.TotalLpTokens)
                : 0n;
        }
        catch (e) {
            return liquidityPool;
        }
        return liquidityPool;
    }
    estimatedGive(liquidityPool, swapOutToken, swapOutAmount) {
        const poolFeeMultiplier = 10000n;
        const poolFeeModifier = poolFeeMultiplier - BigInt(Math.round((liquidityPool.poolFeePercent / 100) * Number(poolFeeMultiplier)));
        const [reserveOut, reserveIn] = correspondingReserves(liquidityPool, swapOutToken);
        const swapInNumerator = swapOutAmount * reserveIn * poolFeeMultiplier;
        const swapInDenominator = (reserveOut - swapOutAmount) * poolFeeModifier;
        return swapInNumerator / swapInDenominator + 1n;
    }
    estimatedReceive(liquidityPool, swapInToken, swapInAmount) {
        const poolFeeMultiplier = 10000n;
        const poolFeeModifier = poolFeeMultiplier - BigInt(Math.round((liquidityPool.poolFeePercent / 100) * Number(poolFeeMultiplier)));
        const [reserveIn, reserveOut] = correspondingReserves(liquidityPool, swapInToken);
        const swapOutNumerator = swapInAmount * reserveOut * poolFeeModifier;
        const swapOutDenominator = swapInAmount * poolFeeModifier + reserveIn * poolFeeMultiplier;
        return swapOutNumerator / swapOutDenominator;
    }
    priceImpactPercent(liquidityPool, swapInToken, swapInAmount) {
        const poolFeeMultiplier = 10000n;
        const poolFeeModifier = poolFeeMultiplier - BigInt(Math.round((liquidityPool.poolFeePercent / 100) * Number(poolFeeMultiplier)));
        const [reserveIn, reserveOut] = correspondingReserves(liquidityPool, swapInToken);
        const swapOutNumerator = swapInAmount * poolFeeModifier * reserveOut;
        const swapOutDenominator = swapInAmount * poolFeeModifier + reserveIn * poolFeeMultiplier;
        const priceImpactNumerator = (reserveOut * swapInAmount * swapOutDenominator * poolFeeModifier)
            - (swapOutNumerator * reserveIn * poolFeeMultiplier);
        const priceImpactDenominator = reserveOut * swapInAmount * swapOutDenominator * poolFeeMultiplier;
        return Number(priceImpactNumerator * 100n) / Number(priceImpactDenominator);
    }
    async buildSwapOrder(liquidityPool, swapParameters, spendUtxos = []) {
        const batcherFee = this.swapOrderFees().find((fee) => fee.id === 'batcherFee');
        const deposit = this.swapOrderFees().find((fee) => fee.id === 'deposit');
        if (!batcherFee || !deposit) {
            return Promise.reject('Parameters for datum are not set.');
        }
        swapParameters = {
            ...swapParameters,
            [DatumParameterKey.BatcherFee]: batcherFee.value,
            [DatumParameterKey.DepositFee]: deposit.value,
        };
        const datumBuilder = new DefinitionBuilder();
        await datumBuilder.loadDefinition(order)
            .then((builder) => {
            builder.pushParameters(swapParameters);
        });
        return [
            this.buildSwapOrderPayment(swapParameters, {
                address: this.marketOrderAddress,
                addressType: AddressType.Contract,
                assetBalances: [
                    {
                        asset: 'lovelace',
                        quantity: batcherFee.value + deposit.value,
                    },
                ],
                datum: datumBuilder.getCbor(),
                isInlineDatum: false,
                spendUtxos: spendUtxos,
            })
        ];
    }
    async buildCancelSwapOrder(txOutputs, returnAddress) {
        const relevantUtxo = txOutputs.find((utxo) => {
            return [this.marketOrderAddress, this.limitOrderAddress].includes(utxo.address);
        });
        if (!relevantUtxo) {
            return Promise.reject('Unable to find relevant UTxO for cancelling the swap order.');
        }
        return [
            {
                address: returnAddress,
                addressType: AddressType.Base,
                assetBalances: relevantUtxo.assetBalances,
                isInlineDatum: false,
                spendUtxos: [{
                        utxo: relevantUtxo,
                        redeemer: this.cancelDatum,
                        validator: this.orderScript,
                        signer: returnAddress,
                    }],
            }
        ];
    }
    swapOrderFees() {
        return [
            {
                id: 'batcherFee',
                title: 'Batcher Fee',
                description: 'Fee paid for the service of off-chain Laminar batcher to process transactions.',
                value: 2000000n,
                isReturned: false,
            },
            {
                id: 'deposit',
                title: 'Deposit',
                description: 'This amount of ADA will be held as minimum UTxO ADA and will be returned when your order is processed or cancelled.',
                value: 2000000n,
                isReturned: true,
            },
        ];
    }
}
Minswap.identifier = 'Minswap';
export { Minswap };
