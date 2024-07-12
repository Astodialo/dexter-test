import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { MuesliSwap } from '../muesliswap';
import { RequestConfig } from '../../types';
export declare class MuesliSwapApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: MuesliSwap;
    constructor(dex: MuesliSwap, requestConfig: RequestConfig);
    liquidityPools(assetA: Token, assetB?: Token): Promise<LiquidityPool[]>;
}
