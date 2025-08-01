import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useVaultService, VaultInfo, UserVaultBalance } from '../hooks/useVaultService';
import { useAuthorization } from '../utils/useAuthorization';
import { getVaultDetails } from '../utils/vaultService';

interface VaultContextType {
  vaults: VaultInfo[];
  userBalances: { [key: string]: UserVaultBalance };
  vaultDetails: { [key: string]: any };
  loading: boolean;
  error: string | null;
  refreshVaults: () => Promise<void>;
  refreshUserBalances: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

interface VaultProviderProps {
  children: ReactNode;
}

export function VaultProvider({ children }: VaultProviderProps) {
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [userBalances, setUserBalances] = useState<{ [key: string]: UserVaultBalance }>({});
  const [vaultDetails, setVaultDetails] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedAccount } = useAuthorization();
  const { getVaults, getUserVaultBalance } = useVaultService();

  // Load vaults on provider mount
  useEffect(() => {
    loadVaults();
  }, []);

  // Load user balances when account changes
  useEffect(() => {
    if (selectedAccount) {
      loadUserBalances();
    } else {
      setUserBalances({});
    }
  }, [selectedAccount, vaults]); // Also depend on vaults to ensure they're loaded first

  const loadVaults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const availableVaults = await getVaults();
      // Only keep the two supported vaults in the correct order
      const vaultOrder = ['SOL', 'USDC'];
      const filteredVaults = vaultOrder.map(symbol => 
        availableVaults.find((v: any) => v.tokenSymbol === symbol)
      ).filter(Boolean) as VaultInfo[];
      
      setVaults(filteredVaults);
      
      // Fetch vault details for each
      const detailsObj: { [key: string]: any } = {};
      for (const vault of filteredVaults) {
        if (vault?.vault && vault.vault?.tokenMint) {
          try {
            const details = await getVaultDetails(vault.vault, vault.vault.tokenMint?.toBase58?.());
            detailsObj[vault.tokenSymbol] = details;
          } catch (detailError) {
            console.warn(`Failed to load details for ${vault.tokenSymbol}:`, detailError);
            // Continue loading other vault details even if one fails
          }
        }
      }
      setVaultDetails(detailsObj);
      
    } catch (error) {
      console.error('Error loading vaults:', error);
      setError('Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalances = async () => {
    if (!selectedAccount || vaults.length === 0) return;
    
    try {
      const balancePromises = vaults.map(async (vault) => {
        try {
          const balance = await getUserVaultBalance(vault.tokenSymbol);
          return { symbol: vault.tokenSymbol, balance };
        } catch (error) {
          console.warn(`Failed to load balance for ${vault.tokenSymbol}:`, error);
          return { symbol: vault.tokenSymbol, balance: null };
        }
      });

      const results = await Promise.all(balancePromises);
      const balancesObj: { [key: string]: UserVaultBalance } = {};
      
      results.forEach(({ symbol, balance }) => {
        if (balance) {
          balancesObj[symbol] = balance;
        }
      });
      
      setUserBalances(balancesObj);
    } catch (error) {
      console.error('Error loading user balances:', error);
    }
  };

  const refreshVaults = async () => {
    await loadVaults();
  };

  const refreshUserBalances = async () => {
    await loadUserBalances();
  };

  const value: VaultContextType = {
    vaults,
    userBalances,
    vaultDetails,
    loading,
    error,
    refreshVaults,
    refreshUserBalances,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVaultContext() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVaultContext must be used within a VaultProvider');
  }
  return context;
} 