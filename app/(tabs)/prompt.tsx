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

interface SubmissionCardProps {
  submission: Submission;
  user: User;
  isCurrentUser: boolean;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, user, isCurrentUser }) => {
  return (
    <Card style={styles.submissionCard}>
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
    </Card>
  );
};

export default function PromptScreen() {
  const { user } = useAuth();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
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
        
        // Fetch all submissions for this group
        console.log('Fetching all submissions for group:', groupData.id);
        const { data: allSubmissions, error: allSubmissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('group_id', groupData.id)
          .order('created_at', { ascending: true });
        
        if (allSubmissionsError) {
          console.error('Error fetching submissions:', allSubmissionsError);
        } else {
          console.log('Fetched submissions:', allSubmissions?.length || 0);
          setSubmissions(allSubmissions || []);

          // Fetch user data for submissions
          const userIds = [...new Set(allSubmissions?.map(s => s.user_id) || [])];
          console.log('Fetching user data for IDs:', userIds);
          
          if (userIds.length > 0) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .in('id', userIds);

            if (userError) {
              console.error('Error fetching user data:', userError);
            } else if (userData) {
              console.log('Fetched user data:', userData.length);
              const userMap = userData.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
              }, {} as Record<string, User>);
              setUsers(userMap);
            }
          }
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
              setSubmissions(prev => [...prev, newSubmission]);

              // Fetch user data if not already cached
              if (!users[newSubmission.user_id]) {
                const { data: userData } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', newSubmission.user_id)
                  .single();

                if (userData) {
                  setUsers(prev => ({
                    ...prev,
                    [userData.id]: userData
                  }));
                }
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
            prompt_id: prompt?.id,
            response_text: response.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('Error submitting response:', error);
        throw error;
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

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setResponse(text);
      setCharacterCount(text.length);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>Today's Prompt</Text>
          <Text style={styles.promptText}>
            {prompt?.question_text || "Loading prompt..."}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          {!hasSubmitted ? (
            <>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Type your response here..."
                placeholderTextColor={theme.colors.text.tertiary}
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
            <Card style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <Image
                  source={{ uri: users[user?.id || '']?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
                  style={styles.avatar}
                />
                <View style={styles.submissionInfo}>
                  <Text style={styles.submissionUsername}>{users[user?.id || '']?.email || 'You'}</Text>
                  <Text style={styles.submissionTime}>
                    {format(new Date(), 'MMM d, h:mm a')}
                  </Text>
                </View>
                <CheckCircle2 size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.submissionText}>{response}</Text>
            </Card>
          )}
        </View>

        <View style={styles.responsesContainer}>
          <Text style={styles.responsesTitle}>Group Responses</Text>
          {submissions.length === 0 ? (
            <Text style={styles.noResponsesText}>No responses yet. Be the first to share!</Text>
          ) : (
            submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                user={users[submission.user_id]}
                isCurrentUser={submission.user_id === user?.id}
              />
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  promptContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  promptTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  promptText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  inputContainer: {
    padding: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  characterCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  responsesContainer: {
    padding: theme.spacing.lg,
  },
  responsesTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  submissionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionUsername: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  submissionTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  submissionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  noResponsesText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
});