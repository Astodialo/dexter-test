import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { SundaeSwap } from '../sundaeswap';
import { RequestConfig } from '../../types';
export declare class SundaeSwapApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: SundaeSwap;
    constructor(dex: SundaeSwap, requestConfig: RequestConfig);
    liquidityPools(assetA: Token, assetB?: Token): Promise<LiquidityPool[]>;
}
