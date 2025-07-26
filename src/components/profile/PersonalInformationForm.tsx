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
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
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
        setProfileImageUri(userData.profile_image || null);
      } else {
        // Reset form for new user
        setName('');
        setProfileImageUri(null);
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

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
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

  const handleSave = async () => {
    if (!selectedAccount) {
      Alert.alert('Error', 'No wallet connected. Please connect your wallet first.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      
      let profileImageUrl = null;
      
      // Upload profile image if selected and it's a new local image
      if (profileImageUri && !profileImageUri.startsWith('http')) {
        try {
          profileImageUrl = await storageService.uploadProfileImage(
            profileImageUri,
            selectedAccount.publicKey.toBase58()
          );
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Warning', 'Failed to upload image, but profile will be saved without it.');
        }
      } else if (profileImageUri) {
        // Keep existing image URL
        profileImageUrl = profileImageUri;
      }

      // Save user data to Supabase database
      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        name: name.trim(),
        wallet: selectedAccount.publicKey.toBase58(),
        profile_image: profileImageUrl,
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
                <MaterialCommunityIcon name="close" size={24} color="#FFFFFF" />
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
                      <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcon name="camera-plus" size={32} color="#666" />
                        <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.imageHelpText}>
                    {profileImageUri && profileImageUri.startsWith('http') 
                      ? 'Image stored in Supabase Storage' 
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
                    placeholderTextColor="#666"
                    style={styles.textInput}
                    theme={{
                      colors: {
                        primary: '#F4A261',
                        text: '#FFFFFF',
                        placeholder: '#666',
                      }
                    }}
                  />
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
                        primary: '#F4A261',
                        text: '#666',
                        placeholder: '#666',
                      }
                    }}
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <MaterialCommunityIcon name="wallet" size={20} color="#F4A261" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#2A5A47',
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
    color: '#DDB15B',
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
    color: '#FFFFFF',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#1B3A32',
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