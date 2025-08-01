import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { View, TouchableOpacity, Text, AccessibilityState, GestureResponderEvent } from "react-native";

const Tab = createBottomTabNavigator();

// Props interface for CustomTabBarButton
interface CustomTabBarButtonProps {
  onPress?: ((event: GestureResponderEvent) => void);
  accessibilityState?: AccessibilityState;
  label: string;
  iconName: keyof typeof MaterialCommunityIcon.glyphMap;
  iconNameFocused: keyof typeof MaterialCommunityIcon.glyphMap;
}

// Custom Tab Bar Button with highlight box
const CustomTabBarButton = ({ onPress, accessibilityState, label, iconName, iconNameFocused }: CustomTabBarButtonProps) => {
  const focused = accessibilityState?.selected || false;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? '#041713' : 'transparent',
          borderWidth: focused ? 1 : 0,
          borderColor: focused ? 'rgba(13, 69, 50, 0.4)' : 'transparent',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
          width: 100,
          boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
        }}
      >
        <MaterialCommunityIcon
          name={focused ? iconNameFocused : iconName}
          size={24}
          color={focused ? "#DDB15B" : "#5A8B7A"}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
            color: "#8C8C8C",
          }}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * This is the main navigator with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 */
export function HomeNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarShowLabel: false, // Hide default labels since we're using custom ones
        tabBarActiveTintColor: "#DDB15B", // Orange color for active text
        tabBarInactiveTintColor: "#5A8B7A", // Teal color for inactive text
        tabBarStyle: {
          backgroundColor: "#041713", // Dark teal background
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
          borderColor: '#182622',
          boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
      })}
    >
      <Tab.Screen 
        name="Portfolio" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: "Portfolio",
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="Portfolio" iconName="wallet-outline" iconNameFocused="wallet" />
          ),
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{ 
          tabBarLabel: "Explore",
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="Explore" iconName="compass-outline" iconNameFocused="compass" />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: "Profile",
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="Profile" iconName="account-circle-outline" iconNameFocused="account-circle" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
