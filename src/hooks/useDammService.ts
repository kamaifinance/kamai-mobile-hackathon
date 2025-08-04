import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { 
  getDammPools, 
  getSwapQuote, 
  executeSwap, 
  addLiquidity, 
  getUserLiquidityPositions, 
  getDammStats,
  getUserTokenBalance,
  DammPool,
  SwapQuote,
  UserLiquidityPosition,
  DammStats
} from '../utils/dammService';

export interface DammContextData {
  pools: DammPool[];
  userPositions: UserLiquidityPosition[];
  stats: DammStats;
  loading: boolean;
  error: string | null;
  refreshPools: () => Promise<void>;
  refreshUserPositions: (userPublicKey: PublicKey) => Promise<void>;
  refreshStats: () => Promise<void>;
  getQuote: (poolId: string, inputAmount: number, inputToken: string) => Promise<SwapQuote>;
  swapTokens: (userPublicKey: PublicKey, poolId: string, inputAmount: number, minOutputAmount: number, inputToken: string) => Promise<{ transaction: any; minContextSlot: number }>;
  provideLiquidity: (userPublicKey: PublicKey, poolId: string, tokenAAmount: number, tokenBAmount: number) => Promise<{ transaction: any; minContextSlot: number }>;
  getUserBalance: (userPublicKey: PublicKey, tokenAddress: string) => Promise<number>;
}

export function useDammService(): DammContextData {
  const [pools, setPools] = useState<DammPool[]>([]);
  const [userPositions, setUserPositions] = useState<UserLiquidityPosition[]>([]);
  const [stats, setStats] = useState<DammStats>({
    totalVolume24h: 0,
    totalLiquidity: 0,
    totalFees24h: 0,
    activePools: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPools = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing DAMM pools with real data...');
      const poolsData = await getDammPools();
      console.log(`Loaded ${poolsData.length} real pools`);
      setPools(poolsData);
    } catch (err: any) {
      console.error('Error refreshing pools:', err);
      setError(err.message || 'Failed to refresh pools');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserPositions = async (userPublicKey: PublicKey) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing user liquidity positions from blockchain...');
      const positions = await getUserLiquidityPositions(userPublicKey);
      console.log(`Found ${positions.length} real user positions`);
      setUserPositions(positions);
    } catch (err: any) {
      console.error('Error refreshing user positions:', err);
      setError(err.message || 'Failed to refresh user positions');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing DAMM statistics from API...');
      const statsData = await getDammStats();
      console.log('Real stats loaded:', statsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error refreshing stats:', err);
      setError(err.message || 'Failed to refresh stats');
    } finally {
      setLoading(false);
    }
  };

  const getQuote = async (poolId: string, inputAmount: number, inputToken: string): Promise<SwapQuote> => {
    try {
      setError(null);
      return await getSwapQuote(poolId, inputAmount, inputToken);
    } catch (err: any) {
      console.error('Error getting quote:', err);
      setError(err.message || 'Failed to get quote');
      throw err;
    }
  };

  const swapTokens = async (
    userPublicKey: PublicKey, 
    poolId: string, 
    inputAmount: number, 
    minOutputAmount: number, 
    inputToken: string
  ): Promise<{ transaction: any; minContextSlot: number }> => {
    try {
      setError(null);
      return await executeSwap(userPublicKey, poolId, inputAmount, minOutputAmount, inputToken);
    } catch (err: any) {
      console.error('Error executing swap:', err);
      setError(err.message || 'Failed to execute swap');
      throw err;
    }
  };

  const provideLiquidity = async (
    userPublicKey: PublicKey, 
    poolId: string, 
    tokenAAmount: number, 
    tokenBAmount: number
  ): Promise<{ transaction: any; minContextSlot: number }> => {
    try {
      setError(null);
      return await addLiquidity(userPublicKey, poolId, tokenAAmount, tokenBAmount);
    } catch (err: any) {
      console.error('Error providing liquidity:', err);
      setError(err.message || 'Failed to provide liquidity');
      throw err;
    }
  };

  const getUserBalance = async (userPublicKey: PublicKey, tokenAddress: string): Promise<number> => {
    try {
      setError(null);
      return await getUserTokenBalance(userPublicKey, tokenAddress);
    } catch (err: any) {
      console.error('Error getting user balance:', err);
      setError(err.message || 'Failed to get user balance');
      return 0;
    }
  };

  // Initial load - removed to allow controlled preloading
  // useEffect(() => {
  //   refreshPools();
  //   refreshStats();
  // }, []);

  return {
    pools,
    userPositions,
    stats,
    loading,
    error,
    refreshPools,
    refreshUserPositions,
    refreshStats,
    getQuote,
    swapTokens,
    provideLiquidity,
    getUserBalance
  };
} 