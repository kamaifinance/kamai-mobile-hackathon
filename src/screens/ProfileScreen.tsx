import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { FontFamilies } from '../styles/fonts';
import { useAuthorization } from '../utils/useAuthorization';
import { useMobileWallet } from '../utils/useMobileWallet';
import { userService, User } from '../../lib/supabase';
import { PersonalInformationForm } from '../components/profile/PersonalInformationForm';

export function ProfileScreen() {
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
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
      setLoading(true);
      const data = await userService.getUserByWallet(selectedAccount.publicKey.toBase58());
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (connectingWallet) return;
      setConnectingWallet(true);
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setConnectingWallet(false);
    }
  };

  const handlePersonalInfo = () => {
    if (!selectedAccount) {
      alert('Please connect your wallet first to access personal information.');
      return;
    }
    setShowPersonalInfoForm(true);
  };

  const handlePersonalInfoClose = () => {
    setShowPersonalInfoForm(false);
    // Reload user data after form is closed (in case it was updated)
    loadUserData();
  };

  const handleTermsConditions = () => {
    console.log('Navigate to Terms & Conditions');
    // TODO: Implement terms and conditions navigation
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

  const formatWalletAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getUserDisplayName = () => {
    // If user has a name in database, show it, otherwise show "Connected User"
    if (userData?.name) return userData.name;
    if (selectedAccount) return 'Bhavya Gor';
    return 'Guest User';
  };

  const getUserEmail = () => {
    // Email should show the wallet address (public key)
    if (selectedAccount) {
      return "bhavya@gmail.com"
    }
    return 'Connect your wallet';
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
              {loading ? (
                <ActivityIndicator size="large" color="#F4A261" />
              ) : (
                <>
                  {/* Profile Avatar */}
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      {userData?.profile_image ? (
                        <Image 
                          source={{ uri: userData.profile_image }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <MaterialCommunityIcon 
                          name="account" 
                          size={60} 
                          color="#666" 
                        />
                      )}
                    </View>
                  </View>
                  
                  {/* User Info */}
                  <Text style={styles.userName}>{getUserDisplayName()}</Text>
                  <Text style={styles.userEmail}>{getUserEmail()}</Text>
                  
                  {/* Premium Badge or Connect Button */}
                  {!selectedAccount && (
                    <Button
                      mode="contained"
                      onPress={handleConnectWallet}
                      disabled={connectingWallet}
                      style={styles.connectButton}
                      buttonColor="#F4A261"
                      textColor="#1B3A32"
                    >
                      {connectingWallet ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statNumber}>24</Text>
                  <Text style={styles.statLabel}>Total Return</Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statNumber}>8</Text>
                  <Text style={styles.statLabel}>Total Return</Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statNumber}>156</Text>
                  <Text style={styles.statLabel}>Total Return</Text>
                </Card.Content>
              </Card>
            </View>
          </View>

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

            {/* Terms & Conditions */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleTermsConditions}
            >
              <View style={styles.menuLeft}>
                 <Image 
                    source={require('../../assets/terms_and_conditions.png')}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                
                <Text style={styles.menuText}>Terms & Conditions</Text>
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
    fontFamily: FontFamilies.Larken.Regular,
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
    fontFamily: FontFamilies.Larken.Medium,
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
    fontFamily: FontFamilies.Larken.Regular,
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
    backgroundColor: 'rgba(13, 69, 50, 0.14)',
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
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
    marginLeft: 20,
  },
  menuSubtext: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#666',
    marginTop: 2,
  },
  logoutText: {
    color: '#FF6B6B',
  },
}); 