import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { RequestConfig } from '../../types';
import { TeddySwap } from '../teddyswap';
export declare class TeddyswapApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: TeddySwap;
    constructor(dex: TeddySwap, requestConfig: RequestConfig);
    liquidityPools(assetA: Token, assetB?: Token): Promise<LiquidityPool[]>;
}
