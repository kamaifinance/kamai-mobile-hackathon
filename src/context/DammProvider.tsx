import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useDammService, DammContextData } from '../hooks/useDammService';

interface DammContextType extends DammContextData {
  preloadPools: () => Promise<void>;
  isPreloaded: boolean;
}

const DammContext = createContext<DammContextType | undefined>(undefined);

interface DammProviderProps {
  children: ReactNode;
  preloadOnMount?: boolean;
}

export function DammProvider({ children, preloadOnMount = true }: DammProviderProps) {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const dammService = useDammService();

  // Load pools on provider mount if preloadOnMount is true
  useEffect(() => {
    if (preloadOnMount && !isPreloaded) {
      loadPools();
    }
  }, [preloadOnMount, isPreloaded]);

  const loadPools = useCallback(async () => {
    if (isPreloaded) return; // Prevent multiple loads
    
    try {
      console.log('Starting pool preloading...');
      await dammService.refreshPools();
      await dammService.refreshStats();
      setIsPreloaded(true);
      console.log('Pool preloading completed');
    } catch (error) {
      console.error('Error preloading pools:', error);
      // Don't throw error, just log it
    }
  }, [dammService, isPreloaded]);

  const preloadPools = useCallback(async () => {
    if (!isPreloaded) {
      await loadPools();
    }
  }, [isPreloaded, loadPools]);

  const value: DammContextType = {
    ...dammService,
    preloadPools,
    isPreloaded,
  };

  return (
    <DammContext.Provider value={value}>
      {children}
    </DammContext.Provider>
  );
}

export function useDammContext() {
  const context = useContext(DammContext);
  if (context === undefined) {
    throw new Error('useDammContext must be used within a DammProvider');
  }
  return context;
} 