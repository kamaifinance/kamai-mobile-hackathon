import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Card } from 'react-native-paper';
import { FontFamilies } from '../../styles/fonts';
import { DammPool } from '../../utils/dammService';
import { useAuthorization } from '../../utils/useAuthorization';
import { useDammService } from '../../hooks/useDammService';

interface DepositModalProps {
  visible: boolean;
  pool: DammPool | null;
  onClose: () => void;
  onDeposit: (pool: DammPool, tokenAAmount: number, tokenBAmount: number) => Promise<string>;
  loading?: boolean;
}

export default function DepositModal({
  visible,
  pool,
  onClose,
  onDeposit,
  loading = false,
}: DepositModalProps) {
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const { selectedAccount } = useAuthorization();
  const { getUserBalance } = useDammService();
  const isUpdatingRef = useRef(false);

  // Reset amounts when pool changes
  useEffect(() => {
    if (pool) {
      setTokenAAmount('');
      setTokenBAmount('');
    }
  }, [pool]);

  // Calculate optimal token B amount when token A amount changes
  useEffect(() => {
    if (pool && tokenAAmount && parseFloat(tokenAAmount) > 0 && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const amountA = parseFloat(tokenAAmount);
      const ratio = pool.tokenBReserve / pool.tokenAReserve;
      const optimalAmountB = amountA * ratio;
      setTokenBAmount(optimalAmountB.toFixed(6));
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [pool, tokenAAmount]);

  // Calculate optimal token A amount when token B amount changes
  useEffect(() => {
    if (pool && tokenBAmount && parseFloat(tokenBAmount) > 0 && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const amountB = parseFloat(tokenBAmount);
      const ratio = pool.tokenAReserve / pool.tokenBReserve;
      const optimalAmountA = amountB * ratio;
      setTokenAAmount(optimalAmountA.toFixed(6));
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [pool, tokenBAmount]);

  const handleDeposit = async () => {
    if (!pool || !selectedAccount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountA = parseFloat(tokenAAmount);
    const amountB = parseFloat(tokenBAmount);
    
    if (isNaN(amountA) || amountA <= 0) {
      Alert.alert('Error', 'Please enter a valid amount for token A');
      return;
    }

    if (isNaN(amountB) || amountB <= 0) {
      Alert.alert('Error', 'Please enter a valid amount for token B');
      return;
    }

    try {
      setDepositLoading(true);
      const signature = await onDeposit(pool, amountA, amountB);
      Alert.alert('Success', `Liquidity added! Signature: ${signature}`);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add liquidity');
    } finally {
      setDepositLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  };

  const calculatePoolShare = () => {
    if (!pool || !tokenAAmount || !tokenBAmount) return 0;
    
    const amountA = parseFloat(tokenAAmount);
    const amountB = parseFloat(tokenBAmount);
    const totalValue = amountA + amountB;
    const poolValue = pool.tokenAReserve + pool.tokenBReserve;
    
    return (totalValue / poolValue) * 100;
  };

  const calculateEstimatedFees = () => {
    const poolShare = calculatePoolShare();
    return (pool.totalFees24h * poolShare) / 100;
  };

  if (!pool) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Add Liquidity</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Card style={styles.poolCard}>
              <Card.Content>
                <Text style={styles.poolTitle}>
                  {pool.tokenASymbol}/{pool.tokenBSymbol}
                </Text>
                <Text style={styles.poolSubtitle}>
                  Fee: {(pool.fee * 100).toFixed(2)}% • APY: {pool.apy.toFixed(1)}%
                </Text>
                <Text style={styles.poolInfo}>
                  Pool Value: ${formatNumber(pool.liquidity)}
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount {pool.tokenASymbol}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.amountInput}
                  value={tokenAAmount}
                  onChangeText={setTokenAAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
                <Text style={styles.tokenSymbol}>{pool.tokenASymbol}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount {pool.tokenBSymbol}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.amountInput}
                  value={tokenBAmount}
                  onChangeText={setTokenBAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
                <Text style={styles.tokenSymbol}>{pool.tokenBSymbol}</Text>
              </View>
            </View>

            {tokenAAmount && tokenBAmount && (
              <Card style={styles.infoCard}>
                <Card.Content>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Pool Share:</Text>
                    <Text style={styles.infoValue}>
                      {calculatePoolShare().toFixed(4)}%
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estimated Daily Fees:</Text>
                    <Text style={styles.infoValue}>
                      ${formatNumber(calculateEstimatedFees())}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Value:</Text>
                    <Text style={styles.infoValue}>
                      ${formatNumber(parseFloat(tokenAAmount || '0') + parseFloat(tokenBAmount || '0'))}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}

            <TouchableOpacity
              style={[
                styles.depositButton,
                (!tokenAAmount || !tokenBAmount || depositLoading || loading) && styles.depositButtonDisabled
              ]}
              onPress={handleDeposit}
              disabled={!tokenAAmount || !tokenBAmount || depositLoading || loading}
            >
              {depositLoading || loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.depositButtonText}>Add Liquidity</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B3834',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  poolCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  poolTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 4,
  },
  poolSubtitle: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  poolInfo: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B3834',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
  },
  tokenSymbol: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#DDB15B',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#DDB15B',
  },
  depositButton: {
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  depositButtonDisabled: {
    backgroundColor: '#666666',
  },
  depositButtonText: {
    fontSize: 18,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
}); 