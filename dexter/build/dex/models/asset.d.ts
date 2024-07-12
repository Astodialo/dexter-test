export declare class Asset {
    policyId: string;
    nameHex: string;
    decimals: number;
    constructor(policyId: string, nameHex: string, decimals?: number);
    static fromIdentifier(id: string, decimals?: number): Asset;
    identifier(dilimeter?: '' | '.'): string;
    get assetName(): string;
}
export type Token = Asset | 'lovelace';
