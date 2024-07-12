import { Asset } from '../dex/models/asset';
import { tokensMatch } from "../utils";
export class FetchRequest {
    constructor(dexter) {
        this._filteredTokens = [];
        this._filteredPairs = [];
        this._dexter = dexter;
        this._onDexs = dexter.availableDexs;
        this._dexDataProviders = new Map();
        if (dexter.dataProvider) {
            Object.keys(dexter.availableDexs).forEach((dexName) => {
                this._dexDataProviders.set(dexName, dexter.dataProvider);
            });
        }
    }
    /**
     * Set the DEX(s) Dexter will fetch data on.
     */
    onDexs(dexs) {
        this._onDexs = {};
        (Array.isArray(dexs) ? dexs : [dexs]).forEach((dexName) => {
            if (!Object.keys(this._dexter.availableDexs).includes(dexName)) {
                throw new Error(`DEX ${dexName} is not available.`);
            }
            this._onDexs[dexName] = this._dexter.availableDexs[dexName];
        });
        return this;
    }
    /**
     * Fetch data on all available DEXs.
     */
    onAllDexs() {
        this._onDexs = this._dexter.availableDexs;
        return this;
    }
    /**
     * Force a data provider for a DEX.
     */
    setDataProviderForDex(dexName, provider) {
        // Force API usage
        if (!provider) {
            this._dexDataProviders.delete(dexName);
            return this;
        }
        this._dexDataProviders.set(dexName, provider);
        return this;
    }
    /**
     * Only fetch pools containing these tokens.
     */
    forTokens(tokens) {
        this._filteredTokens = tokens;
        return this;
    }
    /**
     * Only fetch pools containing these token pairs.
     */
    forTokenPairs(tokenPairs) {
        tokenPairs.forEach((pair) => {
            if (pair.length !== 2) {
                throw new Error('Token pair must contain two tokens.');
            }
            if (tokensMatch(pair[0], pair[1])) {
                throw new Error('Provided pair contains the same tokens. Ensure each pair has differing tokens.');
            }
        });
        this._filteredPairs = tokenPairs;
        return this;
    }
    /**
     * Fetch latest state for a liquidity pool.
     */
    getLiquidityPoolState(liquidityPool) {
        if (!liquidityPool) {
            return Promise.reject('Invalid liquidity pool provided.');
        }
        const dexInstance = this._dexter.dexByName(liquidityPool.dex);
        if (!dexInstance) {
            return Promise.reject('Unable to determine DEX from the provided liquidity pool.');
        }
        let liquidityPoolPromises;
        const dexDataProvider = this._dexDataProviders.get(liquidityPool.dex);
        if (dexDataProvider) {
            if (!liquidityPool.address) {
                return Promise.reject('Liquidity pool must have a set address.');
            }
            const filterableAsset = liquidityPool.assetA === 'lovelace'
                ? liquidityPool.assetB
                : liquidityPool.assetA;
            liquidityPoolPromises = dexDataProvider.utxos(liquidityPool.address, filterableAsset)
                .then(async (utxos) => {
                return await Promise.all(utxos.map(async (utxo) => {
                    return await dexInstance.liquidityPoolFromUtxo(dexDataProvider, utxo);
                })).then((liquidityPools) => {
                    return liquidityPools.filter((liquidityPool) => {
                        return liquidityPool !== undefined;
                    });
                });
            });
        }
        else {
            liquidityPoolPromises = dexInstance.api.liquidityPools(liquidityPool.assetA, liquidityPool.assetB);
        }
        return liquidityPoolPromises
            .then(async (liquidityPools) => {
            const possiblePools = liquidityPools.filter((pool) => {
                return pool !== undefined && pool.uuid === liquidityPool.uuid;
            });
            if (possiblePools.length > 1) {
                return Promise.reject('Encountered more than 1 possible pool state.');
            }
            if (this._dexter.config.shouldFetchMetadata) {
                await this.fetchAssetMetadata(possiblePools);
            }
            return possiblePools[0];
        });
    }
    /**
     * Fetch all liquidity pools matching token filters.
     */
    getLiquidityPools() {
        const liquidityPoolPromises = Object.entries(this._onDexs).map(([dexName, dexInstance]) => {
            const dexDataProvider = this._dexDataProviders.get(dexName);
            if (!dexDataProvider) {
                return this.fetchPoolsFromApi(dexInstance);
            }
            return dexInstance.liquidityPools(dexDataProvider)
                .catch(() => {
                // Attempt fallback to API
                return this._dexter.config.shouldFallbackToApi
                    ? this.fetchPoolsFromApi(dexInstance)
                    : [];
            });
        });
        return Promise.all(liquidityPoolPromises).then(async (mappedLiquidityPools) => {
            const liquidityPools = mappedLiquidityPools
                .flat()
                .filter((pool) => this.poolMatchesFilter(pool));
            if (this._dexter.config.shouldFetchMetadata) {
                await this.fetchAssetMetadata(liquidityPools);
            }
            return liquidityPools;
        });
    }
    /**
     * Fetch historic states for a liquidity pool.
     */
    async getLiquidityPoolHistory(liquidityPool) {
        if (!this._dexter.dataProvider) {
            return []; // todo
        }
        const transactions = await this._dexter.dataProvider.assetTransactions(liquidityPool.lpToken);
        const liquidityPoolPromises = transactions.map(async (transaction) => {
            const utxos = await this._dexter.dataProvider
                .transactionUtxos(transaction.hash);
            const relevantUtxo = utxos.find((utxo) => {
                return utxo.address === liquidityPool.address;
            });
            if (!relevantUtxo) {
                return undefined;
            }
            return await this._dexter.availableDexs[liquidityPool.dex].liquidityPoolFromUtxo(this._dexter.dataProvider, relevantUtxo);
        });
        return await Promise.all(liquidityPoolPromises)
            .then((liquidityPools) => {
            return liquidityPools.filter((pool) => pool !== undefined);
        });
    }
    /**
     * Fetch asset metadata for the assets in the provided liquidity pools.
     */
    async fetchAssetMetadata(liquidityPools) {
        const assets = liquidityPools.reduce((results, liquidityPool) => {
            if (liquidityPool.assetA !== 'lovelace' && !results.some((asset) => asset.identifier() === liquidityPool.assetA.identifier())) {
                results.push(liquidityPool.assetA);
            }
            if (liquidityPool.assetB !== 'lovelace' && !results.some((asset) => asset.identifier() === liquidityPool.assetB.identifier())) {
                results.push(liquidityPool.assetB);
            }
            return results;
        }, []);
        await this._dexter.metadataProvider.fetch(assets)
            .then((response) => {
            liquidityPools.forEach((liquidityPool) => {
                [liquidityPool.assetA, liquidityPool.assetB].forEach((asset) => {
                    if (!(asset instanceof Asset)) {
                        return;
                    }
                    const responseAsset = response.find((metadata) => {
                        return (metadata.policyId === asset.policyId) && (metadata.nameHex === asset.nameHex);
                    });
                    asset.decimals = responseAsset ? responseAsset.decimals : 0;
                });
            });
        });
    }
    /**
     * Check if a pools assets match the supplied token filters.
     */
    poolMatchesFilter(liquidityPool) {
        if (!this._filteredTokens.length && !this._filteredPairs.length) {
            return true;
        }
        const inFilteredTokens = this._filteredTokens.some((filterToken) => {
            return tokensMatch(filterToken, liquidityPool.assetA) || tokensMatch(filterToken, liquidityPool.assetB);
        });
        const inFilteredPairs = this._filteredPairs.some((filterPair) => {
            return (tokensMatch(filterPair[0], liquidityPool.assetA) && tokensMatch(filterPair[1], liquidityPool.assetB))
                || (tokensMatch(filterPair[0], liquidityPool.assetB) && tokensMatch(filterPair[1], liquidityPool.assetA));
        });
        return inFilteredTokens || inFilteredPairs;
    }
    /**
     * Fetch liquidity pools from DEX APIs using the provided token filters.
     */
    fetchPoolsFromApi(dex) {
        const filterTokenPromises = this._filteredTokens.map((token) => {
            return dex.api.liquidityPools(token)
                .catch(() => []);
        });
        const filterPairPromises = this._filteredPairs.map((pair) => {
            return dex.api.liquidityPools(pair[0], pair[1])
                .catch(() => []);
        });
        return Promise.all(filterTokenPromises.concat(filterPairPromises).flat()).then((allLiquidityPools) => {
            return allLiquidityPools
                .flat()
                .filter((pool) => pool !== undefined);
        });
    }
}
