import { LiquidityPool } from './models/liquidity-pool';
import { BaseDex } from './base-dex';
import { DefinitionBuilder } from '../definition-builder';
import { AddressType, DatumParameterKey } from '../constants';
import pool from './definitions/spectrum/pool';
import order from './definitions/spectrum/order';
import { correspondingReserves, tokensMatch } from '../utils';
import { SpectrumApi } from './api/spectrum-api';
const MAX_INT = 9223372036854775807n;
class Spectrum extends BaseDex {
    constructor(requestConfig = {}) {
        super();
        /**
         * On-Chain constants.
         */
        this.orderAddress = 'addr1wynp362vmvr8jtc946d3a3utqgclfdl5y9d3kn849e359hsskr20n';
        this.cancelDatum = 'd8799f00000001ff';
        this.orderScript = {
            type: 'PlutusV2',
            script: '5904f901000032323232323232323232323232323232323232323222253330143232323232323232323232323232323232323232323232323232323253330303370e90010010991919299981999b8753330333370e6eb4c0d0c0d403d2000148000520024800054cc090cdc399814805181a00e240042a66048664466ebcdd3981c0011ba730380013034004303400815330243370e666064444a666060002200426600666e00009200230380014800004d20041533024337126eb4c0d0c0d405800854cc0900044cccc8888cdc499b833370466e08cc0b403800c008004cdc019b823302d00e004483403ccdc100100099b8000648008c0d0078c0d0074dd6981a00b1bad303401b13322332303522533303200114a02a66607066ebcc0e400400c52889801181d0009ba90010023758606864606c606c606c606c606c002606a0286eb8c0d00614cc8cc0cc00452899191929981319b8f375c606c606e0046eb8c0d8c0dc0044cdc79bae3036002375c606c002606e04e606c002606603826666644444646466e24cdc099b81302900d375a00266e0ccdc10028020019814809a99981c191929981599b8f375c607660780046eb8c0ecc0f00044cdc79bae303b002375c60760026078058607600c26ea00144004dd424000606603a6eb4c0cc054004dd6981980c9bad303301853330313232325330253371e6eb8c0d4c0d8008dd7181a981b000899b8f375c606a0046eb8c0d4004c0d8098c0d4004c0c806c4cdc199b82001375a606402e66e04dd6981900b9bad30320181001337026604c01460620346604c00860620342c606600460540026ea8c0b8c0bc064dd599181718179818000981698170009817000998139bad302b00700a37566460566058605a002605460560026056002660486eb4c0a001401ccc88c8c8c94ccc0acc8c8c94ccc0b8cdc3a40040042646464a66606266e1d200000214a0266ebcdd38021ba70013034002302b001375400e2646464a66606266e1d200200214a0266ebcdd38021ba70013034002302b001375400e606200460500026ea8004400858c8c8c8c8c94ccc0bccdc3a4000004264646464a66606666e1d200000213232323253330373370e90010010b099ba548000004c0e8008c0c4004dd5000981a0008b181b00118168009baa001303000113374a9001015181900118148009baa001302c302d302e001302b302d0053756646464a66605866e1d2002002161533302c3371e6eb8c0b40040184c0b4c0b8c0bc01c58c0bc008c098004dd50009918151816000981498158019bae302700b302700a33022375a604c002008604c002604a002604a0206eb0c088008dd61810801181098108009810980f805180f800980f000980e800980e000980d800980d000980c800980c000980c002180b8008a4c2c4a66601600229000099980899baf300d3012001375200c6eb4c054c048dd5980a9809000a4000446660220040020062940cdd2a4000660026ea4008cc004dd48010042ba0489002232333004003375c601c0026eb8c038c03c004c03c004888cccc01000920002333300500248001d69bab00100323002375200244446601444a66600e002200a2a66601a66ebcc024c0380040184c010c044c0380044c008c03c00400555cfa5eb8155ce91299980299b8800248000584cc00c008004c0048894ccc014cdc3801240002600c00226600666e04009200230070012323002233002002001230022330020020015734ae855d1118011baa0015573c1',
        };
        this.api = new SpectrumApi(this, requestConfig);
    }
    async liquidityPoolAddresses(provider) {
        return Promise.resolve([
            'addr1x94ec3t25egvhqy2n265xfhq882jxhkknurfe9ny4rl9k6dj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrst84slu',
            'addr1x8nz307k3sr60gu0e47cmajssy4fmld7u493a4xztjrll0aj764lvrxdayh2ux30fl0ktuh27csgmpevdu89jlxppvrswgxsta',
        ]);
    }
    async liquidityPools(provider) {
        const poolAddresses = await this.liquidityPoolAddresses(provider);
        const addressPromises = poolAddresses.map(async (address) => {
            const utxos = await provider.utxos(address);
            return await Promise.all(utxos.map(async (utxo) => {
                return await this.liquidityPoolFromUtxo(provider, utxo);
            })).then((liquidityPools) => {
                return liquidityPools.filter((liquidityPool) => {
                    return liquidityPool !== undefined;
                });
            });
        });
        return Promise.all(addressPromises).then((liquidityPools) => liquidityPools.flat());
    }
    async liquidityPoolFromUtxo(provider, utxo) {
        if (!utxo.datumHash) {
            return Promise.resolve(undefined);
        }
        const relevantAssets = utxo.assetBalances.filter((assetBalance) => {
            const assetName = assetBalance.asset === 'lovelace' ? 'lovelace' : assetBalance.asset.assetName;
            return !assetName?.toLowerCase()?.endsWith('_nft')
                && !assetName?.toLowerCase()?.endsWith('_identity')
                && !assetName?.toLowerCase()?.endsWith('_lq');
        });
        // Irrelevant UTxO
        if (![2, 3].includes(relevantAssets.length)) {
            return Promise.resolve(undefined);
        }
        // Could be ADA/X or X/X pool
        const assetAIndex = relevantAssets.length === 2 ? 0 : 1;
        const assetBIndex = relevantAssets.length === 2 ? 1 : 2;
        const liquidityPool = new LiquidityPool(Spectrum.identifier, relevantAssets[assetAIndex].asset, relevantAssets[assetBIndex].asset, relevantAssets[assetAIndex].quantity, relevantAssets[assetBIndex].quantity, utxo.address, this.orderAddress, this.orderAddress);
        try {
            const builder = await new DefinitionBuilder().loadDefinition(pool);
            const datum = await provider.datumValue(utxo.datumHash);
            const parameters = builder.pullParameters(datum);
            const [lpTokenPolicyId, lpTokenAssetName] = typeof parameters.LpTokenPolicyId === 'string' && typeof parameters.LpTokenAssetName === 'string'
                ? [parameters.LpTokenPolicyId, parameters.LpTokenAssetName]
                : [null, null];
            const lpTokenBalance = utxo.assetBalances.find((assetBalance) => {
                return assetBalance.asset !== 'lovelace'
                    && assetBalance.asset.policyId === lpTokenPolicyId
                    && assetBalance.asset.nameHex === lpTokenAssetName;
            });
            const nftToken = utxo.assetBalances.find((assetBalance) => {
                return assetBalance.asset.assetName?.toLowerCase()?.endsWith('_nft');
            })?.asset;
            if (!lpTokenBalance || !nftToken) {
                return Promise.resolve(undefined);
            }
            liquidityPool.poolNft = nftToken;
            liquidityPool.lpToken = lpTokenBalance.asset;
            liquidityPool.totalLpTokens = MAX_INT - lpTokenBalance.quantity;
            liquidityPool.identifier = liquidityPool.lpToken.identifier();
            liquidityPool.poolFeePercent = typeof parameters.LpFee === 'number' ? (1000 - parameters.LpFee) / 10 : 0.3;
        }
        catch (e) {
            return liquidityPool;
        }
        return liquidityPool;
    }
    estimatedGive(liquidityPool, swapOutToken, swapOutAmount) {
        const [reserveOut, reserveIn] = correspondingReserves(liquidityPool, swapOutToken);
        const receive = (reserveIn * reserveOut) / (reserveOut - swapOutAmount) - reserveIn;
        const swapFee = ((receive * BigInt(Math.floor(liquidityPool.poolFeePercent * 100))) + BigInt(10000) - 1n) / 10000n;
        return receive + swapFee;
    }
    estimatedReceive(liquidityPool, swapInToken, swapInAmount) {
        const [reserveIn, reserveOut] = correspondingReserves(liquidityPool, swapInToken);
        const swapFee = ((swapInAmount * BigInt(Math.floor(liquidityPool.poolFeePercent * 100))) + BigInt(10000) - 1n) / 10000n;
        return reserveOut - (reserveIn * reserveOut) / (reserveIn + swapInAmount - swapFee);
    }
    priceImpactPercent(liquidityPool, swapInToken, swapInAmount) {
        const reserveIn = tokensMatch(swapInToken, liquidityPool.assetA)
            ? liquidityPool.reserveA
            : liquidityPool.reserveB;
        return (1 - (Number(reserveIn) / Number(reserveIn + swapInAmount))) * 100;
    }
    async buildSwapOrder(liquidityPool, swapParameters, spendUtxos = []) {
        const batcherFee = this.swapOrderFees().find((fee) => fee.id === 'batcherFee');
        const deposit = this.swapOrderFees().find((fee) => fee.id === 'deposit');
        const minReceive = swapParameters.MinReceive;
        if (!batcherFee || !deposit || !minReceive) {
            return Promise.reject('Parameters for datum are not set.');
        }
        if (!liquidityPool.poolNft) {
            return Promise.reject('Pool NFT is required.');
        }
        const decimalToFractionalImproved = (decimalValue) => {
            const [whole, decimals = ''] = decimalValue.toString()?.split('.');
            let truncatedDecimals = decimals.slice(0, 15);
            const denominator = BigInt(10 ** truncatedDecimals.length);
            const numerator = BigInt(whole) * denominator + BigInt(decimals);
            return [numerator, denominator];
        };
        const batcherFeeForToken = Number(batcherFee.value) / Number(minReceive);
        const [numerator, denominator] = decimalToFractionalImproved(batcherFeeForToken);
        const lpfee = BigInt(1000 - Math.floor(liquidityPool.poolFeePercent * 10));
        swapParameters = {
            ...swapParameters,
            [DatumParameterKey.TokenPolicyId]: liquidityPool.poolNft.policyId,
            [DatumParameterKey.TokenAssetName]: liquidityPool.poolNft.nameHex,
            [DatumParameterKey.LpFee]: lpfee,
            [DatumParameterKey.LpFeeNumerator]: numerator,
            [DatumParameterKey.LpFeeDenominator]: denominator,
        };
        const datumBuilder = new DefinitionBuilder();
        await datumBuilder.loadDefinition(order).then((builder) => {
            builder.pushParameters(swapParameters);
        });
        return [
            this.buildSwapOrderPayment(swapParameters, {
                address: this.orderAddress,
                addressType: AddressType.Contract,
                assetBalances: [
                    {
                        asset: 'lovelace',
                        quantity: batcherFee?.value + deposit.value,
                    },
                ],
                datum: datumBuilder.getCbor(),
                isInlineDatum: true,
                spendUtxos: spendUtxos,
            }),
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
        const networkFee = 0.5;
        const reward = 1;
        const minNitro = 1.2;
        const batcherFee = (reward + networkFee) * minNitro;
        const batcherFeeInAda = BigInt(Math.round(batcherFee * 10 ** 6));
        return [
            {
                id: 'batcherFee',
                title: 'Batcher Fee',
                description: 'Fee paid for the service of off-chain batcher to process transactions.',
                value: batcherFeeInAda,
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
Spectrum.identifier = 'Spectrum';
export { Spectrum };
