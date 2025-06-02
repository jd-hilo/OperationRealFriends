import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { format } from 'date-fns';
import { CheckCircle2, Lightbulb } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../lib/supabase';
import { Prompt, Submission, User, Group } from '../../types';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface SubmissionCardProps {
  submission: Submission;
  user: User;
  isCurrentUser: boolean;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, user, isCurrentUser }) => {
  return (
    <View style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        <Image
          source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
          style={styles.avatar}
        />
        <View style={styles.submissionInfo}>
          <Text style={styles.submissionUsername}>{user?.email || 'Anonymous'}</Text>
          <Text style={styles.submissionTime}>
            {format(new Date(submission.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
        {isCurrentUser && (
          <CheckCircle2 size={20} color={theme.colors.primary} />
        )}
      </View>
      <Text style={styles.submissionText}>{submission.response_text}</Text>
    </View>
  );
};

export default function PromptScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [promptDueDate, setPromptDueDate] = useState<Date | null>(null);
  const MAX_CHARS = 500;

  useEffect(() => {
    if (!user) return;

    const fetchPromptAndSubmissions = async () => {
      try {
        console.log('Fetching data for user:', user.id);
        
        // First get the user's current_group_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('current_group_id')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }

        console.log('User data:', userData);

        if (!userData?.current_group_id) {
          console.error('No group found for user');
          return;
        }

        // Fetch group data with the prompt using a join
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*, prompts!current_prompt_id(*)')
          .eq('id', userData.current_group_id)
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
        setPrompt(groupData.prompts);
        
        // Set up timer if group has next_prompt_due
        if (groupData.next_prompt_due) {
          const nextPromptDue = new Date(groupData.next_prompt_due);
          setPromptDueDate(nextPromptDue);
          
          console.log('Next prompt due:', groupData.next_prompt_due);
          console.log('Parsed date:', nextPromptDue);
          
          const now = new Date();
          console.log('Current time:', now);
          if (now > nextPromptDue) {
            console.log('Timer expired, setting to 0');
            setTimeLeft('0');
          } else {
            const hours = Math.floor((nextPromptDue.getTime() - now.getTime()) / (1000 * 60 * 60));
            console.log('Hours remaining:', hours);
            setTimeLeft(hours.toString());
          }
        } else {
          console.log('No next_prompt_due found in group data');
        }
        
        // Check if user has already submitted
        const { data: userSubmission, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('group_id', groupData.id)
          .eq('user_id', user.id)
          .single();
        
        if (!submissionError && userSubmission) {
          console.log('User submission found:', userSubmission);
          setHasSubmitted(true);
          setResponse(userSubmission.response_text);
        }
        
        // Only fetch submissions if we have a prompt
        if (!groupData.prompts?.id) {
          console.log('No prompt found for this group');
          return;
        }

        // Fetch all submissions for testing
        console.log('Fetching submissions for current group');
        console.log('Current user ID:', user.id);
        console.log('Current group ID:', groupData.id);
        console.log('Current prompt ID:', groupData.prompts.id);
        
        try {
          // Fetch submissions for this group and prompt
          const { data: submissionsWithRelations, error: relationsError } = await supabase
            .from('submissions')
            .select(`
              id,
              user_id,
              group_id,
              prompt_id,
              response_text,
              created_at,
              users:user_id (
                id,
                email,
                preferred_name,
                avatar_url,
                current_group_id
              ),
              prompts:prompt_id (
                id,
                content
              )
            `)
            .eq('group_id', groupData.id)
            .eq('prompt_id', groupData.prompts.id)
            .order('created_at', { ascending: true });
          
          if (relationsError) {
            console.error('Error fetching submissions with relations:', relationsError);
            return;
          }

          console.log('Submissions with relations:', submissionsWithRelations);
          
          // Filter submissions to only include users in the current group
          const filteredSubmissions = submissionsWithRelations?.filter(submission => {
            const submissionUser = submission.users as unknown as User;
            return submissionUser?.current_group_id === groupData.id;
          }) || [];
          
          setSubmissions(filteredSubmissions);

          // Create user map from the filtered submissions
          const userMap = filteredSubmissions.reduce((acc: Record<string, User>, submission) => {
            const submissionUser = submission.users as unknown as User;
            if (submissionUser) {
              acc[submissionUser.id] = submissionUser;
            }
            return acc;
          }, {});
          
          setUsers(userMap);
        } catch (error) {
          console.error('Unexpected error fetching submissions:', error);
        }

        // Set up subscription for new submissions
        const subscription = supabase
          .channel('submissions')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'submissions',
              filter: `group_id=eq.${groupData.id}`
            },
            async (payload) => {
              console.log('New submission received:', payload);
              const newSubmission = payload.new as Submission;
              
              // Fetch the user data for the new submission
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', newSubmission.user_id)
                .single();

              // Only add the submission if the user is in the current group
              if (userData && userData.current_group_id === groupData.id) {
                setUsers(prev => ({
                  ...prev,
                  [userData.id]: userData
                }));
                
                setSubmissions(prev => [...prev, newSubmission]);
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching prompt data:', error);
      }
    };
    
    fetchPromptAndSubmissions();
  }, [user]);

  // Timer update effect
  useEffect(() => {
    if (!promptDueDate) return;

    const updateTimer = () => {
      const now = new Date();
      if (now > promptDueDate) {
        console.log('Timer update: expired, setting to 0');
        setTimeLeft('0');
        return true; // Return true to indicate timer should stop
      } else {
        const hours = Math.floor((promptDueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        console.log('Timer update: hours remaining:', hours);
        setTimeLeft(hours.toString());
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
    }, 1000 * 60); // Update every minute for hours

    return () => clearInterval(timer);
  }, [promptDueDate]);

  const handleSubmit = async () => {
    if (!response.trim() || !user || !group || !prompt) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }
    
    try {
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setLoading(true);
      
      // Check if user has already submitted to this prompt
      const { data: existingSubmission, error: checkError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('prompt_id', prompt.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing submission:', checkError);
        throw checkError;
      }
      
      if (existingSubmission) {
        Alert.alert('Already Submitted', 'You have already submitted a response to this prompt.');
        return;
      }
      
      console.log('Submitting response for group:', group.id);
      const { data: newSubmission, error } = await supabase
        .from('submissions')
        .insert([
          {
            user_id: user.id,
            group_id: group.id,
            prompt_id: prompt.id,
            response_text: response.trim(),
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error submitting response:', error);
        throw error;
      }
      
      console.log('Response submitted successfully');
      setHasSubmitted(true);

      // Add the new submission to the submissions list
      if (newSubmission) {
        setSubmissions(prev => [...prev, newSubmission]);
        
        // Add the current user to the users map if not already present
        setUsers(prev => ({
          ...prev,
          [user.id]: {
            id: user.id,
            email: user.email || '',
            created_at: new Date().toISOString(),
            has_completed_quiz: true,
            current_group_id: group.id,
            submitted: true,
            last_submission_date: new Date().toISOString(),
            streak_count: 0 // Add default streak count
          }
        }));
      }

      // Navigate to connect screen after successful submission
      router.replace('/(tabs)/connect');
      
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit your response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setResponse(text);
      setCharacterCount(text.length);
    }
  };

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.scrollView}>
        <View style={styles.promptContainer}>
          <View style={styles.promptHeader}>
            <View style={styles.leftSection}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>
                  {prompt?.created_at ? new Date(prompt.created_at).toLocaleDateString('en-US', { day: '2-digit' }) : new Date().toLocaleDateString('en-US', { day: '2-digit' })}
                </Text>
                <Text style={styles.dateMonth}>
                  {prompt?.created_at ? new Date(prompt.created_at).toLocaleDateString('en-US', { month: 'short' }) : new Date().toLocaleDateString('en-US', { month: 'short' })}
                </Text>
                <LinearGradient
                  colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dateUnderline}
                />
              </View>
            </View>
            {hasSubmitted ? (
              <View style={[styles.timerCircle, { backgroundColor: '#E6FCEB', borderColor: '#34D399' }]}> 
                <CheckCircle2 size={32} color="#22C55E" />
              </View>
            ) : (
              <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{timeLeft || '24'}</Text>
                <Text style={styles.timerLabel}>Hours</Text>
              </View>
            )}
          </View>
          <View style={styles.promptSection}>
            <Text style={styles.promptTitle}>Today's prompt</Text>
            <Text style={styles.promptText}>
              {prompt?.content || <LoadingSpinner />}
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
            {!hasSubmitted ? (
            <>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Type your response here..."
                placeholderTextColor="#999"
                value={response}
                onChangeText={handleTextChange}
              />
              <View style={styles.characterCountContainer}>
                <Text style={styles.characterCount}>
                  {characterCount}/{MAX_CHARS}
                </Text>
              </View>
              <Button
                title="Submit Response"
                onPress={handleSubmit}
                loading={loading}
                disabled={response.trim().length === 0 || loading}
              />
            </>
            ) : (
              <View style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <Image
                    source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=1` }}
                    style={styles.avatar}
                  />
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionUsername}>{user?.preferred_name || user?.email?.split('@')[0] || 'You'}</Text>
                    <Text style={styles.submissionTime}>
                      {format(new Date(), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                  <CheckCircle2 size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.submissionText}>{response}</Text>
              </View>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  promptContainer: {
    padding: 30,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    margin: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  dateDay: {
    fontSize: 16,
    color: '#222',
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timerText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#222',
    marginTop: 2,
  },
  timerLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: -2,
  },
  promptSection: {
    marginBottom: 20,
  },
  promptTitle: {
    fontSize: 24,
    color: '#222',
    fontWeight: '700',
  },
  promptText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 24,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    padding: 20,
    paddingTop: 30,
    fontSize: 16,
    color: '#222',
    minHeight: 150,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    fontWeight: '500',
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 20,
  },
  characterCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  submissionCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionUsername: {
    fontSize: 16,
    color: '#222',
    fontWeight: '700',
  },
  submissionTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  submissionText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
});