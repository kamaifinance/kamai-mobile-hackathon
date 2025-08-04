import React, { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, ImageBackground, Image, Text, TextInput, ActivityIndicator, Alert } from "react-native";
import { Card } from "react-native-paper";
import { FontFamilies } from "../styles/fonts";
import { LineChart } from "react-native-gifted-charts";
import { useVaultContext } from '../context';
import { VaultInfo, UserVaultBalance, useVaultService } from '../hooks/useVaultService';
import { useAuthorization } from '../utils/useAuthorization';

import DepositModal from '../components/vault/DepositModal';
import { ConnectWalletAlert } from '../components/ui/ConnectWalletAlert';
import { useDammService } from '../hooks/useDammService';
import LiquidityDepositModal from '../components/swap/DepositModal';
import { DammPool } from '../utils/dammService';
import { calculateFutureValue } from '../utils/vaultService';
import { useGetBalance } from '../components/account/account-data-access';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Generate realistic portfolio data for the past 30 days
const generatePortfolioData = () => {
  const data = [];
  const currentValue = 12485.92; // Current portfolio value
  const startValue = 10000; // Starting value 30 days ago

  for (let i = 40; i >= 0; i--) {
    // Calculate the base progression from start to current value
    const progressRatio = (30 - i) / 30;
    const baseValue = startValue + (currentValue - startValue) * progressRatio;

    // Add some realistic daily fluctuations
    const randomVariation = (Math.random() - 0.5) * 0.03; // ±1.5% daily variation
    const value = baseValue * (1 + randomVariation);

    data.push({
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
    });
  }

  return data;
};

const portfolioData = generatePortfolioData();

