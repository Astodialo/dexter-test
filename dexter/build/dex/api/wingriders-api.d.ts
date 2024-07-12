import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { RequestConfig } from '../../types';
import { WingRiders } from '../wingriders';
export declare class WingRidersApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: WingRiders;
    constructor(dex: WingRiders, requestConfig: RequestConfig);
    liquidityPools(assetA: Token, assetB?: Token): Promise<LiquidityPool[]>;
}
