import { DexTransaction } from '@indigo-labs/dexter';
declare module '@indigo-labs/dexter' {
    interface BaseWalletProvider {
        createFeeTx: DexTransaction;
    }
}
