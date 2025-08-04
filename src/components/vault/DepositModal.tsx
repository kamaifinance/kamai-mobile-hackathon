import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { VaultInfo } from '../../hooks/useVaultService';
import { FontFamilies } from '../../styles/fonts';
import { SuccessAlert } from '../ui/SuccessAlert';

interface DepositModalProps {
  visible: boolean;
  vault: VaultInfo | null;
  onClose: () => void;
  onDeposit: (vault: VaultInfo, amount: number) => Promise<string>;
  loading?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

export default function DepositModal({
  visible,
  vault,
  onClose,
  onDeposit,
  loading = false,
}: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Helper to map vault type
  const getVaultType = (symbol: string) => {
    if (symbol === 'SOL') return 'LSTs';
    return symbol;
  };

  const getVaultCardStyle = (symbol: string) => {
    const vaultType = getVaultType(symbol);
    if (vaultType === 'Protected') return styles.protectedCard;
    if (vaultType === 'Boosted') return styles.boostedCard;
    return styles.premiumCard;
  };

  const handleDeposit = async () => {
    if (!vault || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setDepositing(true);
      const signature = await onDeposit(vault, numAmount);
      
      setSuccessMessage(`Successfully deposited ${amount} ${vault.tokenSymbol} to ${getVaultType(vault.tokenSymbol)} vault.`);
      setAmount('');
      onClose();
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Error depositing:', error);
      Alert.alert('Error', 'Failed to deposit. Please try again.');
    } finally {
      setDepositing(false);
    }
  };

  const handleClose = () => {
    if (!depositing) {
      setAmount('');
      onClose();
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={styles.bottomSheet}>
          <ImageBackground
            source={require('../../../assets/kamai_mobile_bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              {/* Handle Bar */}
              <View style={styles.handleBar} />
              
              {/* Title */}
              <Text style={styles.title}>Deposit to LSTs Vault</Text>

              {/* Vault Information Card */}
              {vault && (
                <View style={[styles.vaultInfoCard, getVaultCardStyle(vault.tokenSymbol)]}>
                  <ImageBackground
                    source={require('../../../assets/vault_boosted.png')}
                    style={styles.vaultCardBackground}
                    resizeMode="cover"
                  >
                    <View style={styles.vaultCardContent}>
                      <View style={styles.vaultHeader}>
                        <Text style={styles.vaultName}>{getVaultType(vault.tokenSymbol)}</Text>
                        <View style={styles.vaultBadge}>
                          <Text style={styles.vaultSymbol}>DEVNET</Text>
                        </View>
                      </View>
                      {vault.apy && (
                        <View style={styles.apyContainer}>
                          <View style={styles.apyCardBadge}>
                            <Text style={styles.apyCardValue}>{vault.apy.toFixed(2)}%</Text>
                          </View>
                          <Text style={styles.apyCardLabel}>APY (30 days avg.)</Text>
                        </View>
                      )}
                    </View>
                  </ImageBackground>
                </View>
              )}

              {/* Amount Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Amount to deposit</Text>
                <View style={styles.inputCard}>
                  <ImageBackground
                    source={require('../../../assets/vault_normal.png')}
                    style={styles.inputCardBackground}
                    resizeMode="cover"
                  >
                    <View style={styles.inputCardContent}>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.amountInput}
                          value={amount}
                          onChangeText={setAmount}
                          placeholder="0"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          keyboardType="numeric"
                          editable={!depositing}
                        />
                        {vault && (
                          <View style={styles.tokenBadge}>
                            <Text style={styles.tokenText}>{vault.tokenSymbol}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, depositing && styles.disabledButton]}
                  onPress={handleClose}
                  disabled={depositing}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.depositButton,
                    (!amount || depositing) && styles.depositButtonDisabled,
                  ]}
                  onPress={handleDeposit}
                  disabled={!amount || depositing}
                >
                  {depositing ? (
                    <ActivityIndicator size="small" color="#1B3A32" />
                  ) : (
                    <Text style={styles.depositButtonText}>Deposit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ImageBackground>
        </View>
      </View>
    </Modal>

    <SuccessAlert
      visible={showSuccessAlert}
      message={successMessage}
      onDismiss={() => {
        setShowSuccessAlert(false);
      }}
      />
    </>
    );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  vaultInfoCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 4,
  },
  vaultCardBackground: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  vaultCardContent: {
    padding: 20,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vaultName: {
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    flex: 1,
  },
  vaultBadge: {
    backgroundColor: 'rgba(221, 177, 91, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDB15B',
  },
  vaultSymbol: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#DDB15B',
  },
  apyContainer: {
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
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#DDB15B',
    marginBottom: 12,
  },
  inputCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  inputCardBackground: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputCardContent: {
    padding: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    padding: 0,
    textAlign: 'left',
  },
  tokenBadge: {
    backgroundColor: 'rgba(221, 177, 91, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDB15B',
  },
  tokenText: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#DDB15B',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  depositButton: {
    flex: 1,
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#1B3A32',
  },
  depositButtonDisabled: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
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
}); 