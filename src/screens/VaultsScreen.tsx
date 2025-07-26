import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useVaultService, VaultInfo, UserVaultBalance } from '../hooks/useVaultService';
import { useAuthorization } from '../utils/useAuthorization';
import DepositModal from '../components/vault/DepositModal';
import { FontFamilies } from '../styles/fonts';

export default function VaultsScreen() {
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [userBalances, setUserBalances] = useState<{ [key: string]: UserVaultBalance }>({});
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
  const { selectedAccount } = useAuthorization();
  const { depositToVault, getVaults, testWallet, getUserVaultBalance } = useVaultService();

  useEffect(() => {
    loadVaults();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadUserBalances();
    } else {
      setUserBalances({});
    }
  }, [selectedAccount]);

  const loadVaults = async () => {
    try {
      setLoading(true);
      const availableVaults = await getVaults();
      console.log('availableVaults', availableVaults);
      setVaults(availableVaults);
    } catch (error) {
      console.error('Error loading vaults:', error);
      Alert.alert('Error', 'Failed to load vaults. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalances = async () => {
    if (!selectedAccount) return;
    
    try {
      const balance = await getUserVaultBalance();
      setUserBalances({
        'SOL': balance
      });
      console.log('User vault balances loaded:', balance);
    } catch (error) {
      console.error('Error loading user balances:', error);
    }
  };

  const handleDeposit = async (vault: VaultInfo) => {
    if (!selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet first.');
      return;
    }

    setSelectedVault(vault);
    setShowDepositModal(true);
  };

  const handleDepositConfirm = async (vaultSymbol: string, amount: number): Promise<string> => {
    try {
      setDepositing(vaultSymbol);
      const signature = await depositToVault(amount);
      await loadUserBalances();
      return signature;
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    } finally {
      setDepositing(null);
    }
  };

  const handleTestWallet = async () => {
    if (!selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet first.');
      return;
    }

    try {
      console.log('Starting wallet test...');
      const signature = await testWallet();
      Alert.alert(
        'Wallet Test Successful! ✅',
        `Basic wallet functionality works correctly.\n\nTransaction: ${signature}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Wallet test failed:', error);
      Alert.alert(
        'Wallet Test Failed ❌',
        `Error: ${error?.message || 'Unknown error'}\n\nThis indicates a problem with the basic wallet integration.`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num);
  };

  const getVaultIcon = (type: string, index: number) => {
    if (type === 'Boosted' || index === 0) return require('../../assets/star.png');
    if (type === 'Protected') return require('../../assets/shield.png');
    return require('../../assets/vault.png');
  };

  const getVaultType = (vault: VaultInfo, index: number) => {
    if (index === 0) return 'Boosted';
    if (index === 2) return 'Protected'; 
    return 'Vault';
  };

  const getAmountColor = (amount: number) => {
    if (amount < 0) return '#FF6B6B';
    if (amount > 0) return '#4CAF50';
    return '#F4A261';
  };

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4A261" />
        <Text style={styles.loadingText}>Loading vaults...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Vault Title */}
        <Text style={styles.vaultTitle}>Vault</Text>
        
        {/* Total Balance Card */}
        <Card style={styles.totalBalanceCard}>
          <Card.Content style={styles.totalBalanceContent}>
            <Text style={styles.totalBalanceLabel}>Total Balance</Text>
            <Text style={styles.totalBalanceAmount}>$12,485.92</Text>
            <View style={styles.apyBadge}>
                    <Text style={styles.apyText}>+2,45% today</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Investments Section */}
        <Text style={styles.sectionTitle}>Investments</Text>
        
        <View style={styles.investmentsList}>
          {/* Sample investment items matching the design */}
          <TouchableOpacity 
            style={styles.investmentItem}
            onPress={() => vaults.length > 0 && handleDeposit(vaults[0])}
          >
            <View style={styles.investmentLeft}>
              <View style={[styles.iconContainer, styles.boostedIcon]}>
                <MaterialCommunityIcon name="star" size={20} color="#F4A261" />
              </View>
              <View style={styles.investmentInfo}>
                <Text style={styles.investmentName}>Boosted</Text>
                <Text style={styles.investmentDate}>July 14th At 2:38PM</Text>
              </View>
            </View>
            <Text style={[styles.investmentAmount, { color: '#FF6B6B' }]}>-$8.30</Text>
          </TouchableOpacity>

          {vaults.map((vault, index) => {
            const userBalance = userBalances[vault.tokenSymbol];
            const vaultType = getVaultType(vault, index);
            const iconSource = getVaultIcon(vaultType, index);
            const withdrawableAmount = userBalance?.withdrawableAmount || 0;
            const isProtected = vaultType === 'Protected';
            
            return (
              <TouchableOpacity 
                key={vault.vault.toString()} 
                style={styles.investmentItem}
                onPress={() => handleDeposit(vault)}
              >
                <View style={styles.investmentLeft}>
                  <View style={[
                    styles.iconContainer, 
                    isProtected ? styles.protectedIcon : styles.vaultIcon
                  ]}>
                    <Image 
                      source={iconSource} 
                      style={{ width: 24, height: 24 }} 
                      resizeMode="contain" 
                    />
                  </View>
                  <View style={styles.investmentInfo}>
                    <Text style={styles.investmentName}>{vaultType}</Text>
                    <Text style={styles.investmentDate}>July 14th At 2:38PM</Text>
                  </View>
                </View>
                <Text style={[
                  styles.investmentAmount, 
                  { color: getAmountColor(withdrawableAmount) }
                ]}>
                  {formatAmount(withdrawableAmount)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FontFamilies.Larken.Medium,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  vaultTitle: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    color: '#F4A261',
    marginBottom: 24,
  },
  totalBalanceCard: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    marginBottom: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  totalBalanceContent: {
    padding: 24,
    alignItems: 'center',
  },
  totalBalanceLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalBalanceAmount: {
    fontSize: 36,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#F4A261',
    marginBottom: 12,
    textAlign: 'center',
  },
  changeText: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  investmentsList: {
    gap: 12,
  },
  investmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(13, 69, 50, 0.14)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  investmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  boostedIcon: {
    backgroundColor: 'rgba(244, 162, 97, 0.2)',
  },
  vaultIcon: {
    backgroundColor: 'rgba(244, 162, 97, 0.2)',
  },
  protectedIcon: {
    backgroundColor: 'rgba(244, 162, 97, 0.2)',
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  investmentDate: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  investmentAmount: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Bold,
  },
}); 