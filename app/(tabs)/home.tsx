import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { Smile, Clock, PenLine, Award, LogOut, RefreshCw, CheckCircle2, RotateCw, Mic, Camera, Type, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import MemberIcon from '../../components/MemberIcon';
import { supabase } from '../../lib/supabase';
import { Group, Prompt, Submission, User } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { refreshPromptForTestGroup } from '../../lib/prompts';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { registerForPushNotificationsAsync, savePushToken, sendTestNotification } from '../../lib/notifications';

const { width } = Dimensions.get('window');

interface LocationPinProps {
  x: number;
  y: number;
  delay: number;
}

const LocationPin: React.FC<LocationPinProps> = ({ x, y, delay }) => {
  const pulseAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={[styles.pinContainer, { left: x, top: y }]}>
      <Animated.View
        style={[
          styles.pinPulse,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <MaterialCommunityIcons name="map-marker" size={24} color={theme.colors.primary} />
    </View>
  );
};

interface MemberAvatarProps {
  user: User;
  submitted: boolean;
  index: number;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ user, submitted, index }) => {
  return (
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: user.avatar_url || `https://i.pravatar.cc/150?img=${index + 1}` }}
        style={styles.avatar}
      />
      {!submitted && (
        <View style={styles.avatarOverlay}>
                      <View style={styles.avatarOverlay}>
            <Clock size={16} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );
};

// Function to get coordinates from postal code
const getCoordinatesFromPostalCode = async (postalCode: string) => {
  try {
    console.log('Geocoding postal code:', postalCode);
    
    // For US ZIP codes, add "USA" to improve accuracy
    const searchQuery = postalCode.length === 5 ? `${postalCode}, USA` : postalCode;
    console.log('Search query:', searchQuery);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
    );
    const data = await response.json();
    
    console.log('Geocoding response:', data);
    
    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        country: data[0].display_name.split(',').pop()?.trim() || 'Unknown'
      };
      console.log('Geocoding result:', result);
      return result;
    }
    
    console.log('No results found for postal code:', postalCode);
    return null;
  } catch (error) {
    console.error('Error geocoding postal code:', error);
    return null;
  }
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [response, setResponse] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [promptDueDate, setPromptDueDate] = useState<Date | null>(null);
  const hasRefreshedRef = useRef(false);
  const [userLocations, setUserLocations] = useState<{[key: string]: {latitude: number, longitude: number, name: string, country: string}}>({});

  const checkGroupStatus = async (groupData: Group) => {
    if (!groupData.current_prompt_id || !groupData.members) return;

    const now = new Date();
    const dueDate = new Date(groupData.next_prompt_due || '');
    
    console.log('Checking group status:');
    console.log('Current time:', now.toISOString());
    console.log('Due date:', dueDate.toISOString());
    console.log('Is time up?', now > dueDate);
    
    // If time is up and not enough members submitted
    if (now > dueDate) {
      const submittedCount = groupData.members.filter(m => m.submitted).length;
      console.log('Total members:', groupData.members.length);
      console.log('Submitted count:', submittedCount);
      console.log('Minimum required:', groupData.members.length - 1);
      
      if (submittedCount < groupData.members.length - 1) { // Less than n-1 members submitted
        console.log('Not enough submissions, disbanding group');
        
        // Update all members to remove group assignment but keep quiz completion status
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            current_group_id: null,
            submitted: false // Reset submission status
          })
          .in('id', groupData.members.map(m => m.id));

        if (updateError) {
          console.error('Error disbanding group:', updateError);
          return;
        }

        // Delete the group
        const { error: deleteError } = await supabase
          .from('groups')
          .delete()
          .eq('id', groupData.id);

        if (deleteError) {
          console.error('Error deleting group:', deleteError);
          return;
        }

        console.log('Group successfully disbanded');
        setGroup(null);
        return;
      } else {
        console.log('Enough members submitted, keeping group');
      }
    } else {
      console.log('Time not up yet');
    }
  };

  const fetchData = async () => {
    if (!user) {
      console.log('No user available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for user:', user.id);
        
      // First, ensure user exists in the database
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking user:', userCheckError);
        throw userCheckError;
      }

      console.log('Existing user data:', existingUser);

      // If user doesn't exist, create them
      if (!existingUser) {
        console.log('Creating new user in database');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
              has_completed_quiz: false
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }

        setHasCompletedQuiz(false);
        setGroup(null);
        setCurrentPrompt(null);
        setSubmissions([]);
        return;
      }

      // Now fetch the user's quiz status
      setHasCompletedQuiz(existingUser.has_completed_quiz || false);
      
      // If quiz is not completed, don't fetch group data
      if (!existingUser.has_completed_quiz) {
        console.log('Quiz not completed, skipping group fetch');
        setGroup(null);
        setCurrentPrompt(null);
        setSubmissions([]);
        return;
      }
      
      // Debug: Check if user has a current_group_id
      console.log('User current_group_id:', existingUser.current_group_id);
      
      // If user has no group, show join group screen
      if (!existingUser.current_group_id) {
        console.log('User has no group assigned');
        setGroup(null);
        setCurrentPrompt(null);
        setSubmissions([]);
        return;
      }
      
      // Fetch group data with the prompt using a join
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          prompts!current_prompt_id(*)
        `)
        .eq('id', existingUser.current_group_id)
        .single();
        
      if (groupError) {
        console.error('Error fetching group:', groupError);
        return;
      }
      
      if (!groupData) {
        console.error('No group found for user');
        return;
      }

      console.log('Group data:', groupData);

      // Use the next_prompt_due from the group table
      if (groupData.next_prompt_due) {
        console.log('Next prompt due:', groupData.next_prompt_due);
        const nextPromptDue = new Date(groupData.next_prompt_due);
        setPromptDueDate(nextPromptDue);
        
        // Initialize timer display
        const now = new Date();
        if (now > nextPromptDue) {
          setTimeLeft('Next prompt coming soon!');
        } else {
          const hours = Math.floor((nextPromptDue.getTime() - now.getTime()) / (1000 * 60 * 60));
          const minutes = Math.floor(((nextPromptDue.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor(((nextPromptDue.getTime() - now.getTime()) % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s until next prompt`);
        }
      } else {
        console.log('No next_prompt_due set for group');
        setTimeLeft('Next prompt time not set');
      }
      
      setGroup(groupData);
      setCurrentPrompt(groupData.prompts);

      // Check group status (submissions and time)
      await checkGroupStatus(groupData);

      // Fetch all users in this group
      const { data: groupMembers, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('current_group_id', groupData.id);

      if (membersError) {
        console.error('Error fetching group members:', membersError);
      } else {
        // Check if we need to reset submission status for any users
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);

        const usersToReset = groupMembers?.filter(member => {
          if (!member.last_submission_date) return false;
          const lastSubmission = new Date(member.last_submission_date);
          return lastSubmission < midnight;
        });

        if (usersToReset && usersToReset.length > 0) {
          console.log('Resetting submission status for users:', usersToReset.map(u => u.id));
          const { error: resetError } = await supabase
            .from('users')
            .update({ submitted: false })
            .in('id', usersToReset.map(u => u.id));
        
          if (resetError) {
            console.error('Error resetting submission status:', resetError);
          } else {
            // Update the local state with reset users
            groupMembers.forEach(member => {
              if (usersToReset.some(u => u.id === member.id)) {
                member.submitted = false;
              }
            });
          }
        }

        console.log('Group members:', groupMembers);
        setGroup(prev => prev ? { ...prev, members: groupMembers } : null);
        
        // Get coordinates for each member's postal code
        const locations: {[key: string]: {latitude: number, longitude: number, name: string, country: string}} = {};
        
        for (const member of groupMembers || []) {
          try {
            console.log('Processing member:', member.email, 'Location:', member.location);
            
            if (member.location) {
              const coords = await getCoordinatesFromPostalCode(member.location);
              if (coords) {
                locations[member.id] = {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  name: member.email?.split('@')[0] || 'Anonymous',
                  country: coords.country
                };
                console.log('Added location for member:', member.email, locations[member.id]);
              } else {
                console.log('No coordinates found for member:', member.email);
                // Default location if geocoding fails
                locations[member.id] = {
                  latitude: 0,
                  longitude: 0,
                  name: member.email?.split('@')[0] || 'Anonymous',
                  country: 'Location not set'
                };
              }
            } else {
              console.log('No location set for member:', member.email);
              // Default location for users without a postal code
              locations[member.id] = {
                latitude: 0,
                longitude: 0,
                name: member.email?.split('@')[0] || 'Anonymous',
                country: 'Location not set'
              };
            }
          } catch (error) {
            console.error(`Error getting coordinates for user ${member.id}:`, error);
            // Add user with default location if there's an error
            locations[member.id] = {
              latitude: 0,
              longitude: 0,
              name: member.email?.split('@')[0] || 'Anonymous',
              country: 'Location not set'
            };
          }
        }
        
        console.log('Final locations object:', locations);
        setUserLocations(locations);
      }
        
      // Fetch submissions for the current prompt
      if (groupData.current_prompt_id) {
        console.log('Fetching submissions for prompt:', groupData.current_prompt_id);
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('submissions')
            .select('*')
          .eq('prompt_id', groupData.current_prompt_id)
          .eq('group_id', groupData.id)
            .order('created_at', { ascending: true });
          
        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          throw submissionsError;
        }
          
        console.log('Successfully fetched submissions:', submissionsData?.length || 0);
          setSubmissions(submissionsData || []);
        }

      // Update user's current_group_id if it's not set
      if (!existingUser.current_group_id && groupData) {
        console.log('Updating user with current_group_id:', groupData.id);
        const { error: updateError } = await supabase
          .from('users')
          .update({ current_group_id: groupData.id })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user current_group_id:', updateError);
        }
      }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
  useEffect(() => {
    fetchData();
  }, [user]); // Only fetch data when user changes

  // Separate effect for timer updates
  useEffect(() => {
    if (!promptDueDate) return;

    const updateTimer = () => {
      const now = new Date();
      if (now > promptDueDate) {
        setTimeLeft('Next prompt coming soon!');
        return true; // Return true to indicate timer should stop
      } else {
        const hours = Math.floor((promptDueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        const minutes = Math.floor(((promptDueDate.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor(((promptDueDate.getTime() - now.getTime()) % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s until next prompt`);
        return false; // Return false to indicate timer should continue
      }
    };

    // Initial update
    const shouldStop = updateTimer();
    if (shouldStop) return;

    // Set up interval for updates
    const timer = setInterval(() => {
      const shouldStop = updateTimer();
      if (shouldStop) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [promptDueDate]); // Only re-run when promptDueDate changes

  // Separate effect for handling time up
  useEffect(() => {
    if (promptDueDate) {
      const now = new Date();
      if (now > promptDueDate) {
        console.log('Timer expired, checking group status');
        setTimeLeft('Next prompt coming soon!');
        // Refresh data after 5 seconds
        const refreshTimer = setTimeout(() => {
          console.log('Refreshing data after timer expiration');
          fetchData();
        }, 5000);
        return () => clearTimeout(refreshTimer);
      }
    }
  }, [promptDueDate]);

  // Separate effect for checking group status
  useEffect(() => {
    if (group && promptDueDate) {
      const now = new Date();
      if (now > promptDueDate) {
        console.log('Timer expired in group status effect, checking group');
        checkGroupStatus(group);
      }
    }
  }, [group, promptDueDate]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      setError(null);
      setIsJoining(true);
      
      if (!user?.id) {
        setError('Please sign in to join a group');
        return;
      }

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            id: user.id,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (groupError) throw groupError;
      
      setGroup(groupData);
      router.push('/(tabs)/prompt');
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err instanceof Error ? err.message : 'Failed to join group. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !user || !group) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Submitting response for group:', group.id);
      const { error } = await supabase
        .from('submissions')
        .insert([
          {
            user_id: user.id,
            group_id: group.id,
            prompt_id: currentPrompt?.id,
            response_text: response.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('Error submitting response:', error);
        throw error;
      }

      // Update user's submission status
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          submitted: true,
          last_submission_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user submission status:', updateError);
      }
      
      console.log('Response submitted successfully');
      setHasSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit your response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrompt = async () => {
    try {
      setLoading(true);
      await refreshPromptForTestGroup();
      await fetchData(); // Refresh the data to show new prompt
      Alert.alert('Success', 'Prompt has been refreshed!');
    } catch (error) {
      console.error('Error refreshing prompt:', error);
      Alert.alert('Error', 'Failed to refresh prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyMe = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (!token) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates about your group.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      if (user) {
        await savePushToken(user.id, token);
        // Send a test notification
        await sendTestNotification(token);
        Alert.alert(
          'Notifications Enabled',
          'We\'ll notify you when your group is ready!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert(
        'Error',
        'Failed to enable notifications. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!hasCompletedQuiz) {
    return (
      <View style={styles.container}>
        <View style={styles.quizContainer}>
          <Animated.Text 
            style={[styles.quizTitle, { opacity: fadeAnim }]}
            onLayout={() => {
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }).start();
            }}
          >
            Are you ready to get started?
          </Animated.Text>
          <View style={styles.quizContent}>
            <Text style={styles.quizDescription}>
              Take a quick quiz to help us match you with the perfect group.
            </Text>
            <TouchableOpacity 
              style={[styles.promptButton, styles.quizButton]} 
              onPress={() => router.push('/quiz')}
            >
              <Text style={styles.promptButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Show queue page if user has completed quiz but isn't in a group
  if (hasCompletedQuiz && !group) {
    return (
      <View style={styles.container}>
        <View style={styles.queueContent}>
          <MaterialCommunityIcons
            name="account-group"
            size={80}
            color="#007AFF"
            style={styles.queueIcon}
          />
          <Text style={styles.queueTitle}>Finding Your Crew</Text>
          <Text style={styles.queueSubtitle}>
            We're matching you with compatible group members based on your preferences and personality.
          </Text>
          <TouchableOpacity 
            style={[styles.promptButton, styles.notifyButton]}
            onPress={handleNotifyMe}
          >
            <Text style={styles.promptButtonText}>Notify Me When Ready</Text>
          </TouchableOpacity>
          <Text style={styles.queueHint}>
            This usually takes a few minutes. Feel free to check back later!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Crew</Text>
        
        <View style={styles.headerRight}>
        <View style={styles.streakContainer}>
          <Award size={24} color={theme.colors.primary} />
          <Text style={styles.streakText}>
              {group?.streak_count ?? 0} day streak
          </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchData}
          >
            <RefreshCw size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          {group?.id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefreshPrompt}
            >
              <RotateCw size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet Your Group</Text>
          <View style={styles.membersContainer}>
            <View style={styles.membersList}>
              {group?.members?.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Image
                    source={{ uri: member.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.preferred_name || member.email?.split('@')[0] || 'Anonymous'}
                    </Text>
                    <Text style={[
                      styles.memberStatus,
                      member.submitted ? styles.memberStatusSubmitted : styles.memberStatusPending
                    ]}>
                      {member.submitted ? 'Checked in' : 'Not checked in'}
                    </Text>
                  </View>
                  {member.submitted && (
                    <CheckCircle2 size={20} color={theme.colors.primary} />
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.membersStats}>
              {group?.members?.filter(m => m.submitted).length || 0}/{group?.members?.length || 0} checked in today
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Check-in</Text>
          <Card style={styles.timerCard}>
            <View style={styles.timerContent}>
              <Clock size={24} color={theme.colors.primary} />
              <Text style={[
                styles.timerText,
                timeLeft === 'Next prompt coming soon!' && styles.timerTextExpired
              ]}>
                {timeLeft || 'Loading...'}
              </Text>
            </View>
          </Card>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Prompt</Text>
          <Card style={styles.promptCard}>
            <View style={styles.promptHeader}>
          <Text style={styles.promptText}>
                {typeof group?.current_prompt === 'string' ? group.current_prompt : 
                 currentPrompt?.content || "Loading prompt..."}
              </Text>
              {currentPrompt?.prompt_type && (
                <View style={styles.promptTypeContainer}>
                  {currentPrompt.prompt_type === 'audio' && <Mic size={20} color={theme.colors.primary} />}
                  {currentPrompt.prompt_type === 'photo' && <Camera size={20} color={theme.colors.primary} />}
                  {currentPrompt.prompt_type === 'text' && <Type size={20} color={theme.colors.primary} />}
                  <Text style={styles.promptTypeText}>
                    {currentPrompt.prompt_type.charAt(0).toUpperCase() + currentPrompt.prompt_type.slice(1)}
          </Text>
                </View>
              )}
            </View>
            <View style={styles.promptActions}>
              {!group ? (
                <TouchableOpacity 
                  style={[styles.promptButton, styles.joinButton]}
                  onPress={handleJoinGroup}
                  disabled={isJoining}
                >
                  <Text style={styles.promptButtonText}>
                    {isJoining ? 'Joining...' : 'Join Group'}
            </Text>
          </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.promptButton}
                  onPress={() => router.push('/(tabs)/prompt')}
              >
                <Text style={styles.promptButtonText}>
                  {hasSubmitted ? 'View Responses' : 'Answer Prompt'}
                </Text>
              </TouchableOpacity>
            )}
            </View>
          </Card>
        </View>

        {/* Location Section */}
        {group && group.members && group.members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Locations</Text>
            <Card style={styles.mapCard}>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: 37.7749,
                    longitude: -122.4194,
                    latitudeDelta: 180,
                    longitudeDelta: 360,
                  }}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  toolbarEnabled={false}
                  zoomEnabled={false}
                  scrollEnabled={true}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  {Object.entries(userLocations).map(([userId, location]) => (
                    <Marker
                      key={userId}
                      coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }}
                      title={location.name}
                      description={location.country === 'Location not set' ? 'Location not set' : `From ${location.country}`}
                    >
                      <View style={[
                        styles.customMarker,
                        location.country === 'Location not set' && styles.defaultMarker
                      ]}>
                        <View style={[
                          styles.markerInner,
                          location.country === 'Location not set' && styles.defaultMarkerInner
                        ]}>
                          <MapPin size={16} color="#FFFFFF" />
                        </View>
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>
              <View style={styles.locationInfo}>
                <View style={styles.locationHeader}>
                  <MapPin size={20} color={theme.colors.primary} />
                  <Text style={styles.locationText}>
                    {Object.keys(userLocations).length} members in {new Set(Object.values(userLocations).map(loc => loc.country)).size} different countries
                  </Text>
                </View>
                <Text style={styles.locationSubtext}>
                  See where your group members are checking in from
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Off-white background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  streakText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  refreshButton: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutButton: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '700',
  },
  membersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  membersList: {
    gap: theme.spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  memberStatus: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  memberStatusSubmitted: {
    color: theme.colors.primary,
  },
  memberStatusPending: {
    color: theme.colors.text.secondary,
  },
  membersStats: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  timerText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
  },
  promptText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    lineHeight: 24,
    fontWeight: '500',
  },
  promptButton: {
    backgroundColor: '#87CEEB',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  promptButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  joinButton: {
    backgroundColor: '#B0E0E6',
  },
  quizButton: {
    backgroundColor: '#87CEEB',
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
  },
  quizContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: '#FAFAFA',
  },
  quizContent: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.xl,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  quizTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '700',
  },
  quizDescription: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
    fontWeight: '500',
  },
  promptHeader: {
    marginBottom: theme.spacing.md,
  },
  promptTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  promptTypeText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  promptActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  refreshPromptButton: {
    backgroundColor: '#B0E0E6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  queueContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: '#FAFAFA',
  },
  queueIcon: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  queueTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  queueSubtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  queueHint: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: theme.spacing.md,
  },
  notifyButton: {
    backgroundColor: '#87CEEB',
    marginVertical: theme.spacing.lg,
    minWidth: 200,
  },
  timerTextExpired: {
    color: theme.colors.error,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  locationInfo: {
    padding: theme.spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  locationText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  locationSubtext: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  defaultMarker: {
    opacity: 0.7,
  },
  defaultMarkerInner: {
    backgroundColor: theme.colors.text.secondary,
  },
});