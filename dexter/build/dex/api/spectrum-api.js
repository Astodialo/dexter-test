import { BaseApi } from './base-api';
import { Asset } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import axios from 'axios';
import { appendSlash, tokensMatch } from '../../utils';
import { Spectrum } from '../spectrum';
export class SpectrumApi extends BaseApi {
    constructor(dex, requestConfig) {
        super();
        this.dex = dex;
        this.api = axios.create({
            timeout: requestConfig.timeout,
            baseURL: `${appendSlash(requestConfig.proxyUrl)}https://analytics-balanced.spectrum.fi/cardano`,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    liquidityPools(assetA, assetB) {
        return this.api.get('/front/pools').then((response) => {
            return response.data.map((poolResponse) => {
                const tokenA = poolResponse.lockedX.asset.currencySymbol !== ''
                    ? new Asset(poolResponse.lockedX.asset.currencySymbol, Buffer.from(poolResponse.lockedX.asset.tokenName, 'utf8').toString('hex'))
                    : 'lovelace';
                const tokenB = poolResponse.lockedY.asset.currencySymbol !== ''
                    ? new Asset(poolResponse.lockedY.asset.currencySymbol, Buffer.from(poolResponse.lockedY.asset.tokenName, 'utf8').toString('hex'))
                    : 'lovelace';
                if (!tokensMatch(tokenA, assetA) || (assetB && !tokensMatch(tokenB, assetB))) {
                    return undefined;
                }
                let liquidityPool = new LiquidityPool(Spectrum.identifier, tokenA, tokenB, BigInt(poolResponse.lockedX.amount), BigInt(poolResponse.lockedY.amount), '', // Not supplied
                this.dex.orderAddress, this.dex.orderAddress);
                const [poolNftPolicyId, poolNftName] = poolResponse.id.split('.');
                liquidityPool.poolNft = new Asset(poolNftPolicyId, Buffer.from(poolNftName, 'utf8').toString('hex'));
                liquidityPool.lpToken = new Asset(poolResponse.lockedLQ.asset.currencySymbol, Buffer.from(poolResponse.lockedLQ.asset.tokenName, 'utf8').toString('hex'));
                liquidityPool.poolFeePercent = (1 - (poolResponse.poolFeeNum / poolResponse.poolFeeDenum)) * 100;
                liquidityPool.identifier = liquidityPool.lpToken.identifier();
                return liquidityPool;
            }).filter((pool) => pool !== undefined);
        });
    }
}
