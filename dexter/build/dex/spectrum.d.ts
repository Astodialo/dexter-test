import { LiquidityPool } from './models/liquidity-pool';
import { BaseDataProvider } from '../providers/data/base-data-provider';
import { Token } from './models/asset';
import { BaseDex } from './base-dex';
import { DatumParameters, PayToAddress, RequestConfig, SpendUTxO, SwapFee, UTxO } from '../types';
import { BaseApi } from './api/base-api';
import { Script } from 'lucid-cardano';
export declare class Spectrum extends BaseDex {
    static readonly identifier: string;
    readonly api: BaseApi;
    /**
     * On-Chain constants.
     */
    readonly orderAddress: string;
    readonly cancelDatum: string;
    readonly orderScript: Script;
    constructor(requestConfig?: RequestConfig);
    liquidityPoolAddresses(provider: BaseDataProvider): Promise<string[]>;
    liquidityPools(provider: BaseDataProvider): Promise<LiquidityPool[]>;
    liquidityPoolFromUtxo(provider: BaseDataProvider, utxo: UTxO): Promise<LiquidityPool | undefined>;
    estimatedGive(liquidityPool: LiquidityPool, swapOutToken: Token, swapOutAmount: bigint): bigint;
    estimatedReceive(liquidityPool: LiquidityPool, swapInToken: Token, swapInAmount: bigint): bigint;
    priceImpactPercent(liquidityPool: LiquidityPool, swapInToken: Token, swapInAmount: bigint): number;
    buildSwapOrder(liquidityPool: LiquidityPool, swapParameters: DatumParameters, spendUtxos?: SpendUTxO[]): Promise<PayToAddress[]>;
    buildCancelSwapOrder(txOutputs: UTxO[], returnAddress: string): Promise<PayToAddress[]>;
    swapOrderFees(): SwapFee[];
}
