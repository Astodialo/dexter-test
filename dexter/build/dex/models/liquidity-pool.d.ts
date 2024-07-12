import { Asset, Token } from './asset';
export declare class LiquidityPool {
    dex: string;
    assetA: Token;
    assetB: Token;
    reserveA: bigint;
    reserveB: bigint;
    address: string;
    marketOrderAddress: string;
    limitOrderAddress: string;
    lpToken: Asset;
    poolNft: Asset;
    identifier: string;
    poolFeePercent: number;
    totalLpTokens: bigint;
    extra: any;
    constructor(dex: string, assetA: Token, assetB: Token, reserveA: bigint, reserveB: bigint, address: string, marketOrderAddress?: string, limitOrderAddress?: string);
    get uuid(): string;
    get pair(): string;
    get price(): number;
    get totalValueLocked(): number;
}
