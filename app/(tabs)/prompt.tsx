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
import { CheckCircle2, Lightbulb, Mic, Camera, Type } from 'lucide-react-native';
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
        
        // Only fetch submissions if we have a prompt
        if (!groupData.prompts?.id) {
          console.log('No prompt found for this group');
          return;
        }

        // Fetch all submissions for testing
        console.log('Fetching all submissions for testing');
        console.log('Current user ID:', user.id);
        console.log('Current group ID:', groupData.id);
        console.log('Current prompt ID:', groupData.prompts.id);
        console.log('Group member IDs:', groupData.member_ids);
        
        try {
          // First check if user is in the group
          const isUserInGroup = groupData.member_ids.includes(user.id);
          console.log('Is user in group:', isUserInGroup);

          // First try to fetch any submissions for this prompt
          const { data: promptSubmissions, error: promptSubmissionsError } = await supabase
            .from('submissions')
            .select('*')
            .eq('prompt_id', groupData.prompts.id);
          
          console.log('All submissions for this prompt:', promptSubmissions);
          if (promptSubmissionsError) {
            console.error('Error fetching prompt submissions:', promptSubmissionsError);
          }

          // Now fetch submissions for this group and prompt
          const { data: allSubmissions, error: allSubmissionsError } = await supabase
            .from('submissions')
            .select('*')
            .eq('group_id', groupData.id)
            .eq('prompt_id', groupData.prompts.id)
            .order('created_at', { ascending: true });
          
          if (allSubmissionsError) {
            console.error('Error fetching submissions:', allSubmissionsError);
            return;
          }

          console.log('Raw submissions data for group and prompt:', allSubmissions);
          
          if (!allSubmissions || allSubmissions.length === 0) {
            console.log('No submissions found in the database for this group and prompt');
            return;
          }

          // Now fetch the related user and prompt data
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
                email
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
          setSubmissions(submissionsWithRelations || []);

          // Create user map from the joined data
          const userMap = submissionsWithRelations?.reduce((acc, submission) => {
            const user = submission.users as unknown as User;
            if (user) {
              acc[user.id] = user;
            }
            return acc;
          }, {} as Record<string, User>);
          
          setUsers(userMap || {});
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

              if (userData) {
                setUsers(prev => ({
                  ...prev,
                  [userData.id]: userData
                }));
              }
              
              setSubmissions(prev => [...prev, newSubmission]);
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

  const renderPromptTypeIcon = () => {
    switch (prompt?.prompt_type) {
      case 'audio':
        return <Mic size={24} color={theme.colors.primary} />;
      case 'photo':
        return <Camera size={24} color={theme.colors.primary} />;
      default:
        return <Type size={24} color={theme.colors.primary} />;
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
          <View style={styles.promptHeader}>
        <Text style={styles.promptTitle}>Today's Prompt</Text>
            {renderPromptTypeIcon()}
          </View>
          <Text style={styles.promptText}>
            {prompt?.content || "Loading prompt..."}
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
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  promptTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
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