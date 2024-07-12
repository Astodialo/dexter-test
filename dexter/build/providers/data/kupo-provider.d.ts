import { BaseDataProvider } from './base-data-provider';
import { Asset } from '../../dex/models/asset';
import { AssetAddress, DefinitionField, KupoConfig, RequestConfig, Transaction, UTxO } from '../../types';
export declare class KupoProvider extends BaseDataProvider {
    private _config;
    private _kupoApi;
    private _requestConfig;
    constructor(config: KupoConfig, requestConfig?: RequestConfig);
    utxos(address: string, asset?: Asset): Promise<UTxO[]>;
    transactionUtxos(txHash: string): Promise<UTxO[]>;
    datumValue(datumHash: string): Promise<DefinitionField>;
    assetTransactions(asset: Asset): Promise<Transaction[]>;
    assetAddresses(asset: Asset): Promise<AssetAddress[]>;
    private toUtxos;
    private toDefinitionDatum;
}