export function HomeScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Now');
  const [depositing, setDepositing] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
  const [showConnectWalletAlert, setShowConnectWalletAlert] = useState(false);
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<DammPool | null>(null);
  const [depositingLiquidity, setDepositingLiquidity] = useState(false);
  const { vaults, userBalances, vaultDetails, loading, refreshUserBalances } = useVaultContext();
  const { selectedAccount } = useAuthorization();
  const { depositToVault } = useVaultService();
  const { pools: dammPools, provideLiquidity, getQuote } = useDammService();

  
  // Get SOL balance
  const solBalanceQuery = useGetBalance({ 
    address: selectedAccount?.publicKey! 
  });
  const solBalance = selectedAccount && solBalanceQuery.data 
    ? (solBalanceQuery.data / LAMPORTS_PER_SOL).toFixed(4)
    : '0.00';

  // All vault data is now handled by VaultContext



  // Aggregate total balance in USD
  const totalBalance = vaults.reduce((sum: number, v: VaultInfo) => {
    const userBalance = userBalances[v.tokenSymbol]?.withdrawableAmount || 0;
    const solPrice = (v as any).solPrice || 100; // Get SOL price from vault info
    return sum + (userBalance * solPrice);
  }, 0);

  // Calculate estimated value based on selected period and vault APY
  const calculateEstimatedValue = () => {
    if (selectedPeriod === 'Now') return totalBalance;
    
    const days = parseInt(selectedPeriod);
    const totalApy = vaults.reduce((sum: number, v: VaultInfo) => {
      return sum + (v.apy || 0);
    }, 0) / Math.max(vaults.length, 1); // Average APY across all vaults
    
    return calculateFutureValue(totalBalance, totalApy, days);
  };

  // Helper to map vault type
  const getVaultType = (symbol: string) => {
    if (symbol === 'SOL') return 'LSTs';
    return symbol;
  };

  const getVaultIcon = (type: string, index: number) => {
    if (type === 'Boosted' || index === 0) return require('../../assets/star.png');
    if (type === 'Protected') return require('../../assets/shield.png');
    return require('../../assets/vault.png');
  };

  const getAmountColor = (amount: number) => {
    if (amount < 0) return '#FF6B6B';
    if (amount > 0) return '#4CAF50';
    return '#F4A261';
  };

  const handleDeposit = async (vault: VaultInfo) => {
    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }
    console.log('Vault:', vault.tokenSymbol);

    setSelectedVault(vault);
    setShowDepositModal(true);
  };

  const handleDepositConfirm = async (vault: VaultInfo, amount: number): Promise<string> => {
    try { 
      setDepositing(vault.tokenSymbol);
      console.log('Depositing to vault:', vault.tokenSymbol);
      const signature = await depositToVault(amount, vault.tokenSymbol);
      await refreshUserBalances();
      return signature;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    } finally {
      setDepositing(null);
    }
  };

  const handleLiquidityDeposit = async (pool: DammPool, tokenAAmount: number, tokenBAmount: number): Promise<string> => {
    if (!selectedAccount) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setDepositingLiquidity(true);
      console.log('Adding liquidity:', tokenAAmount, tokenBAmount);
      const result = await provideLiquidity(selectedAccount.publicKey, pool.id, tokenAAmount, tokenBAmount);
      return result.transaction.signatures[0] || 'Transaction completed';
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    } finally {
      setDepositingLiquidity(false);
    }
  };

  const handleLiquidityPress = (pool: DammPool) => {
    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }
    setSelectedPool(pool);
    setShowLiquidityModal(true);
  };



  const SimpleChart = () => (
    <View style={styles.chartContainer}>
      <LineChart
        data={portfolioData}
        height={140}
        width={350}
        spacing={8}
        color="#CD9227"
        thickness={2}
        startFillColor="#CD9227"
        endFillColor="#CD9227"
        startOpacity={0.3}
        endOpacity={0.1}
        initialSpacing={0}
        noOfSections={4}
        animateOnDataChange
        animationDuration={1000}
        onDataChangeAnimationDuration={300}
        areaChart
        hideDataPoints
        hideRules
        hideYAxisText
        hideAxesAndRules
        curved
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.portfolioTitle}>
          Portfolio
        </Text>
        {/* Total Value Card */}
        <Card style={styles.totalValueCard}>
          <Card.Content style={styles.totalValueContent}>
            <Text style={styles.totalValueLabel}>Total Value</Text>
            
            {/* Value Display */}
            <View style={styles.valueDisplayContainer}>
              {selectedPeriod === 'Now' ? (
                <Text style={styles.currentValueAmount}>
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              ) : (
                <>
                  <Text style={styles.strikethroughValue}>
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.estimatedValueAmount}>
                    ${calculateEstimatedValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </>
              )}
            </View>
            
            {/* Time Period Buttons */}
            <View style={styles.periodButtons}>
              {['Now', '60', '90'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.selectedPeriodButton
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.selectedPeriodButtonText
                  ]}>
                    {period === 'Now' ? period : `${period} Days`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Disclaimer */}
            {selectedPeriod !== 'Now' && (
              <Text style={styles.disclaimerText}>
                *Approx. projection based on current APY
              </Text>
            )}
          </Card.Content>
        </Card>
        {/* Investments Section */}
        <Text style={styles.sectionTitle}>Investments</Text>

        <ScrollView
          style={styles.investmentCards}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.investmentCardsContainer}
        >
          {vaults.map((vault: VaultInfo, index: number) => {
            const userBalance = userBalances[vault.tokenSymbol];
            const vaultType = getVaultType(vault.tokenSymbol);
            const withdrawableAmount = userBalance?.withdrawableAmount || 0;
            const solPrice = (vault as any).solPrice || 100;
            const usdValue = withdrawableAmount * solPrice;
            
            return (
              <TouchableOpacity
                key={vault.tokenSymbol}
                onPress={() => handleDeposit(vault)}
              >
                <Card style={[
                  styles.investmentCard, 
                  styles.boostedCard
                ]}>
                  <ImageBackground
                    source={require('../../assets/vault_boosted.png')}
                    style={styles.cardBackgroundImage}
                    resizeMode="cover"
                  >
                    <Card.Content style={styles.investmentCardContent}>
                      <View style={styles.investmentHeader}>
                        <Text style={styles.investmentType}>{vaultType}</Text>
                        <Image
                          source={getVaultIcon(vaultType, index)}
                          style={{ width: 32, height: 32 }}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={styles.solAmount}>
                          {withdrawableAmount.toFixed(4)} SOL
                        </Text>
                        <Text style={styles.usdValue}>
                          ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                      <View style={styles.cardBottomRow}>
                        <View style={styles.apyCardBadge}>
                          <Text style={styles.apyCardValue}>{vault.apy}%</Text>
                        </View>
                        <Text style={styles.apyCardLabel}>APY</Text>
                      </View>
                      
                      {/* DEVNET Chip */}
                      <View style={styles.devnetChipContainer}>
                        <View style={styles.devnetChip}>
                          <Text style={styles.devnetChipText}>DEVNET</Text>
                        </View>
                        <Text style={styles.devnetNote}>Mainnet will have better APYs</Text>
                      </View>
                    </Card.Content>
                  </ImageBackground>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* DAMM v1 Liquidity Pools Section */}
        <Text style={styles.sectionTitle}>Liquidity Pools</Text>
          <ScrollView
            style={styles.investmentCards}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.investmentCardsContainer}
          >
            {dammPools.map((pool: DammPool) => (
              <TouchableOpacity
                key={pool.id}
                onPress={() => handleLiquidityPress(pool)}
              >
                <Card style={styles.swapCard}>
                  <Card.Content style={styles.swapCardContent}>
                    <View style={styles.swapHeader}>
                      <Text style={styles.swapPair}>
                        {pool.tokenASymbol}/{pool.tokenBSymbol}
                      </Text>
                      <View style={styles.swapBadge}>
                        <Text style={styles.swapBadgeText}>DEVNET</Text>
                      </View>
                    </View>
                    <Text style={styles.swapVolume}>
                      ${pool.volume24h.toLocaleString()} 24h Vol
                    </Text>
                    <View style={styles.swapStats}>
                      <View style={styles.swapStat}>
                        <Text style={styles.swapStatLabel}>APY</Text>
                        <Text style={styles.swapStatValue}>{pool.apy.toFixed(1)}%</Text>
                      </View>
                      <View style={styles.swapStat}>
                        <Text style={styles.swapStatLabel}>Fee</Text>
                        <Text style={styles.swapStatValue}>{(pool.fee * 100).toFixed(2)}%</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.swapButton}
                      onPress={() => handleLiquidityPress(pool)}
                    >
                      <Text style={styles.swapButtonText}>Add Liquidity</Text>
                    </TouchableOpacity>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
      </View>
      <DepositModal
        visible={showDepositModal}
        vault={selectedVault}
        onClose={() => {
          setShowDepositModal(false);
          setSelectedVault(null);
        }}
        onDeposit={handleDepositConfirm}
        loading={depositing !== null}
      />
      <ConnectWalletAlert
        visible={showConnectWalletAlert}
        onDismiss={() => setShowConnectWalletAlert(false)}
      />
      <LiquidityDepositModal
        visible={showLiquidityModal}
        pool={selectedPool}
        onClose={() => {
          setShowLiquidityModal(false);
          setSelectedPool(null);
        }}
        onDeposit={handleLiquidityDeposit}
        loading={depositingLiquidity}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: 60, // Increased to account for status bar without top bar
  },
  portfolioTitle: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    marginBottom: 24,
    color: '#DDB15B',
  },
  totalValueCard: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    marginBottom: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  totalValueContent: {
    padding: 24,
    alignItems: 'center',
  },
  totalValueLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalValueAmount: {
    fontSize: 40,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 12,
    textAlign: 'center',
  },
  apyText: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
  },
  apyBadge: {
    backgroundColor: 'rgba(13, 69, 50, 0.14)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  estimatedValueContainer: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },
  estimatedValueLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },

  valueDisplayContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  currentValueAmount: {
    fontSize: 40,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    textAlign: 'center',
  },
  strikethroughValue: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#666666',
    textDecorationLine: 'line-through',
    textAlign: 'center',
    marginBottom: 8,
  },
  estimatedValueAmount: {
    fontSize: 40,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
  chartContainer: {
    flex: 1,
    minHeight: 140,
    width: 350,
  },
  chartLine: {
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4A261',
  },
  chartSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#F4A261',
    borderRadius: 1.5,
  },
  periodButtons: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(13, 69, 50, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#0D4532',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  investmentCards: {
    marginBottom: 32,
  },
  investmentCardsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  investmentCard: {
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    width: 360,
    marginRight: 16,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  cardBackgroundImage: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  protectedCard: {
    backgroundColor: '#2A5A47',
  },
  boostedCard: {
    backgroundColor: '#8B6914',
  },
  premiumCard: {
    backgroundColor: '#4C1D95',
  },
  boostedPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    opacity: 1,
  },
  boostedGradient1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    opacity: 1,
  },
  boostedGradient2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(218, 165, 32, 0.05)',
    borderRadius: 16,
    opacity: 1,
  },
  premiumPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.15)',
    borderRadius: 16,
    opacity: 1,
  },
  investmentCardContent: {
    padding: 20,
    position: 'relative',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  investmentType: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
  },
  investmentAmount: {
    fontSize: 28,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 20,
  },
  amountContainer: {
    marginBottom: 16,
  },
  solAmount: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 4,
  },
  usdValue: {
    fontSize: 18,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apyCardBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  apyCardValue: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
  },
  apyCardLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  devnetChipContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
  },
  devnetChip: {
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  devnetChipText: {
    fontSize: 10,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
  devnetNote: {
    fontSize: 8,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#000000',
    textAlign: 'center',
  },
  // Swap card styles
  swapCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    width: 360,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  swapCardContent: {
    padding: 20,
    position: 'relative',
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  swapPair: {
    fontSize: 18,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
  },
  swapBadge: {
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  swapBadgeText: {
    fontSize: 10,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
  swapVolume: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  swapStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  swapStat: {
    alignItems: 'center',
  },
  swapStatLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  swapStatValue: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#DDB15B',
  },
  swapButton: {
    backgroundColor: '#DDB15B',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  swapButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 69, 50, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0D4532',
  },
  tabText: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  // Swap tab content
  swapTabContent: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  swapInputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  swapTokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(221, 177, 91, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tokenIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#DDB15B',
  },
  tokenSymbol: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#FFFFFF',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#DDB15B',
  },
  balanceText: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  swapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swapAmountInput: {
    flex: 1,
    fontSize: 32,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginRight: 12,
  },
  percentageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  percentageButton: {
    backgroundColor: 'rgba(221, 177, 91, 0.2)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  percentageButtonText: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#DDB15B',
  },
  swapArrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapArrow: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  swapArrowText: {
    fontSize: 20,
    color: '#DDB15B',
  },
  swapOutputRow: {
    alignItems: 'flex-start',
  },
  swapOutputAmount: {
    fontSize: 32,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  quoteDetailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  quoteDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteDetailLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  quoteDetailValue: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#FFFFFF',
  },
  swapExecuteButton: {
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  swapExecuteButtonDisabled: {
    backgroundColor: 'rgba(221, 177, 91, 0.3)',
  },
  swapExecuteButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
  // Dropdown styles
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B3834',
    zIndex: 1000,
    maxHeight: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B3834',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(221, 177, 91, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    color: '#DDB15B',
    fontWeight: 'bold',
  },
});
