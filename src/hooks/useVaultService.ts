import { useAuthorization, APP_IDENTITY } from '../utils/useAuthorization';
import { 
  depositToVault, 
  getVaults, 
  getUserVaultBalance
} from '../utils/vaultService';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useConnection } from '../utils/ConnectionProvider';
import { useMobileWallet } from '../utils/useMobileWallet';

export interface VaultInfo {
  vault: any;           // identifier (e.g., tokenSymbol)
  name: string;
  tokenSymbol: string;
  description?: string;
  totalValueLocked: number;
  apy?: number;
  type?: 'dynamic' | 'stake2earn';
  address?: string;
}

export interface UserVaultBalance {
  userLpBalance: number;
  withdrawableAmount: number;
  hasBalance: boolean;
}



export const useVaultService = () => {
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();

  // Deposit to the selected vault
  const depositToVaultService = async (amount: number, vaultType: string = 'SOL'): Promise<string> => {
    console.log('Starting deposit process');
    console.log('Amount:', amount);
    console.log('Vault type:', vaultType);
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    const {
      transaction,
      minContextSlot
    } = await depositToVault(selectedAccount.publicKey, amount, vaultType);
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    return signature;
  };

  // Get user's vault balance
  const getUserVaultBalanceService = async (vaultType: string = 'SOL'): Promise<UserVaultBalance> => {
    if (!selectedAccount) {
      return {
        userLpBalance: 0,
        withdrawableAmount: 0,
        hasBalance: false
      };
    }
    return await getUserVaultBalance(selectedAccount.publicKey, vaultType);
  };



  // Test wallet functionality with a simple transaction
  const testWallet = async (): Promise<string> => {
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }

    try {
      // Create a simple transaction that transfers 0 SOL to self (just for testing)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: selectedAccount.publicKey,
          toPubkey: selectedAccount.publicKey,
          lamports: 0, // Transfer 0 lamports (just for testing)
        })
      );

      // Get current slot for minContextSlot
      const { connection } = useConnection();
      const minContextSlot = await connection.getSlot();
      
      const signature = await signAndSendTransaction(transaction, minContextSlot);
      return signature;
    } catch (error) {
      console.error('Test wallet transaction failed:', error);
      throw error;
    }
  };

  return {
    depositToVault: depositToVaultService,
    getVaults,
    getUserVaultBalance: getUserVaultBalanceService,
    testWallet
  };
};
