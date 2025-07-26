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
} from 'react-native';
import { VaultInfo } from '../../hooks/useVaultService';

interface DepositModalProps {
  visible: boolean;
  vault: VaultInfo | null;
  onClose: () => void;
  onDeposit: (vaultSymbol: string, amount: number) => Promise<string>;
  loading?: boolean;
}

export default function DepositModal({
  visible,
  vault,
  onClose,
  onDeposit,
  loading = false,
}: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const handleDeposit = async () => {
    if (!vault || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setDepositing(true);
      const signature = await onDeposit(vault.vault, numAmount);
      
      Alert.alert(
        'Success!',
        `Successfully deposited ${amount} ${vault.tokenSymbol} to ${vault.name}.\nTransaction: ${signature}`,
        [
          {
            text: 'View on Explorer',
            onPress: () => {
              // You could open the explorer URL here
              console.log('Transaction signature:', signature);
            },
          },
          { 
            text: 'OK',
            onPress: () => {
              setAmount('');
              onClose();
            },
          },
        ]
      );
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Deposit to Vault</Text>
            <TouchableOpacity onPress={handleClose} disabled={depositing}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {vault && (
            <View style={styles.vaultInfo}>
              <Text style={styles.vaultName}>{vault.name}</Text>
              <Text style={styles.vaultSymbol}>{vault.tokenSymbol}</Text>
              {vault.apy && (
                <Text style={styles.apy}>APY: {vault.apy.toFixed(2)}%</Text>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount to deposit</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.0"
                keyboardType="numeric"
                editable={!depositing}
              />
              {vault && (
                <Text style={styles.tokenSymbol}>{vault.tokenSymbol}</Text>
              )}
            </View>
          </View>

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
                (!amount || depositing) && styles.disabledButton,
              ]}
              onPress={handleDeposit}
              disabled={!amount || depositing}
            >
              {depositing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.depositButtonText}>Deposit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  vaultInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vaultSymbol: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  apy: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  depositButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 