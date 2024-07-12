import { LiquidityPool } from '../dex/models/liquidity-pool';
import { Token } from '../dex/models/asset';
import { Dexter } from '../dexter';
import { SwapFee, SwapInAmountMapping, SwapOutAmountMapping, UTxO } from '../types';
import { DexTransaction } from '../dex/models/dex-transaction';
import { SwapRequest } from './swap-request';
export declare class SplitSwapRequest {
    private _dexter;
    private _swapRequests;
    private _swapInToken;
    private _swapOutToken;
    private _slippagePercent;
    constructor(dexter: Dexter);
    get liquidityPools(): LiquidityPool[];
    get swapRequests(): SwapRequest[];
    get swapInToken(): Token;
    get swapOutToken(): Token;
    get swapInAmount(): bigint;
    get slippagePercent(): number;
    flip(): SplitSwapRequest;
    withSwapInToken(swapInToken: Token): SplitSwapRequest;
    withSwapOutToken(swapOutToken: Token): SplitSwapRequest;
    withSwapInAmountMappings(mappings: SwapInAmountMapping[]): SplitSwapRequest;
    withSwapOutAmountMappings(mappings: SwapOutAmountMapping[]): SplitSwapRequest;
    withSlippagePercent(slippagePercent: number): SplitSwapRequest;
    withUtxos(utxos: UTxO[]): SplitSwapRequest;
    getEstimatedReceive(): bigint;
    getMinimumReceive(): bigint;
    getAvgPriceImpactPercent(): number;
    getSwapFees(): SwapFee[];
    submit(): DexTransaction;
    private sendSplitSwapOrder;
    private isValidLiquidityPoolMappings;
}