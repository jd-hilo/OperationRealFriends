import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  Easing,
} from 'react-native';
import {
  Clock,
  Award,
  LogOut,
  RefreshCw,
  CheckCircle2,
  RotateCw,
  Mic,
  Camera,
  Type,
  MapPin,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import { supabase } from '../../lib/supabase';
import { Group, Prompt, Submission, User } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import MapView, { Marker } from 'react-native-maps';
import { registerForPushNotificationsAsync, savePushToken, sendTestNotification } from '../../lib/notifications';
import LoadingSpinner from '../../components/LoadingSpinner';
import { updateGroupStreak } from '../../lib/groupStreak';
import GroupCard from '../../components/GroupCard';
import GroupMap from '../../components/GroupMap';
import PromptCard from '../../components/PromptCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
  const insets = useSafeAreaInsets();
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
  const [scrollY] = useState(new Animated.Value(0));
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const globeAnim = useRef(new Animated.Value(0)).current;

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
        // Update the streak count
        await updateGroupStreak(groupData.id);
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
        // Fetch submissions for the current prompt
        const { data: currentSubmissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('group_id', groupData.id)
          .eq('prompt_id', groupData.current_prompt_id);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
        } else {
          // Update member submission status based on current prompt submissions
          const updatedMembers = groupMembers.map(member => ({
            ...member,
            submitted: currentSubmissions?.some(sub => sub.user_id === member.id) || false
          }));

          console.log('Updated members with submission status:', updatedMembers);
          setGroup(prev => prev ? { ...prev, members: updatedMembers } : null);
        }
      }

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
      
      // Update the local group state to reflect the submission
      if (group.members) {
        const updatedMembers = group.members.map(member => 
          member.id === user.id 
            ? { ...member, submitted: true }
            : member
        );
        setGroup(prev => prev ? { ...prev, members: updatedMembers } : null);
      }
      
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit your response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyMe = async () => {
    try {
      console.log('=== Starting handleNotifyMe ===');
      if (!user) {
        console.log('No user found, cannot proceed');
        Alert.alert('Error', 'Please sign in to enable notifications.');
        return;
      }

      console.log('User ID:', user.id);
      console.log('Requesting notification permissions...');
      const token = await registerForPushNotificationsAsync();
      
      if (!token) {
        console.log('No token received');
        return;
      }

      console.log('Got push token, saving to Supabase...');
      try {
        const result = await savePushToken(user.id, token);
        console.log('Save token result:', result);
        
        // Send a test notification
        console.log('Sending test notification...');
        await sendTestNotification(token);
        console.log('Test notification sent successfully');
        
        Alert.alert(
          'Notifications Enabled',
          'We\'ll notify you when your group is ready!',
          [{ text: 'OK' }]
        );
      } catch (saveError) {
        console.error('Error saving token:', saveError);
        Alert.alert(
          'Error',
          'Failed to save notification settings. Please try again.',
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

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY;
    
    if (scrollDiff > 5 && headerVisible && currentScrollY > 50) {
      // Scrolling down - hide header
      setHeaderVisible(false);
      Animated.timing(scrollY, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (scrollDiff < -5 && !headerVisible) {
      // Scrolling up - show header
      setHeaderVisible(true);
      Animated.timing(scrollY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(globeAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const globeSpin = globeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (loading) {
    return (
      <LinearGradient
        colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
        locations={[0, 0.4808, 0.9904]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <Animated.View style={[styles.queueIconWrapper, { transform: [{ rotate: globeSpin }] }]}> 
          <Image
            source={require('../../assets/globe.png')}
            style={styles.queueIcon}
            resizeMode="contain"
          />
        </Animated.View>
        <Text style={styles.loadingText}>Connecting you with your group around the world...</Text>
      </LinearGradient>
    );
  }

  if (!hasCompletedQuiz) {
    return (
      <LinearGradient
        colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
        locations={[0, 0.4808, 0.9904]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
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
              style={styles.quizButton} 
              onPress={() => router.push('/quiz')}
            >
              <LinearGradient
                colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.quizButtonText}>Start Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Show queue page if user has completed quiz but isn't in a group
  if (hasCompletedQuiz && !group) {
    return (
      <LinearGradient
        colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
        locations={[0, 0.4808, 0.9904]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <View style={styles.queueContent}>
          <Animated.View style={[styles.queueIconWrapper, { transform: [{ rotate: globeSpin }] }]}> 
            <Image
              source={require('../../assets/globe.png')}
              style={styles.queueIcon}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.queueTitle}>Finding Your Crew</Text>
          <Text style={styles.queueSubtitle}>
            We're matching you with compatible group members based on your preferences and personality.
          </Text>
          <TouchableOpacity 
            style={styles.queueButton}
            onPress={handleNotifyMe}
          >
            <LinearGradient
              colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.queueButtonText}>Notify Me When Ready</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.queueHint}>
            This usually takes a few minutes. Feel free to check back later!
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%', 
        paddingLeft: 5, 
        paddingRight: 20, 
        paddingTop: insets.top + 6,
        paddingBottom: 8,
        backgroundColor: 'transparent', 
        shadowColor: 'transparent', 
        shadowOpacity: 0, 
        elevation: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transform: [{ translateY: scrollY }]
      }}>
        <Image source={require('../../assets/logo.png')} style={{ width: 180, height: 90, resizeMode: 'contain', marginLeft: -10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 24, 
            backgroundColor: '#E0E7FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4
          }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#222' }}>{group?.streak_count ?? 0}<Text style={{ fontSize: 18 }}>🔥</Text></Text>
          </View>
          <TouchableOpacity 
            style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            <Image 
              source={user?.avatar_url ? { uri: user.avatar_url } : { uri: 'https://i.pravatar.cc/150?img=1' }}
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 100 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.section}>
          <GroupCard
            name={group?.name || 'Group Name'}
            subdescription={'A pack that tends to pick bold answers 💥'}
            members={group?.members || []}
            promptCount={group?.prompts?.length || 0}
            mapComponent={<GroupMap userLocations={userLocations} />}
          />
        </View>
        
        <View style={styles.section}>
          <PromptCard
            promptType={currentPrompt?.prompt_type === 'photo' ? 'photo' : 'text'}
            date={(() => {
              const d = currentPrompt?.created_at ? new Date(currentPrompt.created_at) : new Date();
              return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
            })()}
            prompt={typeof group?.current_prompt === 'string' ? group.current_prompt : currentPrompt?.content || ''}
            timeLeft={timeLeft.split(' ')[0] || ''}
            onRespond={() => {
              if (!group) return handleJoinGroup();
              router.push('/(tabs)/prompt');
            }}
          />
        </View>
        <View style={{ height: 300 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFF',
    alignItems: 'center',
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
    marginBottom: 32,
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
    width: 280,
    height: 62,
    borderRadius: 51,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 51,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
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
  },
  quizContent: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.xl,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '90%',
    maxWidth: 400,
  },
  quizTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: '#222',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '700',
  },
  quizDescription: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: '#888',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    padding: theme.spacing.xl,
    width: '90%',
    alignSelf: 'center',
  },
  queueIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  queueIcon: {
    width: 90,
    height: 90,
  },
  queueButton: {
    width: 260,
    height: 56,
    borderRadius: 51,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: theme.spacing.lg,
  },
  queueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 24,
    fontSize: 20,
    color: '#222',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '700',
    paddingHorizontal: 24,
  },
  currentUserText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: theme.typography.fontSize.md + 1,
  },
});