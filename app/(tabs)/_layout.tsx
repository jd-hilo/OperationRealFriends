import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { LayoutAnimation, Platform, UIManager, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Home, MessageCircle, PenLine } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import MemberStatusBar from '../../components/MemberStatusBar';
import { GroupProvider, useGroup } from '../../lib/GroupContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function TabLayoutInner() {
  const { user, loading: authLoading } = useAuth();
  const [hasGroup, setHasGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const { group, loading: groupLoading } = useGroup();

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
      {/* MemberStatusBar: Only show if group and members exist */}
      {group && group.members && (
        <MemberStatusBar
          members={group.members}
          userId={user?.id || ''}
          nextCheckIn={group.next_prompt_due ? new Date(group.next_prompt_due).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true, weekday: 'short', month: 'short', day: 'numeric' }) : ''}
        />
      )}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#eee',
            backgroundColor: '#fff',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
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

export default function TabLayout() {
  return (
    <GroupProvider>
      <TabLayoutInner />
    </GroupProvider>
  );
}