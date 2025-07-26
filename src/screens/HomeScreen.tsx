import React, { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, ImageBackground, Image } from "react-native";
import { Text, Card } from "react-native-paper";
import { FontFamilies } from "../styles/fonts";
import { LineChart } from "react-native-gifted-charts";
import { useVaultService, VaultInfo, UserVaultBalance } from '../hooks/useVaultService';
import { useAuthorization } from '../utils/useAuthorization';
import { useNavigation } from '@react-navigation/native';

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
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [userBalances, setUserBalances] = useState<{ [key: string]: UserVaultBalance }>({});
  const [vaultDetails, setVaultDetails] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const { selectedAccount } = useAuthorization();
  const { getVaults, getUserVaultBalance } = useVaultService();
  const navigation = useNavigation();

  React.useEffect(() => {
    loadVaults();
  }, []);

  React.useEffect(() => {
    if (selectedAccount) {
      loadUserBalances();
    } else {
      setUserBalances({});
    }
  }, [selectedAccount]);

  const loadVaults = async () => {
    try {
      setLoading(true);
      const availableVaults: VaultInfo[] = await getVaults();
      // Only keep the three supported vaults in the correct order
      const vaultOrder = ['SOL', 'USDC-Dev', 'mSOL'];
      const filteredVaults: VaultInfo[] = vaultOrder.map(symbol => availableVaults.find(v => v.tokenSymbol === symbol)).filter(Boolean) as VaultInfo[];
      setVaults(filteredVaults);
      // Fetch vault details for each
      const detailsObj: { [key: string]: any } = {};
      for (const v of filteredVaults) {
        if (v?.vault && v.vault?.tokenMint) {
          // getVaultDetails is imported in VaultsScreen, but not here; skip details for now
          // Optionally, you can import and fetch details if needed
        }
      }
      setVaultDetails(detailsObj);
    } catch (error) {
      setVaults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalances = async () => {
    if (!selectedAccount) return;
    try {
      const [solBalance, usdcDevBalance, msolBalance]: UserVaultBalance[] = await Promise.all([
        getUserVaultBalance('SOL'),
        getUserVaultBalance('USDC-Dev'),
        getUserVaultBalance('mSOL')
      ]);
      setUserBalances({
        'SOL': solBalance,
        'USDC-Dev': usdcDevBalance,
        'mSOL': msolBalance
      });
    } catch (error) {
      setUserBalances({});
    }
  };

  // Aggregate total balance
  const totalBalance = vaults.reduce((sum: number, v: VaultInfo) => sum + (userBalances[v.tokenSymbol]?.withdrawableAmount || 0), 0);

  // Helper to map vault type
  const getVaultType = (symbol: string) => {
    if (symbol === 'SOL') return 'Boosted';
    if (symbol === 'USDC-Dev') return 'Protected';
    if (symbol === 'mSOL') return 'Vault';
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
            <Text style={styles.totalValueAmount}>
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.apyBadge}>
              <Text style={styles.apyText}>Aggregated</Text>
            </View>
            {/* Optionally keep the chart here */}
          </Card.Content>
        </Card>
        {/* Time Period Buttons */}
        <View style={styles.periodButtons}>
          {['Daily', 'Monthly', 'Yearly'].map((period) => (
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
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
            const isProtected = vaultType === 'Protected';
            const isBoosted = vaultType === 'Boosted';
            
            return (
              <TouchableOpacity
                key={vault.tokenSymbol}
                onPress={() => (navigation as any).navigate('Vault')}
              >
                <Card style={[
                  styles.investmentCard, 
                  isProtected ? styles.protectedCard : 
                  isBoosted ? styles.boostedCard : styles.premiumCard
                ]}>
                  <ImageBackground
                    source={isProtected ? require('../../assets/vault_normal.png') : require('../../assets/vault_boosted.png')}
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
                      <Text style={styles.investmentAmount}>
                        ${withdrawableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <View style={styles.cardBottomRow}>
                        <View style={styles.apyCardBadge}>
                          <Text style={styles.apyCardValue}>N/A</Text>
                        </View>
                        <Text style={styles.apyCardLabel}>APY (30days Avg.)</Text>
                      </View>
                    </Card.Content>
                  </ImageBackground>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
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
    fontFamily: FontFamilies.Larken.Medium,
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
    fontFamily: FontFamilies.Larken.Medium,
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
    marginBottom: 32,
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
    fontFamily: FontFamilies.Larken.Medium,
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
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  investmentCard: {
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    width: 300,
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
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  investmentAmount: {
    fontSize: 28,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 20,
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
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  apyCardLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
