import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface SvgBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function SvgBackground({ children, style }: SvgBackgroundProps) {
  return (
    <>
      <Image
        source={require('../../../assets/mobile_app_bg.svg')}
        style={[styles.backgroundImage, style]}
        contentFit="cover"
        transition={1000}
      />
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
}); 