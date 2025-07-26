import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { decode } from 'base64-arraybuffer'

// Replace these with your actual Supabase project credentials
// You can get these from: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api
const supabaseUrl = 'https://bfjxjgeoindczldonvcr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmanhqZ2VvaW5kY3psZG9udmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0Mzg0MTksImV4cCI6MjA2NzAxNDQxOX0.WJVl7T1ra2gfOvW_J41PE3qwvs4f86R3svEl-lRNd4I'

// Simple Supabase client without auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
const table = 'kamai_users'
// TypeScript interface for our Users table
export interface User {
  id?: string;
  name?: string;
  email?: string; 
  wallet: string; // unique wallet address
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

// Database service for user operations (without auth)
export const userService = {
  // Get user by wallet address
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('wallet', walletAddress)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error loading user from database:', error)
      throw error
    }
  },

  // Create or update user
  async upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(userData, { onConflict: 'wallet' })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error saving user to database:', error)
      throw error
    }
  },

  // Delete user profile
  async deleteUser(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('wallet', walletAddress)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting user from database:', error)
      throw error
    }
  }
}

// Storage service for profile images
export const storageService = {
  // Upload profile image to Supabase Storage
  async uploadProfileImage(base64Data: string, walletAddress: string, contentType: string = 'image/jpeg'): Promise<string> {
    try {
      const fileExt = contentType.split('/')[1] || 'jpg';
      const fileName = `${walletAddress}-${Date.now()}.${fileExt}`;
      const filePath = `profile_images/${fileName}`;

      console.log('Uploading image to:', filePath);

      // Convert base64 to ArrayBuffer and upload
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, decode(base64Data), {
          contentType: contentType
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image to Supabase Storage:', error);
      throw error;
    }
  },

  // Delete profile image from Supabase Storage
  async deleteProfileImage(imagePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('profile-images')
        .remove([imagePath])

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting image from Supabase Storage:', error)
      throw error
    }
  }
} 