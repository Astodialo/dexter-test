export class LiquidityPool {
    constructor(dex, assetA, assetB, reserveA, reserveB, address, marketOrderAddress = '', limitOrderAddress = '') {
        this.identifier = '';
        this.poolFeePercent = 0;
        this.totalLpTokens = 0n;
        this.extra = {};
        this.dex = dex;
        this.assetA = assetA;
        this.assetB = assetB;
        this.reserveA = reserveA;
        this.reserveB = reserveB;
        this.address = address;
        this.marketOrderAddress = marketOrderAddress;
        this.limitOrderAddress = limitOrderAddress;
    }
    get uuid() {
        return `${this.dex}.${this.pair}.${this.identifier}`;
    }
    get pair() {
        const assetAName = this.assetA === 'lovelace' ? 'ADA' : this.assetA.assetName;
        const assetBName = this.assetB === 'lovelace' ? 'ADA' : this.assetB.assetName;
        return `${assetAName}/${assetBName}`;
    }
    get price() {
        const assetADecimals = this.assetA === 'lovelace' ? 6 : this.assetA.decimals;
        const assetBDecimals = this.assetB === 'lovelace' ? 6 : this.assetB.decimals;
        const adjustedReserveA = Number(this.reserveA) / (10 ** assetADecimals);
        const adjustedReserveB = Number(this.reserveB) / (10 ** assetBDecimals);
        return adjustedReserveA / adjustedReserveB;
    }
    get totalValueLocked() {
        const assetADecimals = this.assetA === 'lovelace' ? 6 : this.assetA.decimals;
        const assetBDecimals = this.assetB === 'lovelace' ? 6 : this.assetB.decimals;
        if (this.assetA === 'lovelace') {
            return (Number(this.reserveA) / 10 ** assetADecimals) + ((Number(this.reserveB) / 10 ** assetBDecimals) * this.price);
        }
        return ((Number(this.reserveA) / 10 ** assetADecimals) * this.price) * ((Number(this.reserveB) / 10 ** assetBDecimals) * (1 / this.price));
    }
}
