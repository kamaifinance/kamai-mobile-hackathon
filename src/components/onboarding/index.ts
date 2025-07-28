export { OnboardingScreens } from './OnboardingScreens';

// Utility function to reset onboarding for testing
import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem('onboardingCompleted');
    console.log('Onboarding reset successfully');
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}; 