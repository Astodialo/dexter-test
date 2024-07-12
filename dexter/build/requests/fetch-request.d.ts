import { Token } from '../dex/models/asset';
import { LiquidityPool } from '../dex/models/liquidity-pool';
import { Dexter } from '../dexter';
import { BaseDataProvider } from '../providers/data/base-data-provider';
export declare class FetchRequest {
    private _dexter;
    private _onDexs;
    private _dexDataProviders;
    private _filteredTokens;
    private _filteredPairs;
    constructor(dexter: Dexter);
    /**
     * Set the DEX(s) Dexter will fetch data on.
     */
    onDexs(dexs: string | string[]): FetchRequest;
    /**
     * Fetch data on all available DEXs.
     */
    onAllDexs(): FetchRequest;
    /**
     * Force a data provider for a DEX.
     */
    setDataProviderForDex(dexName: string, provider: BaseDataProvider | undefined): FetchRequest;
    /**
     * Only fetch pools containing these tokens.
     */
    forTokens(tokens: Token[]): FetchRequest;
    /**
     * Only fetch pools containing these token pairs.
     */
    forTokenPairs(tokenPairs: Array<Token[]>): FetchRequest;
    /**
     * Fetch latest state for a liquidity pool.
     */
    getLiquidityPoolState(liquidityPool: LiquidityPool): Promise<LiquidityPool>;
    /**
     * Fetch all liquidity pools matching token filters.
     */
    getLiquidityPools(): Promise<LiquidityPool[]>;
    /**
     * Fetch historic states for a liquidity pool.
     */
    getLiquidityPoolHistory(liquidityPool: LiquidityPool): Promise<LiquidityPool[]>;
    /**
     * Fetch asset metadata for the assets in the provided liquidity pools.
     */
    private fetchAssetMetadata;
    /**
     * Check if a pools assets match the supplied token filters.
     */
    private poolMatchesFilter;
    /**
     * Fetch liquidity pools from DEX APIs using the provided token filters.
     */
    private fetchPoolsFromApi;
}
