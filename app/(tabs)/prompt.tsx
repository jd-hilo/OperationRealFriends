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
import LoadingSpinner from '../../components/LoadingSpinner';

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

  const handleSubmit = async () => {
    if (!response.trim() || !user || !group || !prompt) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }
    
    try {
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
            {prompt?.content || <LoadingSpinner />}
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
    backgroundColor: '#FAFAFA', // Off-white background
  },
  scrollView: {
    flex: 1,
  },
  promptContainer: {
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
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
    fontWeight: '700',
  },
  promptText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    lineHeight: 24,
    fontWeight: '500',
  },
  inputContainer: {
    padding: theme.spacing.lg,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    fontWeight: '500',
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  characterCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  responsesContainer: {
    padding: theme.spacing.lg,
  },
  responsesTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '700',
  },
  submissionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
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
    borderWidth: 2,
    borderColor: '#000',
  },
  submissionInfo: {
    flex: 1,
  },
  submissionUsername: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  submissionTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  submissionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  noResponsesText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});