import { BaseDex } from './base-dex';
import { Asset } from './models/asset';
import { LiquidityPool } from './models/liquidity-pool';
import { correspondingReserves, tokensMatch } from '../utils';
import { AddressType, DatumParameterKey } from '../constants';
import { DefinitionBuilder } from '../definition-builder';
import order from './definitions/wingriders/order';
import { WingRidersApi } from './api/wingriders-api';
import pool from "./definitions/wingriders/pool";
/**
 * WingRiders constants.
 */
const MIN_POOL_ADA = 3000000n;
const MAX_INT = 9223372036854775807n;
class WingRiders extends BaseDex {
    constructor(requestConfig = {}) {
        super();
        /**
         * On-Chain constants.
         */
        this.orderAddress = 'addr1wxr2a8htmzuhj39y2gq7ftkpxv98y2g67tg8zezthgq4jkg0a4ul4';
        this.poolValidityAsset = '026a18d04a0c642759bb3d83b12e3344894e5c1c7b2aeb1a2113a5704c';
        this.cancelDatum = 'd87a80';
        this.orderScript = {
            type: 'PlutusV1',
            script: '590370010000332332233322232323332223332223233223232323232332233222232322323225335301533225335301a00221333573466e3c02cdd7299a9a8101980924004a66a6a040660249000299a9a8101980924000a66a6a04066024900019a980b8900098099bac5335350203301248000d4d54054c0440088800858884008004588854cd4d4088004588854cd4d409000440088858588854cd4d4088004588854cd4d4090004588854cd4d409800440188858588854cd4d4088004588854cd4d409000440108858588854cd4d4088004400888580680644cc88d4c03400888d4c0440088888cc05cdd70019918139bac0015335350273301948000d4d54070c06001c88008588854cd4d40a4004588854cd4d40ac004588854cd4d40b4004588854cd4d40bc004588854cd4d40c4004588854cd4d40cc004588854cd4d40d400458884008cccd5cd19b8735573aa010900011980699191919191999ab9a3370e6aae75401120002333301535742a0086ae85400cd5d0a8011aba135744a004464c6a605266ae700900a80680644d5d1280089aba25001135573ca00226ea8004d5d0a8041aba135744a010464c6a604666ae7007809005004c004cccd5cd19b8750024800880688cccd5cd19b875003480008c8c074004dd69aba135573ca00a464c6a604466ae7007408c04c0480440044084584d55cea80089baa001135573ca00226ea80048848cc00400c0088004888848cccc00401401000c0088004c8004d540548894cd4d404c00440308854cd4c034ccd5cd19b8f00400200f00e100f13300500400125335350103300248000004588854cd4d4048004588854cd4d40500044cd54028010008885888c8d4d54018cd5401cd55cea80098021aab9e5001225335300b333573466e1c0140080340304004584dd5000990009aa809111999aab9f0012501223350113574200460066ae8800800d26112212330010030021120013200135500e2212253353500d0021622153353007333573466e1c00d2000009008100213353006120010013370200690010910010910009000909118010018910009000a490350543100320013550062233335573e0024a00c466a00a6eb8d5d080118019aba2002007112200212212233001004003120011200120011123230010012233003300200200148811ce6c90a5923713af5786963dee0fdffd830ca7e0c86a041d9e5833e910001',
        };
        this._assetAddresses = [];
        this.api = new WingRidersApi(this, requestConfig);
    }
    async liquidityPoolAddresses(provider) {
        const validityAsset = Asset.fromIdentifier(this.poolValidityAsset);
        const assetAddresses = this._assetAddresses.length > 0
            ? this._assetAddresses
            : await provider.assetAddresses(validityAsset);
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
        const validityAsset = Asset.fromIdentifier(this.poolValidityAsset);
        const relevantAssets = utxo.assetBalances.filter((assetBalance) => {
            const assetBalanceId = assetBalance.asset === 'lovelace' ? 'lovelace' : assetBalance.asset.identifier();
            return !assetBalanceId.startsWith(validityAsset.policyId);
        });
        // Irrelevant UTxO
        if (relevantAssets.length < 2) {
            return Promise.resolve(undefined);
        }
        // Could be ADA/X or X/X pool
        const assetAIndex = relevantAssets.length === 2 ? 0 : 1;
        const assetBIndex = relevantAssets.length === 2 ? 1 : 2;
        const assetAQuantity = relevantAssets[assetAIndex].quantity;
        const assetBQuantity = relevantAssets[assetBIndex].quantity;
        const liquidityPool = new LiquidityPool(WingRiders.identifier, relevantAssets[assetAIndex].asset, relevantAssets[assetBIndex].asset, relevantAssets[assetAIndex].asset === 'lovelace'
            ? (assetAQuantity - MIN_POOL_ADA < 1000000n)
                ? assetAQuantity - MIN_POOL_ADA
                : assetAQuantity
            : assetAQuantity, relevantAssets[assetBIndex].asset === 'lovelace'
            ? (assetBQuantity - MIN_POOL_ADA < 1000000n)
                ? assetBQuantity - MIN_POOL_ADA
                : assetBQuantity
            : assetBQuantity, utxo.address, this.orderAddress, this.orderAddress);
        const lpTokenBalance = utxo.assetBalances.find((assetBalance) => {
            return assetBalance.asset !== 'lovelace'
                && assetBalance.asset.policyId === validityAsset.policyId
                && assetBalance.asset.nameHex !== validityAsset.nameHex;
        });
        if (lpTokenBalance) {
            liquidityPool.lpToken = lpTokenBalance.asset;
            liquidityPool.identifier = liquidityPool.lpToken.identifier();
            liquidityPool.totalLpTokens = MAX_INT - lpTokenBalance.quantity;
        }
        liquidityPool.poolFeePercent = 0.35;
        try {
            const builder = await (new DefinitionBuilder())
                .loadDefinition(pool);
            const datum = await provider.datumValue(utxo.datumHash);
            const parameters = builder.pullParameters(datum);
            liquidityPool.reserveA = typeof parameters.PoolAssetATreasury === 'number'
                ? (liquidityPool.reserveA - BigInt(parameters.PoolAssetATreasury))
                : liquidityPool.reserveA;
            liquidityPool.reserveB = typeof parameters.PoolAssetBTreasury === 'number'
                ? (liquidityPool.reserveB - BigInt(parameters.PoolAssetBTreasury))
                : liquidityPool.reserveB;
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
        return swapInNumerator / swapInDenominator;
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
        const swapOutTokenDecimals = tokensMatch(liquidityPool.assetA, swapInToken)
            ? (liquidityPool.assetB === 'lovelace' ? 6 : liquidityPool.assetB.decimals)
            : (liquidityPool.assetA === 'lovelace' ? 6 : liquidityPool.assetA.decimals);
        const estimatedReceive = this.estimatedReceive(liquidityPool, swapInToken, swapInAmount);
        const swapPrice = (Number(swapInAmount) / 10 ** (swapInToken === 'lovelace' ? 6 : swapInToken.decimals))
            / (Number(estimatedReceive) / 10 ** swapOutTokenDecimals);
        const poolPrice = tokensMatch(liquidityPool.assetA, swapInToken)
            ? liquidityPool.price
            : (1 / liquidityPool.price);
        return Math.abs(swapPrice - poolPrice)
            / ((swapPrice + poolPrice) / 2)
            * 100;
    }
    async buildSwapOrder(liquidityPool, swapParameters, spendUtxos = []) {
        const agentFee = this.swapOrderFees().find((fee) => fee.id === 'agentFee');
        const oil = this.swapOrderFees().find((fee) => fee.id === 'oil');
        if (!agentFee || !oil) {
            return Promise.reject('Parameters for datum are not set.');
        }
        const swapInToken = swapParameters.SwapInTokenPolicyId + swapParameters.SwapInTokenAssetName;
        const swapOutToken = swapParameters.SwapOutTokenPolicyId + swapParameters.SwapOutTokenAssetName;
        const swapDirection = [swapInToken, swapOutToken].sort((a, b) => {
            return a.localeCompare(b);
        })[0] === swapInToken ? 0 : 1;
        swapParameters = {
            ...swapParameters,
            [DatumParameterKey.Action]: swapDirection,
            [DatumParameterKey.Expiration]: new Date().getTime() + (60 * 60 * 6 * 1000),
            [DatumParameterKey.PoolAssetAPolicyId]: swapDirection === 0
                ? swapParameters.SwapInTokenPolicyId
                : swapParameters.SwapOutTokenPolicyId,
            [DatumParameterKey.PoolAssetAAssetName]: swapDirection === 0
                ? swapParameters.SwapInTokenAssetName
                : swapParameters.SwapOutTokenAssetName,
            [DatumParameterKey.PoolAssetBPolicyId]: swapDirection === 0
                ? swapParameters.SwapOutTokenPolicyId
                : swapParameters.SwapInTokenPolicyId,
            [DatumParameterKey.PoolAssetBAssetName]: swapDirection === 0
                ? swapParameters.SwapOutTokenAssetName
                : swapParameters.SwapInTokenAssetName,
        };
        const datumBuilder = new DefinitionBuilder();
        await datumBuilder.loadDefinition(order)
            .then((builder) => {
            builder.pushParameters(swapParameters);
        });
        return [
            this.buildSwapOrderPayment(swapParameters, {
                address: this.orderAddress,
                addressType: AddressType.Contract,
                assetBalances: [
                    {
                        asset: 'lovelace',
                        quantity: agentFee.value + oil.value,
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
            return utxo.address === this.orderAddress;
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
                id: 'agentFee',
                title: 'Agent Fee',
                description: 'WingRiders DEX employs decentralized Agents to ensure equal access, strict fulfillment ordering and protection to every party involved in exchange for a small fee.',
                value: 2000000n,
                isReturned: false,
            },
            {
                id: 'oil',
                title: 'Oil',
                description: 'A small amount of ADA has to be bundled with all token transfers on the Cardano Blockchain. We call this "Oil ADA" and it is always returned to the owner when the request gets fulfilled. If the request expires and the funds are reclaimed, the Oil ADA is returned as well.',
                value: 2000000n,
                isReturned: true,
            },
        ];
    }
}
WingRiders.identifier = 'WingRiders';
export { WingRiders };
