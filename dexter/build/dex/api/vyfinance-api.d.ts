import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { VyFinance } from '../vyfinance';
import { RequestConfig } from '../../types';
export declare class VyfinanceApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: VyFinance;
    constructor(dex: VyFinance, requestConfig: RequestConfig);
    liquidityPools(assetA?: Token, assetB?: Token): Promise<LiquidityPool[]>;
}
