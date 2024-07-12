import { Token } from './dex/models/asset';
import { LiquidityPool } from './dex/models/liquidity-pool';
export declare function tokensMatch(tokenA: Token, tokenB: Token): boolean;
export declare function correspondingReserves(liquidityPool: LiquidityPool, token: Token): bigint[];
export declare function appendSlash(value?: string): string | undefined;
