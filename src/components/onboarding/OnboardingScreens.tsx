import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { FontFamilies } from '../../styles/fonts';

interface OnboardingScreensProps {
  onComplete: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Solana's ultimate yield farm.",
    description: "Kamai is the best place to park long term assets for low risk yield all across Solana.",
    visual: 'phone',
  },
  {
    id: 2,
    title: "Stablecoins, wBTCs, LSTs & More",
    description: "Earn 2% - 10% more APY on your idle assets by putting them to work.",
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
        source={require('../../../assets/onboarding_2.png')}
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
        
        <View style={styles.visualContainer}>
          {visual}
        </View>

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
    <ImageBackground
      source={require('../../../assets/kamai_mobile_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F1B',
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
    paddingTop: 50,
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
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 14,
    fontFamily: FontFamilies.Larken.Regular,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 24,
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

  // Phone Visual Styles
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneImage: {
    width: 600,
    height: 620,
  },
  phoneImage2: {
    width: 500,
    height: 500,
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