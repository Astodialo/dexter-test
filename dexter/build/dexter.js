import { Minswap } from './dex/minswap';
import { SundaeSwap } from './dex/sundaeswap';
import { MuesliSwap } from './dex/muesliswap';
import { WingRiders } from './dex/wingriders';
import { SwapRequest } from './requests/swap-request';
import { VyFinance } from './dex/vyfinance';
import { TokenRegistryProvider } from './providers/asset-metadata/token-registry-provider';
import { CancelSwapRequest } from './requests/cancel-swap-request';
import { FetchRequest } from './requests/fetch-request';
import axios from "axios";
import axiosRetry from "axios-retry";
import { SplitSwapRequest } from './requests/split-swap-request';
import { TeddySwap } from './dex/teddyswap';
import { Spectrum } from './dex/spectrum';
import { SplitCancelSwapRequest } from './requests/split-cancel-swap-request';
export class Dexter {
    constructor(config = {}, requestConfig = {}) {
        this.config = Object.assign({}, {
            shouldFetchMetadata: true,
            shouldFallbackToApi: true,
            shouldSubmitOrders: false,
            metadataMsgBranding: 'Dexter',
        }, config);
        this.requestConfig = Object.assign({}, {
            timeout: 5000,
            proxyUrl: '',
            retries: 3,
        }, requestConfig);
        // Axios configurations
        axiosRetry(axios, { retries: this.requestConfig.retries });
        axios.defaults.timeout = this.requestConfig.timeout;
        this.metadataProvider = new TokenRegistryProvider(this.requestConfig);
        this.availableDexs = {
            [Minswap.identifier]: new Minswap(this.requestConfig),
            [SundaeSwap.identifier]: new SundaeSwap(this.requestConfig),
            [MuesliSwap.identifier]: new MuesliSwap(this.requestConfig),
            [WingRiders.identifier]: new WingRiders(this.requestConfig),
            [VyFinance.identifier]: new VyFinance(this.requestConfig),
            [TeddySwap.identifier]: new TeddySwap(this.requestConfig),
            [Spectrum.identifier]: new Spectrum(this.requestConfig),
        };
    }
    /**
     * Retrieve DEX instance from unique name.
     */
    dexByName(name) {
        return this.availableDexs[name];
    }
    /**
     * Switch to a new data provider.
     */
    withDataProvider(dataProvider) {
        this.dataProvider = dataProvider;
        return this;
    }
    /**
     * Switch to a new wallet provider.
     */
    withWalletProvider(walletProvider) {
        this.walletProvider = walletProvider;
        return this;
    }
    /**
     * Switch to a new asset metadata provider.
     */
    withMetadataProvider(metadataProvider) {
        this.metadataProvider = metadataProvider;
        return this;
    }
    /**
     * New request for data fetching.
     */
    newFetchRequest() {
        return new FetchRequest(this);
    }
    /**
     * New request for a swap order.
     */
    newSwapRequest() {
        return new SwapRequest(this);
    }
    /**
     * New request for a split swap order.
     */
    newSplitSwapRequest() {
        return new SplitSwapRequest(this);
    }
    /**
     * New request for cancelling a swap order.
     */
    newCancelSwapRequest() {
        if (!this.walletProvider) {
            throw new Error('Wallet provider must be set before requesting a cancel order.');
        }
        if (!this.walletProvider.isWalletLoaded) {
            throw new Error('Wallet must be loaded before requesting a cancel order.');
        }
        return new CancelSwapRequest(this);
    }
    /**
     * New request for a split cancel swap order.
     */
    newSplitCancelSwapRequest() {
        if (!this.walletProvider) {
            throw new Error('Wallet provider must be set before requesting a split cancel order.');
        }
        if (!this.walletProvider.isWalletLoaded) {
            throw new Error('Wallet must be loaded before requesting a split cancel order.');
        }
        return new SplitCancelSwapRequest(this);
    }
}
