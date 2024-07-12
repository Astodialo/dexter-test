import { AssetMetadata, RequestConfig } from '../../types';
import { Asset } from '../../dex/models/asset';
import { BaseMetadataProvider } from './base-metadata-provider';
export declare class TokenRegistryProvider extends BaseMetadataProvider {
    private _api;
    private _requestConfig;
    /**
     * https://input-output-hk.github.io/offchain-metadata-tools/api/latest/
     */
    constructor(requestConfig?: RequestConfig);
    /**
     * https://input-output-hk.github.io/offchain-metadata-tools/api/latest/#tag/query/paths/~1metadata~1query/post
     */
    fetch(assets: Asset[]): Promise<AssetMetadata[]>;
}
