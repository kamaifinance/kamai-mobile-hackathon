import { TextStyle } from 'react-native';
import { FontFamilies } from './fonts';

// Global typography styles for consistent app-wide usage
export const Typography = {
  // Headers
  h1: {
    fontFamily: FontFamilies.Larken.Bold,
    fontSize: 28,
    lineHeight: 36,
    color: '#1a1a1a',
  } as TextStyle,
  
  h2: {
    fontFamily: FontFamilies.Larken.Bold,
    fontSize: 24,
    lineHeight: 32,
    color: '#1a1a1a',
  } as TextStyle,
  
  h3: {
    fontFamily: FontFamilies.Larken.Medium,
    fontSize: 20,
    lineHeight: 28,
    color: '#1a1a1a',
  } as TextStyle,
  
  h4: {
    fontFamily: FontFamilies.Larken.Medium,
    fontSize: 18,
    lineHeight: 26,
    color: '#1a1a1a',
  } as TextStyle,
  
  // Body text
  bodyLarge: {
    fontFamily: FontFamilies.Larken.Regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  } as TextStyle,
  
  body: {
    fontFamily: FontFamilies.Larken.Regular,
    fontSize: 14,
    lineHeight: 22,
    color: '#2c3e50',
  } as TextStyle,
  
  bodySmall: {
    fontFamily: FontFamilies.Larken.Regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#7f8c8d',
  } as TextStyle,
  
  // Special text styles
  caption: {
    fontFamily: FontFamilies.Larken.Light,
    fontSize: 12,
    lineHeight: 16,
    color: '#95a5a6',
  } as TextStyle,
  
  button: {
    fontFamily: FontFamilies.Larken.Medium,
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
  } as TextStyle,
  
  // Brand styles using Saleha
  brand: {
    fontFamily: FontFamilies.Saleha,
    fontSize: 24,
    lineHeight: 32,
    color: '#3498db',
  } as TextStyle,
  
  // Utility styles
  bold: {
    fontFamily: FontFamilies.Larken.Bold,
  } as TextStyle,
  
  italic: {
    fontFamily: FontFamilies.Larken.Italic,
  } as TextStyle,
  
  light: {
    fontFamily: FontFamilies.Larken.Light,
  } as TextStyle,
  
  thin: {
    fontFamily: FontFamilies.Larken.Thin,
  } as TextStyle,
} as const;

// Helper function to merge typography styles
export const mergeTypography = (base: TextStyle, override: TextStyle): TextStyle => {
  return { ...base, ...override };
}; 