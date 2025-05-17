import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { Home, MessageCircle, PenLine } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function TabLayout() {
  // Use LayoutAnimation when switching tabs
  const handleTabPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
          backgroundColor: '#fff',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompt"
        options={{
          title: 'Prompt',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="lightbulb" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}