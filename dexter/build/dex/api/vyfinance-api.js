import { BaseApi } from './base-api';
import { Asset } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import axios from 'axios';
import { VyFinance } from '../vyfinance';
import { appendSlash } from '../../utils';
export class VyfinanceApi extends BaseApi {
    constructor(dex, requestConfig) {
        super();
        this.dex = dex;
        this.api = axios.create({
            timeout: requestConfig.timeout,
            baseURL: `${appendSlash(requestConfig.proxyUrl)}https://api.vyfi.io`,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    liquidityPools(assetA, assetB) {
        const assetAId = (assetA && assetA !== 'lovelace')
            ? assetA.identifier()
            : 'lovelace';
        let assetBId = (assetB && assetB !== 'lovelace')
            ? assetB.identifier()
            : 'lovelace';
        const url = assetA && assetB
            ? `/lp?networkId=1&v2=true&tokenAUnit=${assetAId}&tokenBUnit=${assetBId}`
            : '/lp?networkId=1&v2=true';
        return this.api.get(url)
            .then((poolResponse) => {
            return poolResponse.data.map((pool) => {
                const poolDetails = JSON.parse(pool.json);
                const tokenA = poolDetails['aAsset']['tokenName']
                    ? new Asset(poolDetails['aAsset']['currencySymbol'], Buffer.from(poolDetails['aAsset']['tokenName']).toString('hex'))
                    : 'lovelace';
                const tokenB = poolDetails['bAsset']['tokenName']
                    ? new Asset(poolDetails['bAsset']['currencySymbol'], Buffer.from(poolDetails['bAsset']['tokenName']).toString('hex'))
                    : 'lovelace';
                let liquidityPool = new LiquidityPool(VyFinance.identifier, tokenA, tokenB, BigInt(pool['tokenAQuantity'] ?? 0), BigInt(pool['tokenBQuantity'] ?? 0), pool['poolValidatorUtxoAddress'], pool['orderValidatorUtxoAddress'], pool['orderValidatorUtxoAddress']);
                const lpTokenDetails = pool['lpPolicyId-assetId'].split('-');
                liquidityPool.lpToken = new Asset(lpTokenDetails[0], lpTokenDetails[1]);
                liquidityPool.poolFeePercent = (poolDetails['feesSettings']['barFee'] + poolDetails['feesSettings']['liqFee']) / 100;
                liquidityPool.identifier = liquidityPool.lpToken.identifier();
                liquidityPool.extra.nft = new Asset(poolDetails['mainNFT']['currencySymbol'], poolDetails['mainNFT']['tokenName']);
                return liquidityPool;
            }).filter((pool) => pool !== undefined);
        }).catch((e) => {
            console.error(e);
            return [];
        });
    }
}
