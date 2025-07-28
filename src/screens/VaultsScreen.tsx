import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useVaultService, VaultInfo, UserVaultBalance } from '../hooks/useVaultService';
import { useVaultContext } from '../context';
import { useAuthorization } from '../utils/useAuthorization';
import DepositModal from '../components/vault/DepositModal';
import { FontFamilies } from '../styles/fonts';

export default function VaultsScreen() {
  const { vaults, userBalances, vaultDetails, refreshUserBalances } = useVaultContext();
  const [depositing, setDepositing] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
  const { selectedAccount } = useAuthorization();
  const { depositToVault, testWallet } = useVaultService();

  // All vault data is now handled by VaultContext

  const handleDeposit = async (vault: VaultInfo) => {
    if (!selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet first.');
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

  // Helper to map vault type
  const getVaultType = (symbol: string) => {
    if (symbol === 'SOL') return 'Boosted';
    if (symbol === 'USDC-Dev') return 'Protected';
    if (symbol === 'mSOL') return 'Vault';
    return symbol;
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

  // Aggregate total balance and APY
  const totalBalance = vaults.reduce((sum: number, v: VaultInfo) => sum + (userBalances[v.tokenSymbol]?.withdrawableAmount || 0) * (vaultDetails[v.tokenSymbol]?.usd_rate || 1), 0);
  // Weighted average APY by TVL
  const totalTVL = vaults.reduce((sum: number, v: VaultInfo) => sum + (vaultDetails[v.tokenSymbol]?.total_amount_with_profit || 0) * (vaultDetails[v.tokenSymbol]?.usd_rate || 1), 0);
  const weightedApy = totalTVL > 0 ? vaults.reduce((sum: number, v: VaultInfo) => sum + ((vaultDetails[v.tokenSymbol]?.total_amount_with_profit || 0) * (vaultDetails[v.tokenSymbol]?.usd_rate || 1) * (vaultDetails[v.tokenSymbol]?.closest_apy || 0)), 0) / totalTVL : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Vault Title */}
        <Text style={styles.vaultTitle}>Vault</Text>
        {/* Total Balance Card */}
        <Card style={styles.totalBalanceCard}>
          <Card.Content style={styles.totalBalanceContent}>
            <Text style={styles.totalBalanceLabel}>Total Balance</Text>
            <Text style={styles.totalBalanceAmount}>${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <View style={styles.apyBadge}>
              <Text style={styles.apyText}>{weightedApy > 0 ? `+${weightedApy.toFixed(2)}% today` : 'N/A'}</Text>
            </View>
          </Card.Content>
        </Card>
        {/* Investments Section */}
        <Text style={styles.sectionTitle}>Investments</Text>
        <View style={styles.investmentsList}>
          {vaults.map((vault, index) => {
            const userBalance = userBalances[vault.tokenSymbol];
            const details = vaultDetails[vault.tokenSymbol];
            const vaultType = getVaultType(vault.tokenSymbol);
            const iconSource = getVaultIcon(vaultType, index);
            const withdrawableAmount = userBalance?.withdrawableAmount || 0;
            const isProtected = vaultType === 'Protected';
            return (
              <TouchableOpacity
                key={vault.tokenSymbol}
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
                    <Text style={styles.investmentDate}>APY: {details?.closest_apy ? `${details.closest_apy.toFixed(2)}%` : 'N/A'}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.investmentAmount,
                  { color: getAmountColor(withdrawableAmount) }
                ]}>
                  ${withdrawableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  content: {
    padding: 20,
    paddingTop: 60,
  },
  vaultTitle: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    color: '#DDB15B',
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
    color: '#DDB15B',
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