import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Card, Button } from 'react-native-paper';
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from 'expo-image-picker';
import { FontFamilies } from '../../styles/fonts';
import { useAuthorization } from '../../utils/useAuthorization';
import { userService, storageService, User } from '../../../lib/supabase';

interface PersonalInformationFormProps {
  visible: boolean;
  onClose: () => void;
}

export function PersonalInformationForm({ visible, onClose }: PersonalInformationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { selectedAccount } = useAuthorization();

  useEffect(() => {
    if (visible && selectedAccount) {
      loadUserData();
    }
  }, [visible, selectedAccount]);

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
      'Select Image',
      'Choose how you want to select your profile image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    if (!selectedAccount) {
      Alert.alert('Error', 'No wallet connected. Please connect your wallet first.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    if (email.trim() && !validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
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

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Card style={styles.modal}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card.Content style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Personal Information</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#DDB15B" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <>
                {/* Profile Image Section */}
                <View style={styles.imageSection}>
                  <Text style={styles.sectionTitle}>Profile Photo</Text>
                  <TouchableOpacity style={styles.imageContainer} onPress={showImagePicker}>
                    {profileImageUri ? (
                      <View style={styles.imageWrapper}>
                        <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                        {profileImageBase64 && profileImageUri && !profileImageUri.startsWith('http') && (
                          <View style={styles.newImageIndicator}>
                            <MaterialCommunityIcon name="upload" size={16} color="#fff" />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcon name="camera-plus" size={32} color="#666" />
                        <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.imageHelpText}>
                    {profileImageBase64 && profileImageUri && !profileImageUri.startsWith('http')
                      ? 'New image selected - save to upload'
                      : profileImageUri && profileImageUri.startsWith('http')
                      ? 'Tap to change your profile photo'
                      : 'Tap to add or change your profile photo'
                    }
                  </Text>
                </View>

                {/* Name Section */}
                <View style={styles.inputSection}>
                  <Text style={styles.sectionTitle}>Full Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    style={styles.textInput}
                    theme={{
                      colors: {
                        primary: '#DDB15B',
                        text: '#333',
                        placeholder: '#999',
                      }
                    }}
                  />
                </View>

                {/* Email Section */}
                <View style={styles.inputSection}>
                  <Text style={styles.sectionTitle}>Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address (optional)"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    theme={{
                      colors: {
                        primary: '#DDB15B',
                        text: '#333',
                        placeholder: '#999',
                      }
                    }}
                  />
                  <Text style={styles.helperText}>
                    Email is optional but helps with account recovery and notifications
                  </Text>
                </View>

                {/* Wallet Address Section (Read-only) */}
                <View style={styles.inputSection}>
                  <Text style={styles.sectionTitle}>Wallet Address</Text>
                  <TextInput
                    value={selectedAccount?.publicKey.toBase58() || 'Not connected'}
                    editable={false}
                    style={[styles.textInput, styles.readOnlyInput]}
                    theme={{
                      colors: {
                        primary: '#DDB15B',
                        text: '#666',
                        placeholder: '#999',
                      }
                    }}
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialCommunityIcon name="wallet" size={20} color="#DDB15B" />
                        )}
                      />
                    }
                  />
                  <Text style={styles.helperText}>
                    Your profile is saved to the database and linked to this wallet address
                  </Text>
                </View>

                {/* Save Button */}
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving || !selectedAccount}
                  style={styles.saveButton}
                  contentStyle={styles.saveButtonContent}
                  labelStyle={styles.saveButtonText}
                >
                  {saving ? 'Saving...' : 'Save Information'}
                </Button>
              </>
            )}
          </Card.Content>
        </ScrollView>
      </Card>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
  },
  content: {
    padding: 24,
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
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#333',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#333',
    marginBottom: 12,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 8,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  newImageIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#666',
  },
  imageHelpText: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#666',
    textAlign: 'center',
    maxWidth: 200,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  readOnlyInput: {
    opacity: 0.7,
  },
  helperText: {
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    marginTop: 16,
  },
  saveButtonContent: {
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#1B3A32',
  },
}); 