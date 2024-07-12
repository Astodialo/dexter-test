import { BaseApi } from './base-api';
import { Asset } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import axios from 'axios';
import { WingRiders } from '../wingriders';
import { appendSlash } from '../../utils';
export class WingRidersApi extends BaseApi {
    constructor(dex, requestConfig) {
        super();
        this.dex = dex;
        this.api = axios.create({
            timeout: requestConfig.timeout,
            baseURL: `${appendSlash(requestConfig.proxyUrl)}https://api.mainnet.wingriders.com/graphql`,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    liquidityPools(assetA, assetB) {
        return this.api.post('', {
            operationName: 'LiquidityPoolsWithMarketData',
            query: `
                query LiquidityPoolsWithMarketData($input: PoolsWithMarketdataInput) {
                    poolsWithMarketdata(input: $input) {
                        ...LiquidityPoolFragment
                    }
                }
                fragment LiquidityPoolFragment on PoolWithMarketdata {
                    issuedShareToken {
                        policyId
                        assetName
                        quantity
                    }
                    tokenA {
                        policyId
                        assetName
                        quantity
                    }
                    tokenB {
                        policyId
                        assetName
                        quantity
                    }
                    treasuryA
                    treasuryB
                    _utxo {
                        address
                    }
                }
            `,
            variables: {
                input: {
                    sort: true
                },
            },
        }).then((response) => {
            return response.data.data.poolsWithMarketdata.map((pool) => {
                const tokenA = pool.tokenA.policyId !== ''
                    ? new Asset(pool.tokenA.policyId, pool.tokenA.assetName)
                    : 'lovelace';
                const tokenB = pool.tokenB.policyId !== ''
                    ? new Asset(pool.tokenB.policyId, pool.tokenB.assetName)
                    : 'lovelace';
                let liquidityPool = new LiquidityPool(WingRiders.identifier, tokenA, tokenB, BigInt(pool.tokenA.quantity) - BigInt(pool.treasuryA), BigInt(pool.tokenB.quantity) - BigInt(pool.treasuryB), pool._utxo.address, this.dex.orderAddress, this.dex.orderAddress);
                liquidityPool.lpToken = new Asset(pool.issuedShareToken.policyId, pool.issuedShareToken.assetName);
                liquidityPool.poolFeePercent = 0.35;
                liquidityPool.identifier = liquidityPool.lpToken.identifier();
                liquidityPool.totalLpTokens = BigInt(pool.issuedShareToken.quantity);
                return liquidityPool;
            }).filter((pool) => pool !== undefined);
        });
    }
}
