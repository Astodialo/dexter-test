import { BaseApi } from './base-api';
import { Token } from '../models/asset';
import { LiquidityPool } from '../models/liquidity-pool';
import { AxiosInstance } from 'axios';
import { RequestConfig } from '../../types';
import { Spectrum } from '../spectrum';
export declare class SpectrumApi extends BaseApi {
    protected readonly api: AxiosInstance;
    protected readonly dex: Spectrum;
    constructor(dex: Spectrum, requestConfig: RequestConfig);
    liquidityPools(assetA: Token, assetB?: Token): Promise<LiquidityPool[]>;
}
