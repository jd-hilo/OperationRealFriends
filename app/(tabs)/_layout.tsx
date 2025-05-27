import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { LayoutAnimation, Platform, UIManager, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Home, MessageCircle, PenLine } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function TabLayout() {
  const { user, loading: authLoading } = useAuth();
  const [hasGroup, setHasGroup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGroupStatus = async () => {
      if (!user) {
        setHasGroup(false);
        setLoading(false);
        return;
      }

      try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('current_group_id')
        .eq('id', user.id)
        .single();

      if (!error && userData) {
        setHasGroup(!!userData.current_group_id);
        }
      } catch (error) {
        console.error('Error checking group status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkGroupStatus();
  }, [user]);

  // Use LayoutAnimation when switching tabs
  const handleTabPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!hasGroup) {
    return (
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
            }}
          />
        </Tabs>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});