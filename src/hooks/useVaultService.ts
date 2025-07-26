import { useAuthorization, APP_IDENTITY } from '../utils/useAuthorization';
import { 
  depositToVault, 
  getVaults, 
  getUserVaultBalance,
  getUserStake2EarnBalance,
  stakeInVault,
  claimFeesFromVault,
  unstakeFromVault,
  cancelUnstakeInVault,
  withdrawUnstakeFromVault
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

export interface UserStake2EarnBalance {
  stakeBalance: number;
  claimableFeeA: number;
  claimableFeeB: number;
  hasBalance: boolean;
}

export const useVaultService = () => {
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();

  // Deposit to the selected vault
  const depositToVaultService = async (amount: number): Promise<string> => {
    console.log('Starting deposit process');
    console.log('Amount:', amount);
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    const {
      transaction,
      minContextSlot
    } = await depositToVault(selectedAccount.publicKey, amount);
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    return signature;
  };

  // Get user's vault balance
  const getUserVaultBalanceService = async (): Promise<UserVaultBalance> => {
    if (!selectedAccount) {
      return {
        userLpBalance: 0,
        withdrawableAmount: 0,
        hasBalance: false
      };
    }
    return await getUserVaultBalance(selectedAccount.publicKey);
  };

  // Get user's Stake2Earn balance
  const getUserStake2EarnBalanceService = async (vaultAddress: string): Promise<UserStake2EarnBalance> => {
    if (!selectedAccount) {
      return {
        stakeBalance: 0,
        claimableFeeA: 0,
        claimableFeeB: 0,
        hasBalance: false
      };
    }
    return await getUserStake2EarnBalance(selectedAccount.publicKey, new PublicKey(vaultAddress));
  };

  // Stake in a Stake2Earn vault
  const stakeInVaultService = async (vaultAddress: string, amount: number): Promise<string> => {
    console.log('Starting stake process');
    console.log('Amount:', amount);
    console.log('Vault address:', vaultAddress);
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    const {
      transaction,
      minContextSlot
    } = await stakeInVault(new PublicKey(vaultAddress), selectedAccount.publicKey, amount);
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    return signature;
  };

  // Claim fees from a Stake2Earn vault
  const claimFeesFromVaultService = async (vaultAddress: string): Promise<string> => {
    console.log('Starting claim fees process');
    console.log('Vault address:', vaultAddress);
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    
    const transaction = await claimFeesFromVault(new PublicKey(vaultAddress), selectedAccount.publicKey);
    const { connection } = useConnection();
    const minContextSlot = await connection.getSlot();
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    
    return signature;
  };

  // Unstake from a Stake2Earn vault
  const unstakeFromVaultService = async (vaultAddress: string, unstakeAmount: any): Promise<{ signature: string; unstakeKeypair: any }> => {
    console.log('Starting unstake process');
    console.log('Vault address:', vaultAddress);
    console.log('Unstake amount:', unstakeAmount.toString());
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    
    const { transaction, unstakeKeypair } = await unstakeFromVault(new PublicKey(vaultAddress), selectedAccount.publicKey, unstakeAmount);
    const { connection } = useConnection();
    const minContextSlot = await connection.getSlot();
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    
    return { signature, unstakeKeypair };
  };

  // Cancel unstake in a Stake2Earn vault
  const cancelUnstakeInVaultService = async (vaultAddress: string, unstakeKeypair: any): Promise<string> => {
    console.log('Starting cancel unstake process');
    console.log('Vault address:', vaultAddress);
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    
    const transaction = await cancelUnstakeInVault(new PublicKey(vaultAddress), selectedAccount.publicKey, unstakeKeypair);
    const { connection } = useConnection();
    const minContextSlot = await connection.getSlot();
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    
    return signature;
  };

  // Withdraw unstaked tokens from a Stake2Earn vault
  const withdrawUnstakeFromVaultService = async (vaultAddress: string, unstakeKeypair: any): Promise<string> => {
    console.log('Starting withdraw unstake process');
    console.log('Vault address:', vaultAddress);
    if (!selectedAccount) {
      throw new Error('No account selected. Please connect your wallet.');
    }
    
    const transaction = await withdrawUnstakeFromVault(new PublicKey(vaultAddress), selectedAccount.publicKey, unstakeKeypair);
    const { connection } = useConnection();
    const minContextSlot = await connection.getSlot();
    const signature = await signAndSendTransaction(transaction, minContextSlot);
    
    return signature;
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
    getUserStake2EarnBalance: getUserStake2EarnBalanceService,
    stakeInVault: stakeInVaultService,
    claimFeesFromVault: claimFeesFromVaultService,
    unstakeFromVault: unstakeFromVaultService,
    cancelUnstakeInVault: cancelUnstakeInVaultService,
    withdrawUnstakeFromVault: withdrawUnstakeFromVaultService,
    testWallet
  };
};
