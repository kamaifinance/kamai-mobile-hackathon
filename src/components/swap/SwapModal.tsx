import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { FontFamilies } from '../../styles/fonts';
import { DammPool, SwapQuote } from '../../utils/dammService';
import { SuccessAlert } from '../ui/SuccessAlert';

interface SwapModalProps {
  visible: boolean;
  pools: DammPool[];
  onClose: () => void;
  onSwap: (poolId: string, inputAmount: number, minOutputAmount: number, inputToken: string) => Promise<string>;
  onGetQuote: (poolId: string, inputAmount: number, inputToken: string) => Promise<SwapQuote>;
  loading: boolean;
}

export default function SwapModal({
  visible,
  pools,
  onClose,
  onSwap,
  onGetQuote,
  loading,
}: SwapModalProps) {
  const [selectedPool, setSelectedPool] = useState<DammPool | null>(null);
  const [inputAmount, setInputAmount] = useState('');
  const [inputToken, setInputToken] = useState('SOL');
  const [outputToken, setOutputToken] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [gettingQuote, setGettingQuote] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPool(null);
      setInputAmount('');
      setInputToken('SOL');
      setOutputToken('');
      setQuote(null);
    }
  }, [visible]);

  // Set output token when pool is selected
  useEffect(() => {
    if (selectedPool) {
      if (inputToken === selectedPool.tokenASymbol) {
        setOutputToken(selectedPool.tokenBSymbol);
      } else {
        setOutputToken(selectedPool.tokenASymbol);
      }
    }
  }, [selectedPool, inputToken]);

  const handlePoolSelect = (pool: DammPool) => {
    setSelectedPool(pool);
    setQuote(null);
  };

  const handleTokenSwap = () => {
    if (!selectedPool) return;
    
    const newInputToken = outputToken;
    const newOutputToken = inputToken;
    setInputToken(newInputToken);
    setOutputToken(newOutputToken);
    setQuote(null);
  };

  const handleGetQuote = async () => {
    if (!selectedPool || !inputAmount) return;

    const numAmount = parseFloat(inputAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setGettingQuote(true);
      const newQuote = await onGetQuote(selectedPool.id, numAmount, inputToken);
      setQuote(newQuote);
    } catch (error) {
      console.error('Error getting quote:', error);
      Alert.alert('Error', 'Failed to get quote. Please try again.');
    } finally {
      setGettingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedPool || !quote || !inputAmount) return;

    const numAmount = parseFloat(inputAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setSwapping(true);
      const signature = await onSwap(
        selectedPool.id,
        numAmount,
        quote.minimumReceived,
        inputToken
      );
      
      setSuccessMessage(
        `Successfully swapped ${inputAmount} ${inputToken} for ${quote.outputAmount.toFixed(4)} ${outputToken}`
      );
      setInputAmount('');
      setQuote(null);
      onClose();
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Error swapping:', error);
      Alert.alert('Error', 'Failed to swap. Please try again.');
    } finally {
      setSwapping(false);
    }
  };

  const handleClose = () => {
    if (!swapping && !gettingQuote) {
      setInputAmount('');
      setQuote(null);
      onClose();
    }
  };

  // Get quote automatically when input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedPool && inputAmount && parseFloat(inputAmount) > 0) {
        handleGetQuote();
      } else {
        setQuote(null);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [inputAmount, selectedPool, inputToken]);

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
                <Text style={styles.title}>Swap Tokens</Text>

                {/* Pool Selection */}
                {!selectedPool ? (
                  <View style={styles.poolSelection}>
                    <Text style={styles.sectionTitle}>Select Trading Pair</Text>
                    {pools.map((pool) => (
                      <TouchableOpacity
                        key={pool.id}
                        style={styles.poolCard}
                        onPress={() => handlePoolSelect(pool)}
                      >
                        <View style={styles.poolHeader}>
                          <Text style={styles.poolPair}>
                            {pool.tokenASymbol}/{pool.tokenBSymbol}
                          </Text>
                          <View style={styles.poolBadge}>
                            <Text style={styles.poolBadgeText}>DEVNET</Text>
                          </View>
                        </View>
                        <Text style={styles.poolVolume}>
                          ${pool.volume24h.toLocaleString()} 24h Vol
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.swapInterface}>
                    {/* Selected Pool Info */}
                    <View style={styles.selectedPoolCard}>
                      <View style={styles.poolHeader}>
                        <Text style={styles.poolPair}>
                          {selectedPool.tokenASymbol}/{selectedPool.tokenBSymbol}
                        </Text>
                        <TouchableOpacity
                          style={styles.changePoolButton}
                          onPress={() => setSelectedPool(null)}
                        >
                          <Text style={styles.changePoolText}>Change</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Input Section */}
                    <View style={styles.inputSection}>
                      <Text style={styles.inputLabel}>From</Text>
                      <View style={styles.inputCard}>
                        <View style={styles.inputRow}>
                          <TextInput
                            style={styles.amountInput}
                            value={inputAmount}
                            onChangeText={setInputAmount}
                            placeholder="0"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            keyboardType="numeric"
                            editable={!swapping && !gettingQuote}
                          />
                          <View style={styles.tokenBadge}>
                            <Text style={styles.tokenText}>{inputToken}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Swap Button */}
                    <View style={styles.swapButtonContainer}>
                      <TouchableOpacity
                        style={styles.swapDirectionButton}
                        onPress={handleTokenSwap}
                        disabled={swapping || gettingQuote}
                      >
                        <Text style={styles.swapDirectionText}>⇅</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Output Section */}
                    <View style={styles.inputSection}>
                      <Text style={styles.inputLabel}>To</Text>
                      <View style={styles.inputCard}>
                        <View style={styles.inputRow}>
                          <Text style={styles.outputAmount}>
                            {gettingQuote ? 'Getting quote...' : quote ? quote.outputAmount.toFixed(4) : '0'}
                          </Text>
                          <View style={styles.tokenBadge}>
                            <Text style={styles.tokenText}>{outputToken}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Quote Details */}
                    {quote && (
                      <View style={styles.quoteDetails}>
                        <View style={styles.quoteRow}>
                          <Text style={styles.quoteLabel}>Price Impact</Text>
                          <Text style={[styles.quoteValue, { color: quote.priceImpact > 3 ? '#FF6B6B' : '#4CAF50' }]}>
                            {quote.priceImpact.toFixed(2)}%
                          </Text>
                        </View>
                        <View style={styles.quoteRow}>
                          <Text style={styles.quoteLabel}>Minimum Received</Text>
                          <Text style={styles.quoteValue}>
                            {quote.minimumReceived.toFixed(4)} {outputToken}
                          </Text>
                        </View>
                        <View style={styles.quoteRow}>
                          <Text style={styles.quoteLabel}>Fee</Text>
                          <Text style={styles.quoteValue}>{quote.fee.toFixed(4)} {inputToken}</Text>
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.cancelButton, (swapping || gettingQuote) && styles.disabledButton]}
                        onPress={handleClose}
                        disabled={swapping || gettingQuote}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.swapButton,
                          (!inputAmount || !quote || swapping || gettingQuote) && styles.swapButtonDisabled,
                        ]}
                        onPress={handleSwap}
                        disabled={!inputAmount || !quote || swapping || gettingQuote}
                      >
                        {swapping ? (
                          <ActivityIndicator size="small" color="#1B3A32" />
                        ) : (
                          <Text style={styles.swapButtonText}>Swap</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </ImageBackground>
          </View>
        </View>
      </Modal>

      <SuccessAlert
        visible={showSuccessAlert}
        message={successMessage}
        onDismiss={() => setShowSuccessAlert(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    textAlign: 'center',
    marginBottom: 24,
  },
  poolSelection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  poolCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  poolPair: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
  },
  poolBadge: {
    backgroundColor: '#DDB15B',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  poolBadgeText: {
    fontSize: 8,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
  poolVolume: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  swapInterface: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectedPoolCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  changePoolButton: {
    backgroundColor: 'rgba(221, 177, 91, 0.2)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changePoolText: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#DDB15B',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginRight: 12,
  },
  outputAmount: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginRight: 12,
  },
  tokenBadge: {
    backgroundColor: '#DDB15B',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#000000',
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapDirectionButton: {
    backgroundColor: 'rgba(221, 177, 91, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDB15B',
  },
  swapDirectionText: {
    fontSize: 18,
    color: '#DDB15B',
  },
  quoteDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  quoteValue: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B3834',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#FFFFFF',
  },
  swapButton: {
    flex: 1,
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  swapButtonDisabled: {
    backgroundColor: 'rgba(221, 177, 91, 0.3)',
  },
  swapButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Bold,
    color: '#1B3A32',
  },
  disabledButton: {
    opacity: 0.5,
  },
});