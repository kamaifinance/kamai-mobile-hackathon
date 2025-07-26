import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
// You can get these from: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api
const supabaseUrl = 'https://bfjxjgeoindczldonvcr.supabase.co'
const supabaseAnonKey = '<prefer publishable key instead of anon key for mobile and desktop apps>'

// Simple Supabase client without auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript interface for our Users table
export interface User {
  id?: string;
  name?: string;
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
        .from('users')
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
        .from('users')
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
        .from('users')
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
  async uploadProfileImage(uri: string, walletAddress: string): Promise<string> {
    try {
      // Convert image URI to blob for upload
      const response = await fetch(uri)
      const blob = await response.blob()

      const fileExt = uri.split('.').pop()
      const fileName = `${walletAddress}-${Date.now()}.${fileExt}`
      const filePath = `profile_images/${fileName}`

      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob)

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image to Supabase Storage:', error)
      throw error
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