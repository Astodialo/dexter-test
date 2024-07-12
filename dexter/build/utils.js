export function tokensMatch(tokenA, tokenB) {
    const tokenAId = tokenA === 'lovelace' ? 'lovelace' : tokenA.identifier();
    const tokenBId = tokenB === 'lovelace' ? 'lovelace' : tokenB.identifier();
    return tokenAId === tokenBId;
}
export function correspondingReserves(liquidityPool, token) {
    return tokensMatch(token, liquidityPool.assetA)
        ? [liquidityPool.reserveA, liquidityPool.reserveB]
        : [liquidityPool.reserveB, liquidityPool.reserveA];
}
export function appendSlash(value) {
    if (!value)
        return '';
    if (value.endsWith('/'))
        return;
    return `${value}/`;
}
