import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontFamilies } from '../../styles/fonts';
import { useVaultContext } from '../../context/VaultProvider';

interface OnboardingScreensProps {
  onComplete: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Solana's ultimate yield farm.",
    description: "Kamai automatically moves your invested capital into the highest yielding protocols based on your risk preferences",
    visual: 'phone',
  },
  {
    id: 2,
    title: "Stablecoins, wBTCs, LSTs & More",
    description: "Earn 2% - 10% more APY on your idle assets by putting them to work in DeFi",
    visual: 'tokens',
  },
  {
    id: 3,
    title: "Historically low-risk pools and protocols for stable yield",
    description: "Earn 2% - 10% more APY on your idle assets by putting them to work.",
    visual: 'logo',
  },
];

export function OnboardingScreens({ onComplete }: OnboardingScreensProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasPreloadedRef = useRef(false);
  const { preloadVaults } = useVaultContext();

  // Start preloading vaults when component mounts (only once)
  useEffect(() => {
    if (!hasPreloadedRef.current) {
      hasPreloadedRef.current = true;
      
      const startPreloading = async () => {
        try {
          console.log('Starting vault preloading during onboarding...');
          await preloadVaults();
          console.log('Vault preloading completed during onboarding');
        } catch (error) {
          console.warn('Failed to preload vaults during onboarding:', error);
          // Don't block onboarding if vault preloading fails
        }
      };

      startPreloading();
    }
  }, []); // Empty dependency array to run only once

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentIndex && styles.activeDot,
            index < currentIndex && styles.completedDot,
          ]}
        />
      ))}
    </View>
  );

  const renderPhoneVisual = () => (
    <View style={styles.phoneContainer}>
      <Image 
        source={require('../../../assets/kamai_home_phone.png')}
        style={styles.phoneImage}
        resizeMode="contain"
      />
    </View>
  );

  const renderTokensVisual = () => (
    <View style={styles.phoneContainer}>
      <Image 
        source={require('../../../assets/better_second_screen.png')}
        style={styles.phoneImage2}
        resizeMode="contain"
      />
    </View>
  );

  const renderLogoVisual = () => (
    <View style={styles.phoneContainer}>
      <Image 
        source={require('../../../assets/onboarding_3.png')}
        style={styles.phoneImage3}
        resizeMode="contain"
      />
    </View>
  );

  const renderThreeStepFeatures = () => (
    <View style={styles.featuresContainer}>
      <View style={styles.featureItem}>
        <Text style={styles.featureNumber}>1</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Deposit Once</Text>
          <Text style={styles.featureSubtitle}>By simply depositing once, your assets will be put to use in the lowest-risk yield sources across every protocol</Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <Text style={styles.featureNumber}>2</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Automatic Solana Yield Shift</Text>
          <Text style={styles.featureSubtitle}>Whenever a higher yield is found anywhere on Solana, your capital will shift there automatically</Text>
        </View>
      </View>
      
      <View style={styles.featureItem}>
        <Text style={styles.featureNumber}>3</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>You're Done</Text>
          <Text style={styles.featureSubtitle}>And that's it. Deposit once and farm yield forever.</Text>
        </View>
      </View>
    </View>
  );

  const renderScreen = (item: typeof onboardingData[0], index: number) => {
    let visual;
    switch (item.visual) {
      case 'phone':
        visual = renderPhoneVisual();
        break;
      case 'tokens':
        visual = renderTokensVisual();
        break;
      case 'logo':
        visual = renderLogoVisual();
        break;
      default:
        visual = null;
    }

    return (
      <View key={item.id} style={styles.screen}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        
        {/* For third screen, position asset as background behind features */}
        {index === 2 ? (
          <View style={styles.thirdScreenContent}>
            <View style={styles.backgroundVisualContainer}>
              {visual}
            </View>
            {renderThreeStepFeatures()}
          </View>
        ) : (
          <View style={styles.visualContainer}>
            {visual}
          </View>
        )}

        {/* Only show buttons on the last screen */}
        {index === onboardingData.length - 1 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.logInButton} onPress={onComplete}>
              <Text style={styles.logInButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderProgressDots()}
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => renderScreen(item, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: screenWidth,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80, // Increased to account for status bar without SafeAreaView
    paddingBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 120,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#2B3834',
  },
  activeDot: {
    backgroundColor: '#DDB15B',
  },
  completedDot: {
    backgroundColor: '#DDB15B',
  },
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  textContainer: {
    paddingBottom: 40,
    paddingTop: 5,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#DDB15B',
    textAlign: 'left',
    marginBottom: 4,
    lineHeight: 34,
  },
  description: {
    fontSize: 12,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#9F9F9F',
    textAlign: 'left',
    lineHeight: 16,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  signUpButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Medium,
    color: '#FFFFFF',
  },
  logInButton: {
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logInButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.Larken.Bold,
    color: '#1B3A32',
  },

  // Third screen specific layout
  thirdScreenContent: {
    flex: 1,
    position: 'relative',
  },
  backgroundVisualContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    opacity: 0.6,
  },

  // Three-step features styles
  featuresContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 16,
    zIndex: 2,
    position: 'relative',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#061512',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    minHeight: 80,
  },
  featureNumber: {
    fontSize: 32,
    fontFamily: FontFamilies.Saleha,
    color: '#DDB15B',
    lineHeight: 32,
    width: 40,
    height: 60,
    marginTop: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center',
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#DDB15B',
    lineHeight: 22,
    marginBottom: 5,
  },
  featureSubtitle: {
    fontSize: 9,
    fontFamily: FontFamilies.Geist.Regular,
    color: '#FFFFFF',
    lineHeight: 16,
    opacity: 0.8,
    marginBottom: 15,
  },

  // Phone Visual Styles
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneImage: {
    width: 650,
    height: 650,
    marginTop: 25,
    marginRight:-50,
  },
  phoneImage2: {
    width: 400,
    height: 600,
  },
  phoneImage3: {
    width: 400,
    height: 400,
  },
  // Tokens Visual Styles
  tokensContainer: {
    width: 300,
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenCircle1: {
    position: 'absolute',
    top: 50,
    left: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenCircle2: {
    position: 'absolute',
    top: 50,
    right: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solanaIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  usdcIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamilies.Larken.Bold,
  },
  centerLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1B2A26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kamaiLogo: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  logoShape1: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 40,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },
  logoShape2: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ rotate: '-45deg' }],
  },
  logoShape3: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ rotate: '-45deg' }],
  },
  logoShape4: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    width: 40,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },

  // Logo Visual Styles
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainLogo: {
    width: 150,
    height: 150,
    position: 'relative',
  },
  logoElement1: {
    position: 'absolute',
    top: 20,
    left: 30,
    width: 50,
    height: 25,
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    transform: [{ rotate: '30deg' }],
  },
  logoElement2: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 50,
    height: 25,
    backgroundColor: '#DDB15B',
    borderRadius: 12,
    transform: [{ rotate: '-30deg' }],
  },
  logoElement3: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 35,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ rotate: '-20deg' }],
  },
  logoElement4: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 35,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ rotate: '20deg' }],
  },
  logoCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    backgroundColor: '#DDB15B',
    borderRadius: 10,
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
}); 