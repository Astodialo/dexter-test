import { BaseDataProvider } from './providers/data/base-data-provider';
import { AvailableDexs, DexterConfig, RequestConfig } from './types';
import { SwapRequest } from './requests/swap-request';
import { BaseWalletProvider } from './providers/wallet/base-wallet-provider';
import { BaseDex } from './dex/base-dex';
import { BaseMetadataProvider } from './providers/asset-metadata/base-metadata-provider';
import { CancelSwapRequest } from './requests/cancel-swap-request';
import { FetchRequest } from './requests/fetch-request';
import { SplitSwapRequest } from './requests/split-swap-request';
import { SplitCancelSwapRequest } from './requests/split-cancel-swap-request';
export declare class Dexter {
    config: DexterConfig;
    requestConfig: RequestConfig;
    dataProvider?: BaseDataProvider;
    walletProvider?: BaseWalletProvider;
    metadataProvider: BaseMetadataProvider;
    availableDexs: AvailableDexs;
    constructor(config?: DexterConfig, requestConfig?: RequestConfig);
    /**
     * Retrieve DEX instance from unique name.
     */
    dexByName(name: string): BaseDex | undefined;
    /**
     * Switch to a new data provider.
     */
    withDataProvider(dataProvider: BaseDataProvider): Dexter;
    /**
     * Switch to a new wallet provider.
     */
    withWalletProvider(walletProvider: BaseWalletProvider): Dexter;
    /**
     * Switch to a new asset metadata provider.
     */
    withMetadataProvider(metadataProvider: BaseMetadataProvider): Dexter;
    /**
     * New request for data fetching.
     */
    newFetchRequest(): FetchRequest;
    /**
     * New request for a swap order.
     */
    newSwapRequest(): SwapRequest;
    /**
     * New request for a split swap order.
     */
    newSplitSwapRequest(): SplitSwapRequest;
    /**
     * New request for cancelling a swap order.
     */
    newCancelSwapRequest(): CancelSwapRequest;
    /**
     * New request for a split cancel swap order.
     */
    newSplitCancelSwapRequest(): SplitCancelSwapRequest;
}
