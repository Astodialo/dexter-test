import { LiquidityPool } from './models/liquidity-pool';
import { BaseDataProvider } from '../providers/data/base-data-provider';
import { Token } from './models/asset';
import { DatumParameters, PayToAddress, SpendUTxO, SwapFee, UTxO } from '../types';
import { BaseApi } from './api/base-api';
export declare abstract class BaseDex {
    /**
     * API connection for the DEX.
     */
    abstract readonly api: BaseApi;
    /**
     * Fetch addresses mapped to a liquidity pool.
     */
    abstract liquidityPoolAddresses(provider: BaseDataProvider): Promise<string[]>;
    /**
     * Fetch all liquidity pools.
     */
    abstract liquidityPools(provider: BaseDataProvider): Promise<LiquidityPool[]>;
    /**
     * Craft liquidity pool state from a valid UTxO.
     */
    abstract liquidityPoolFromUtxo(provider: BaseDataProvider, utxo: UTxO): Promise<LiquidityPool | undefined>;
    /**
     * Estimated swap in amount given for a swap out token & amount on a liquidity pool.
     */
    abstract estimatedGive(liquidityPool: LiquidityPool, swapOutToken: Token, swapOutAmount: bigint): bigint;
    /**
     * Estimated swap out amount received for a swap in token & amount on a liquidity pool.
     */
    abstract estimatedReceive(liquidityPool: LiquidityPool, swapInToken: Token, swapInAmount: bigint): bigint;
    /**
     * Calculated price impact after for swap order.
     */
    abstract priceImpactPercent(liquidityPool: LiquidityPool, swapInToken: Token, swapInAmount: bigint): number;
    /**
     * Craft a swap order for this DEX.
     */
    abstract buildSwapOrder(liquidityPool: LiquidityPool, swapParameters: DatumParameters, spendUtxos?: SpendUTxO[]): Promise<PayToAddress[]>;
    /**
     * Craft a swap order cancellation for this DEX.
     */
    abstract buildCancelSwapOrder(txOutputs: UTxO[], returnAddress: string): Promise<PayToAddress[]>;
    /**
     * Fees associated with submitting a swap order.
     */
    abstract swapOrderFees(): SwapFee[];
    /**
     * Adjust the payment for the DEX order address to include the swap in amount.
     */
    protected buildSwapOrderPayment(swapParameters: DatumParameters, orderPayment: PayToAddress): PayToAddress;
}
