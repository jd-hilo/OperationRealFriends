import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { Smile, Clock, PenLine, Award, LogOut, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import MemberIcon from '../../components/MemberIcon';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import { Group, Prompt, Submission, User } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const { userId, groupId, refreshGroupId, initialize } = useUserStore();
  const { signOut, hasCompletedQuiz, user: authUser } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    initialize();
  }, [authUser?.id]);

    const fetchData = async () => {
    if (!userId) {
      console.log('No userId available');
      return;
    }

    try {
      setLoading(true);
      
      // Debug: Query the group directly
      const { data: debugGroup, error: debugError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      
      console.log('Debug - Direct group query result:', debugGroup);
      if (debugError) {
        console.error('Debug - Direct group query error:', debugError);
      }
      
      // Refresh group ID first
      const currentGroupId = await refreshGroupId();
      console.log('Current groupId after refresh:', currentGroupId);
      
      if (!currentGroupId) {
        console.log('No groupId available after refresh');
        setGroup(null);
        setCurrentPrompt(null);
        setSubmissions([]);
        return;
      }
      
      // Fetch group data
      console.log('Attempting to fetch group with ID:', currentGroupId);
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*, prompts!current_prompt_id(*)')
        .eq('id', currentGroupId)
        .single();
        
      if (groupError) {
        console.error('Error fetching group:', groupError);
        console.log('Group ID that failed:', currentGroupId);
        throw groupError;
      }
      
      if (!groupData) {
        console.log('No group data returned for ID:', currentGroupId);
        setGroup(null);
        setCurrentPrompt(null);
        setSubmissions([]);
        return;
      }

      console.log('Successfully fetched group data:', groupData);
      setGroup(groupData);
        
      // Fetch the prompt associated with the group
      if (!groupData.current_prompt_id) {
        console.log('No current_prompt_id in group data');
        return;
      }

      console.log('Fetching prompt with ID:', groupData.current_prompt_id);
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', groupData.current_prompt_id)
        .single();
        
      if (promptError) {
        console.error('Error fetching prompt:', promptError);
        throw promptError;
      }
        
      // Fetch submissions for today's prompt from group members
      if (promptData) {
        console.log('Fetching submissions for prompt:', promptData.id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('prompt_id', promptData.id)
          .eq('group_id', currentGroupId)
          .order('created_at', { ascending: true });
        
        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          throw submissionsError;
        }
        
        console.log('Successfully fetched submissions:', submissionsData?.length || 0);
        setCurrentPrompt(promptData);
        setSubmissions(submissionsData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
  }, [userId]);

  const hasSubmitted = submissions.some(s => s.user_id === userId);
  const memberCount = group?.member_ids?.length || 0;
  const submissionCount = submissions.length;
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/entry');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleJoinGroup = async () => {
    try {
      setError(null);
      setIsJoining(true);
      if (!authUser?.id) {
        setError('Please sign in to join a group');
        return;
      }
      if (!userId) {
        setError('Please wait while we load your account...');
        return;
      }
      console.log('Joining group with user ID:', userId);
      await useUserStore.getState().assignToGroup();
      console.log('Group assignment completed, refreshing data...');
      await fetchData();
      console.log('Data refresh completed');
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err instanceof Error ? err.message : 'Failed to join group. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

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
            {group?.member_ids?.map((memberId, i) => {
              console.log('Rendering member:', memberId);
              return (
                <View key={memberId} style={styles.memberItem}>
              <MemberAvatar 
                    user={{
                      id: memberId,
                      email: `member${i + 1}@example.com`,
                      created_at: new Date().toISOString(),
                      quiz_answers: {
                        question1: 0,
                        question2: 0,
                        question3: 0,
                        question4: 0,
                        question5: 0,
                        question6: 0
                      },
                      current_group_id: groupId
                    }}
                    submitted={submissions.some(s => s.user_id === memberId)}
                index={i}
              />
                  <Text style={styles.memberName}>
                    Member {i + 1}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.membersStats}>
            {submissions.length}/{group?.member_ids?.length ?? 0} checked in today
          </Text>
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
          <Text style={styles.promptText}>
              {group?.current_prompt || currentPrompt?.question_text || "Loading prompt..."}
          </Text>
            {!hasCompletedQuiz ? (
          <TouchableOpacity 
                style={[styles.promptButton, styles.quizButton]}
                onPress={() => router.push('/quiz')}
              >
                <Text style={styles.promptButtonText}>Take Quiz First</Text>
              </TouchableOpacity>
            ) : !groupId ? (
              <View>
                <TouchableOpacity 
                  style={[styles.promptButton, styles.joinButton]}
                  onPress={handleJoinGroup}
                  disabled={isJoining}
                >
                  <Text style={styles.promptButtonText}>
                    {isJoining ? 'Joining...' : 'Join Group'}
            </Text>
          </TouchableOpacity>
                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => router.push('/prompt')}
              >
                <Text style={styles.promptButtonText}>
                  {hasSubmitted ? 'View Responses' : 'Answer Prompt'}
                </Text>
              </TouchableOpacity>
            )}
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
});