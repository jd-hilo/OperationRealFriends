import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions, Alert } from 'react-native';
import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { Smile, Clock, PenLine, Award, LogOut, RefreshCw, CheckCircle2, RotateCw, Mic, Camera, Type } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import MemberIcon from '../../components/MemberIcon';
import { supabase } from '../../lib/supabase';
import { Group, Prompt, Submission, User } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { refreshPromptForTestGroup } from '../../lib/prompts';

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
          <View style={styles.overlayContent}>
            <Clock size={16} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );
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
      setGroup(groupData);
      setCurrentPrompt(groupData.prompts);

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

    // Set up timer update
    const timer = setInterval(() => {
      if (group?.created_at) {
        const nextCheckIn = new Date(group.created_at);
        nextCheckIn.setHours(nextCheckIn.getHours() + 24);
        setTimeLeft(formatDistanceToNowStrict(nextCheckIn, { addSuffix: true }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);
  
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
          <Text style={styles.sectionTitle}>Members</Text>
          <View style={styles.membersContainer}>
            <View style={styles.membersList}>
              {group?.members?.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <Image
                    source={{ uri: member.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.email}</Text>
                    <Text style={styles.memberStatus}>
                      {member.submitted ? 'Submitted' : 'Not submitted'}
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
              <Text style={styles.timerText}>{timeLeft}</Text>
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
          <TouchableOpacity 
                style={[styles.promptButton, styles.refreshPromptButton]}
                onPress={handleRefreshPrompt}
              >
                <RotateCw size={20} color="#FFFFFF" />
                <Text style={styles.promptButtonText}>New Prompt</Text>
              </TouchableOpacity>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
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
  },
  membersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  memberItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  memberName: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
    borderColor: theme.colors.primary,
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
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  membersStats: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  timerCard: {
    padding: theme.spacing.lg,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  timerText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  promptCard: {
    padding: theme.spacing.lg,
  },
  promptText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  promptButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  promptButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: '#FFFFFF',
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  signOutButton: {
    padding: theme.spacing.sm,
  },
  quizButton: {
    backgroundColor: theme.colors.secondary,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
  },
  refreshButton: {
    padding: theme.spacing.sm,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
  },
  membersList: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  memberInfo: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  memberStatus: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
  },
  quizTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  quizDescription: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
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
  },
  promptActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  refreshPromptButton: {
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
});