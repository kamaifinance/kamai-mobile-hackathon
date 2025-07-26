// Polyfills
import "./src/polyfills";

import { StyleSheet, useColorScheme, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";

const queryClient = new QueryClient();

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function App() {
  const colorScheme = useColorScheme();
  
  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    // Saleha font
    'Saleha': require('./assets/fonts/Saleha.ttf'),
    
    // Larken font variants
    'Larken Regular': require('./assets/fonts/Larken Regular.ttf'),
    'Larken Bold': require('./assets/fonts/Larken Bold.ttf'),
    'Larken Bold Italic': require('./assets/fonts/Larken Bold Italic.ttf'),
    'Larken Italic': require('./assets/fonts/Larken Italic.ttf'),
    'Larken Light': require('./assets/fonts/Larken Light.ttf'),
    'Larken Light Italic': require('./assets/fonts/Larken Light Italic.ttf'),
    'Larken Medium': require('./assets/fonts/Larken Medium.ttf'),
    'Larken Medium Italic': require('./assets/fonts/Larken Medium Italic.ttf'),
    'Larken Thin': require('./assets/fonts/Larken Thin.ttf'),
    'Larken Thin Italic': require('./assets/fonts/Larken Thin Italic.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render the app if fonts haven't loaded and there's no error
  if (!fontsLoaded && !fontError) {
    return null;
  }

  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

  const CombinedDefaultTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...LightTheme.colors,
      background: 'transparent', // Make navigation background transparent
    },
  };
  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...DarkTheme.colors,
      background: 'transparent', // Make navigation background transparent
    },
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <ImageBackground
            source={require('./assets/kamai_mobile_bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <SafeAreaView
              style={[
                styles.shell,
                {
                  backgroundColor: 'transparent', // Make background transparent to show the image
                },
              ]}
              onLayout={onLayoutRootView}
            >
              <PaperProvider
                theme={
                  colorScheme === "dark"
                    ? CombinedDarkTheme
                    : CombinedDefaultTheme
                }
              >
                <AppNavigator />
              </PaperProvider>
            </SafeAreaView>
          </ImageBackground>
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
});
