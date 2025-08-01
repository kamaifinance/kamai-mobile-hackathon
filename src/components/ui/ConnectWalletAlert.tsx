import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { Typography } from '../../styles/typography';
import { useNavigation } from '@react-navigation/native';

interface ConnectWalletAlertProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  message?: string;
}

export function ConnectWalletAlert({ 
  visible, 
  onDismiss, 
  title = "Wallet Required",
  message = "Please connect your wallet first to continue."
}: ConnectWalletAlertProps) {
  const navigation = useNavigation();

  const handleOkayPress = () => {
    onDismiss();
    // Navigate to Profile tab
    navigation.navigate('Profile' as never);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.content}>
          <Text style={[Typography.h3, styles.title]}>{title}</Text>
          <Text style={[Typography.body, styles.message]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.okayButton} 
              onPress={handleOkayPress}
            >
              <Text style={[Typography.button, styles.okayButtonText]}>
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#041713',
    borderWidth: 1,
    borderColor: '#182622',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#DDB15B',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  okayButton: {
    backgroundColor: '#DDB15B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  okayButtonText: {
    color: '#041713',
    fontWeight: '600',
  },
});