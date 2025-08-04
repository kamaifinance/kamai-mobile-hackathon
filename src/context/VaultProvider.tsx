import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  preloadVaults: () => Promise<void>;
  isPreloaded: boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

interface VaultProviderProps {
  children: ReactNode;
  preloadOnMount?: boolean;
}

export function VaultProvider({ children, preloadOnMount = true }: VaultProviderProps) {
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [userBalances, setUserBalances] = useState<{ [key: string]: UserVaultBalance }>({});
  const [vaultDetails, setVaultDetails] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreloaded, setIsPreloaded] = useState(false);
  
  const { selectedAccount } = useAuthorization();
  const { getVaults, getUserVaultBalance } = useVaultService();

  // Load vaults on provider mount if preloadOnMount is true
  useEffect(() => {
    if (preloadOnMount) {
      loadVaults();
    }
  }, [preloadOnMount]);

  // Load user balances when account changes
  useEffect(() => {
    if (selectedAccount && vaults.length > 0) {
      loadUserBalances();
    } else {
      setUserBalances({});
    }
  }, [selectedAccount, vaults]); // Also depend on vaults to ensure they're loaded first

  const loadVaults = useCallback(async () => {
    if (isPreloaded) return; // Prevent multiple loads
    
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
      setIsPreloaded(true);
      
    } catch (error) {
      console.error('Error loading vaults:', error);
      setError('Failed to load vaults');
    } finally {
      setLoading(false);
    }
  }, [getVaults, isPreloaded]);

  const preloadVaults = useCallback(async () => {
    if (!isPreloaded) {
      await loadVaults();
    }
  }, [isPreloaded, loadVaults]);

  const loadUserBalances = useCallback(async () => {
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
  }, [selectedAccount, vaults, getUserVaultBalance]);

  const refreshVaults = useCallback(async () => {
    setIsPreloaded(false);
    await loadVaults();
  }, [loadVaults]);

  const refreshUserBalances = useCallback(async () => {
    await loadUserBalances();
  }, [loadUserBalances]);

  const value: VaultContextType = {
    vaults,
    userBalances,
    vaultDetails,
    loading,
    error,
    refreshVaults,
    refreshUserBalances,
    preloadVaults,
    isPreloaded,
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