import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Card, Button } from 'react-native-paper';
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from 'expo-image-picker';
import { FontFamilies } from '../../styles/fonts';
import { useAuthorization } from '../../utils/useAuthorization';
import { userService, storageService, User } from '../../../lib/supabase';
import { ConnectWalletAlert } from '../ui/ConnectWalletAlert';

interface PersonalInformationFormProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export function PersonalInformationForm({ visible, onClose }: PersonalInformationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConnectWalletAlert, setShowConnectWalletAlert] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const { selectedAccount } = useAuthorization();
  
  const nameInputRef = useRef<any>(null);
  const emailInputRef = useRef<any>(null);

  useEffect(() => {
    if (visible && selectedAccount) {
      loadUserData();
    }
  }, [visible, selectedAccount]);

  // Real-time validation
  useEffect(() => {
    if (nameTouched) {
      if (!name.trim()) {
        setNameError('Name is required');
      } else if (name.trim().length < 2) {
        setNameError('Name must be at least 2 characters');
      } else {
        setNameError('');
      }
    }
  }, [name, nameTouched]);

  useEffect(() => {
    if (emailTouched && email.trim()) {
      if (!validateEmail(email.trim())) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    } else if (emailTouched && !email.trim()) {
      setEmailError('');
    }
  }, [email, emailTouched]);

  const loadUserData = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      const userData = await userService.getUserByWallet(selectedAccount.publicKey.toBase58());
      
      if (userData) {
        setName(userData.name || '');
        setEmail(userData.email || '');
        setProfileImageUri(userData.profile_image || null);
        setProfileImageBase64(null); // Reset base64 data
      } else {
        // Reset form for new user
        setName('');
        setEmail('');
        setProfileImageUri(null);
        setProfileImageBase64(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load your profile data.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
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

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
      // Store base64 data for upload
      if (result.assets[0].base64) {
        setProfileImageBase64(result.assets[0].base64);
      }
      // Clear any existing stored image URL since we're uploading a new one
    }
  };

  const takePhoto = async () => {
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

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
      // Store base64 data for upload
      if (result.assets[0].base64) {
        setProfileImageBase64(result.assets[0].base64);
      }
      // Clear any existing stored image URL since we're uploading a new one
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Profile Image',
      'Choose how you want to select your profile image',
      [
        { text: '📷 Take Photo', onPress: takePhoto },
        { text: '🖼️ Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Mark all fields as touched to show validation errors
    setNameTouched(true);
    setEmailTouched(true);

    if (!selectedAccount) {
      setShowConnectWalletAlert(true);
      return;
    }

    if (!name.trim()) {
      setNameError('Name is required');
      nameInputRef.current?.focus();
      return;
    }

    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      nameInputRef.current?.focus();
      return;
    }

    if (email.trim() && !validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      emailInputRef.current?.focus();
      return;
    }

    try {
      setSaving(true);
      
      let profileImageUrl = null;
      
      // Upload profile image if there's base64 data (new image selected)
      if (profileImageBase64 && profileImageUri) {
        try {
          profileImageUrl = await storageService.uploadProfileImage(
            profileImageBase64,
            selectedAccount.publicKey.toBase58(),
            'image/jpeg' // Default content type
          );
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Warning', 'Failed to upload image, but profile will be saved without it.');
        }
      } else if (profileImageUri && profileImageUri.startsWith('http')) {
        // Keep existing image URL if no new image was selected
        profileImageUrl = profileImageUri;
      }

      // Save user data to Supabase database
      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        name: name.trim(),
        email: email.trim() || undefined,
        wallet: selectedAccount.publicKey.toBase58(),
        profile_image: profileImageUrl || undefined,
      };

      await userService.upsertUser(userData);

      Alert.alert(
        'Success!',
        'Your personal information has been saved successfully.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset validation states
    setNameTouched(false);
    setEmailTouched(false);
    setNameError('');
    setEmailError('');
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.bottomSheet}>
          <ImageBackground
            source={require('../../../assets/kamai_mobile_bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {/* Header with Close Button */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <MaterialCommunityIcon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#DDB15B" />
                  <Text style={styles.loadingText}>Loading your profile...</Text>
                </View>
              ) : (
                <>
                  {/* Profile Image Section */}
                  <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.profileImageContainer} onPress={showImagePicker}>
                      {profileImageUri ? (
                        <View style={styles.profileImageWrapper}>
                          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                          <View style={styles.editIcon}>
                            <MaterialCommunityIcon name="camera" size={16} color="#1B3A32" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.profileImageWrapper}>
                          <Image source={require('../../../assets/guest_user.png')} style={styles.profileImage} />
                          <View style={styles.editIcon}>
                            <MaterialCommunityIcon name="camera" size={16} color="#1B3A32" />
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.profileImageText}>Tap to add or change your profile picture</Text>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.formContainer}>
                    {/* Name Field */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Full Name *</Text>
                      <View style={[styles.inputWrapper, nameError && styles.inputError]}>
                        <TextInput
                          ref={nameInputRef}
                          value={name}
                          onChangeText={setName}
                          onFocus={() => setNameTouched(true)}
                          onBlur={() => setNameTouched(true)}
                          placeholder="Enter your full name"
                          placeholderTextColor="#999"
                          style={styles.textInput}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          textColor="#fff"
                          returnKeyType="next"
                          onSubmitEditing={() => emailInputRef.current?.focus()}
                        />
                      </View>
                      {nameError ? (
                        <Text style={styles.errorText}>{nameError}</Text>
                      ) : (
                        <Text style={styles.helperText}>This will be displayed on your profile</Text>
                      )}
                    </View>

                    {/* Email Field */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Email Address</Text>
                      <View style={[styles.inputWrapper, emailError && styles.inputError]}>
                        <TextInput
                          ref={emailInputRef}
                          value={email}
                          onChangeText={setEmail}
                          onFocus={() => setEmailTouched(true)}
                          onBlur={() => setEmailTouched(true)}
                          placeholder="Enter your email address (optional)"
                          placeholderTextColor="#999"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={styles.textInput}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          textColor="#fff"
                          returnKeyType="done"
                        />
                      </View>
                      {emailError ? (
                        <Text style={styles.errorText}>{emailError}</Text>
                      ) : (
                        <Text style={styles.helperText}>Optional - for account recovery</Text>
                      )}
                    </View>

                    {/* Wallet Address Field */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Wallet Address</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          value={selectedAccount?.publicKey.toBase58().slice(0, 20) + '...' + selectedAccount?.publicKey.toBase58().slice(-4) || 'CMCM....Le9U'}
                          editable={false}
                          style={[styles.textInput, styles.readOnlyInput]}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          textColor="#fff"
                        />
                      </View>
                      <Text style={styles.helperText}>
                        Your profile will be saved and linked to this wallet address
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.saveButton, 
                        (saving || !selectedAccount || nameError || emailError) && styles.saveButtonDisabled
                      ]}
                      onPress={handleSave}
                      disabled={saving || !selectedAccount || !!nameError || !!emailError}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#1B3A32" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Profile</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </ImageBackground>
        </View>
      </KeyboardAvoidingView>
      
      {/* Connect Wallet Alert */}
      <ConnectWalletAlert
        visible={showConnectWalletAlert}
        onDismiss={() => setShowConnectWalletAlert(false)}
        message="No wallet connected. Please connect your wallet first."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
    position: 'relative',
  },
  profileImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#DDB15B',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1B2A26',
  },
  profileImageText: {
    fontSize: 10,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#999',
    textAlign: 'center',
    maxWidth: 200,
  },
  formContainer: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#DDB15B',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#2B3834',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A4B45',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  textInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Regular,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    color: '#fff',
  },
  readOnlyInput: {
    opacity: 0.7,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#FF6B6B',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
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
  saveButton: {
    flex: 1,
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#1B3A32',
  },
}); 