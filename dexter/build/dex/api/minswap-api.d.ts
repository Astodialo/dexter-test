import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { Minswap } from '../minswap';
import { RequestConfig } from '../../types';
export declare class MinswapApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: Minswap;
    constructor(dex: Minswap, requestConfig: RequestConfig);
    liquidityPools(assetA: Token, assetB?: Token): Promise<LiquidityPool[]>;
    private poolsByPair;
    private liquidityPoolFromResponse;
    private decryptResponse;
}
