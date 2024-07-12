export class Asset {
    constructor(policyId, nameHex, decimals = 0) {
        this.policyId = policyId;
        this.nameHex = nameHex;
        this.decimals = decimals;
    }
    static fromIdentifier(id, decimals = 0) {
        id = id.replace('.', '');
        return new Asset(id.slice(0, 56), id.slice(56), decimals);
    }
    identifier(dilimeter = '') {
        return this.policyId + dilimeter + this.nameHex;
    }
    get assetName() {
        return Buffer.from(this.nameHex, 'hex').toString();
    }
}
