import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Text, Alert, ActivityIndicator } from 'react-native';
import { Card, Button } from 'react-native-paper';
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from 'expo-image-picker';
import { FontFamilies } from '../styles/fonts';
import { useAuthorization } from '../utils/useAuthorization';
import { useMobileWallet } from '../utils/useMobileWallet';
import { userService, storageService, User } from '../../lib/supabase';
import { PersonalInformationForm } from '../components/profile/PersonalInformationForm';
import { ConnectWalletAlert } from '../components/ui/ConnectWalletAlert';

export function ProfileScreen() {
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [showConnectWalletAlert, setShowConnectWalletAlert] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { selectedAccount } = useAuthorization();
  const { connect, disconnect } = useMobileWallet();

  useEffect(() => {
    loadUserData();
  }, [selectedAccount]);

  const loadUserData = async () => {
    if (!selectedAccount) {
      setUserData(null);
      return;
    }

    try {
      const data = await userService.getUserByWallet(selectedAccount.publicKey.toBase58());
      console.log('User data:', data);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(null);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (connectingWallet) return;
      setConnectingWallet(true);
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setShowConnectWalletAlert(true);
    } finally {
      setConnectingWallet(false);
    }
  };

  const handlePersonalInfo = () => {
    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }
    setShowPersonalInfoForm(true);
  };

  const handlePersonalInfoClose = () => {
    setShowPersonalInfoForm(false);
    // Reload user data after form is closed (in case it was updated)
    loadUserData();
  };


  const handleLogOut = async () => {
    try {
      console.log('Logging out user...');
      await disconnect();
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  const pickImage = async () => {
    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }

    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    // Launch image picker with base64
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.8,
      base64: true, // Add base64 data
    });

    if (!result.canceled && result.assets[0].base64) {
      await uploadProfileImage(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }

    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    // Launch camera with base64
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.8,
      base64: true, // Add base64 data
    });

    if (!result.canceled && result.assets[0].base64) {
      await uploadProfileImage(result.assets[0].base64);
    }
  };

  const showImagePicker = () => {
    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }

    Alert.alert(
      'Select Image',
      'Choose how you want to select your profile image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadProfileImage = async (base64Data: string) => {
    if (!selectedAccount) return;

    try {
      setUploadingImage(true);
      
      const profileImageUrl = await storageService.uploadProfileImage(
        base64Data,
        selectedAccount.publicKey.toBase58(),
        'image/jpeg'
      );

      // Update user data with new profile image
      const updatedUserData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        name: userData?.name || '',
        email: userData?.email || undefined,
        wallet: selectedAccount.publicKey.toBase58(),
        profile_image: profileImageUrl,
      };

      await userService.upsertUser(updatedUserData);
      
      // Reload user data to show updated image
      await loadUserData();
      
      Alert.alert('Success!', 'Profile image updated successfully.');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getUserDisplayName = () => {
    // If user has a name in database, show it, otherwise show "Connected User"
    if (userData?.name) return userData.name;
    return 'Guest User';
  };

  const getUserEmail = () => {
    // Show the truncated connected wallet address (public key)
    if (selectedAccount) {
      const address = typeof selectedAccount === 'string'
        ? selectedAccount
        : selectedAccount?.publicKey?.toString?.() || '';
      if (address && address.length > 8) {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
      }
      return address || 'Wallet Connected';
    }
    return '';
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Title */}
          <Text style={styles.profileTitle}>Profile</Text>
          
          {/* Profile Card */}
          <Card style={styles.profileCard}>
            <Card.Content style={styles.profileContent}>
              {/* Profile Avatar */}
              <View style={styles.avatarContainer}>
                <TouchableOpacity 
                  style={styles.avatar} 
                  onPress={showImagePicker}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color="#DDB15B" />
                    </View>
                  ) : userData?.profile_image ? (
                    <Image 
                      source={{ uri: userData.profile_image }} 
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Image 
                      source={require('../../assets/guest_user.png')} 
                      style={styles.avatarImage}
                    />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* User Info */}
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
              {selectedAccount && (
                <Text style={styles.userEmail}>{getUserEmail()}</Text>
              )}
              
              {/* Premium Badge or Connect Button */}
              {!selectedAccount && (
                <Button
                  mode="contained"
                  onPress={handleConnectWallet}
                  disabled={connectingWallet}
                  style={styles.connectButton}
                  buttonColor="#DDB15B"
                  textColor="#1B3A32"
                >
                  {connectingWallet ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Account Section */}
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.accountMenu}>
            {/* Personal Information */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handlePersonalInfo}
            >
              <View style={styles.menuLeft}>
                <Image 
                    source={require('../../assets/personal_info.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Personal Information</Text>
                  {!selectedAccount && (
                    <Text style={styles.menuSubtext}>Connect wallet to access</Text>
                  )}
                </View>
              </View>
              <MaterialCommunityIcon 
                name="chevron-right" 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>


            {/* Log Out */}
            {selectedAccount && (
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]} 
                onPress={handleLogOut}
              >
                <View style={styles.menuLeft}>
                  
                  <Image 
                    source={require('../../assets/logout.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
             
                  <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
                </View>
                <MaterialCommunityIcon 
                  name="chevron-right" 
                  size={20} 
                  color="#FF6B6B" 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Personal Information Form Modal */}
      <PersonalInformationForm
        visible={showPersonalInfoForm}
        onClose={handlePersonalInfoClose}
      />
      
      {/* Connect Wallet Alert */}
      <ConnectWalletAlert
        visible={showConnectWalletAlert}
        onDismiss={() => setShowConnectWalletAlert(false)}
        title="Connection Failed"
        message="Failed to connect wallet. Please try again."
      />
    </>
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
  profileTitle: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    color: '#DDB15B',
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: 'rgba(13, 69, 50, 0.14)',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  profileContent: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  userName: {
    fontSize: 24,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 162, 97, 0.2)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  premiumText: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#F4A261',
  },
  connectButton: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(13, 69, 50, 0.14)',  
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },  
  statNumber: {
    fontSize: 28,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  accountMenu: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(4, 23, 19, 1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B3834',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  logoutItem: {
    backgroundColor: '#3D2A2A',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  personalIcon: {
    backgroundColor: 'rgba(244, 162, 97, 0.2)',
  },
  termsIcon: {
    backgroundColor: 'rgba(244, 162, 97, 0.2)',
  },
  logoutIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    marginLeft: 20,
  },
  menuSubtext: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#666',
    marginTop: 2,
    marginLeft: 20,
  },
  logoutText: {
    color: '#FF6B6B',
  },
  uploadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 40,
  },
}); 