export declare enum MetadataKey {
    Message = 674
}
export declare enum DatumParameterKey {
    /**
     * Generics.
     */
    Action = "Action",
    TokenPolicyId = "TokenPolicyId",
    TokenAssetName = "TokenAssetName",
    /**
     * Swap/wallet info.
     */
    SenderPubKeyHash = "SenderPubKeyHash",
    SenderStakingKeyHash = "SenderStakingKeyHash",
    SenderKeyHashes = "SenderKeyHashes",
    ReceiverPubKeyHash = "ReceiverPubKeyHash",
    ReceiverStakingKeyHash = "ReceiverStakingKeyHash",
    SwapInAmount = "SwapInAmount",
    SwapInTokenPolicyId = "SwapInTokenPolicyId",
    SwapInTokenAssetName = "SwapInTokenAssetName",
    SwapOutTokenPolicyId = "SwapOutTokenPolicyId",
    SwapOutTokenAssetName = "SwapOutTokenAssetName",
    MinReceive = "MinReceive",
    Expiration = "Expiration",
    AllowPartialFill = "AllowPartialFill",
    /**
     * Trading fees.
     */
    TotalFees = "TotalFees",
    BatcherFee = "BatcherFee",
    DepositFee = "DepositFee",
    ScooperFee = "ScooperFee",
    /**
     * LP info.
     */
    PoolIdentifier = "PoolIdentifier",
    TotalLpTokens = "TotalLpTokens",
    LpTokenPolicyId = "LpTokenPolicyId",
    LpTokenAssetName = "LpTokenAssetName",
    LpFee = "LpFee",
    LpFeeNumerator = "LpFeeNumerator",
    LpFeeDenominator = "LpFeeDenominator",
    PoolAssetAPolicyId = "PoolAssetAPolicyId",
    PoolAssetAAssetName = "PoolAssetAAssetName",
    PoolAssetATreasury = "PoolAssetATreasury",
    PoolAssetABarFee = "PoolAssetABarFee",
    PoolAssetBPolicyId = "PoolAssetBPolicyId",
    PoolAssetBAssetName = "PoolAssetBAssetName",
    PoolAssetBTreasury = "PoolAssetBTreasury",
    PoolAssetBBarFee = "PoolAssetBBarFee",
    RootKLast = "RootKLast",
    LastInteraction = "LastInteraction",
    RequestScriptHash = "RequestScriptHash",
    StakeAdminPolicy = "StakeAdminPolicy",
    LqBound = "LqBound"
}
export declare enum TransactionStatus {
    Building = 0,
    Signing = 1,
    Submitting = 2,
    Submitted = 3,
    Errored = 4
}
export declare enum AddressType {
    Contract = 0,
    Base = 1,
    Enterprise = 2
}
