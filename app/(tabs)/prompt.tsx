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
import { useUserStore } from '../../store/userStore';
import { Prompt, Submission, User, Group } from '../../types';

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
          source={{ uri: user.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
          style={styles.avatar}
        />
        <View style={styles.submissionInfo}>
          <Text style={styles.submissionUsername}>
            {isCurrentUser ? 'You' : user.id}
          </Text>
          <Text style={styles.submissionTime}>
            {format(new Date(submission.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
      </View>
      <Text style={styles.submissionText}>{submission.response_text}</Text>
    </Card>
  );
};

export default function PromptScreen() {
  const { userId, groupId } = useUserStore();
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
    console.log('PromptScreen mounted with groupId:', groupId);
    console.log('Current userId:', userId);

    if (!groupId) {
      console.log('No groupId available, returning early');
      return;
    }

    const fetchPromptAndSubmissions = async () => {
      try {
        console.log('Fetching group data for ID:', groupId);
        // Fetch group data with the prompt using a join
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*, prompts!current_prompt_id(*)')
          .eq('id', groupId)
          .single();
        
        if (groupError) {
          console.error('Error fetching group:', groupError);
          console.log('Group ID that failed:', groupId);
          return;
        }
        
        if (!groupData) {
          console.error('No group found for ID:', groupId);
          return;
        }
        
        console.log('Successfully fetched group:', groupData);
        setGroup(groupData);
        setPrompt(groupData.prompts);

        // Check if user has already submitted
        const { data: userSubmission, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single();
          
        if (!submissionError && userSubmission) {
          console.log('Found existing submission for user');
          setHasSubmitted(true);
          setResponse(userSubmission.response_text);
        }
        
        // Fetch all submissions for this group
        const { data: allSubmissions, error: allSubmissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });
        
        if (!allSubmissionsError) {
          console.log('Fetched submissions:', allSubmissions?.length || 0);
          setSubmissions(allSubmissions || []);

          // Fetch user data for submissions
          const userIds = [...new Set(allSubmissions?.map(s => s.user_id) || [])];
          if (userIds.length > 0) {
            console.log('Fetching user data for IDs:', userIds);
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .in('id', userIds);

            if (!userError && userData) {
              console.log('Successfully fetched user data');
              const userMap = userData.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
              }, {} as Record<string, User>);
              setUsers(userMap);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching prompt data:', error);
      }
    };
    
    fetchPromptAndSubmissions();

    // Subscribe to new submissions
    const subscription = supabase
      .channel('submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('New submission received:', payload);
          const newSubmission = payload.new as Submission;
          setSubmissions(prev => [...prev, newSubmission]);

          // Fetch user data if not already cached
          if (!users[newSubmission.user_id]) {
            console.log('Fetching user data for new submission');
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', newSubmission.user_id)
              .single();

            if (userData) {
              console.log('Successfully fetched user data for new submission');
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
      console.log('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [groupId, userId]);

  const handleSubmit = async () => {
    if (!response.trim() || !userId || !groupId || !group) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('submissions')
        .insert([
          {
            user_id: userId,
            group_id: groupId,
            response_text: response.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
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

  const fetchPrompt = async () => {
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*, prompts!current_prompt_id(*)')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setPrompt(group.prompts);
      console.log('Fetched prompt:', group.prompts);
    } catch (error) {
      console.error('Error fetching prompt:', error);
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
      
        {!hasSubmitted ? (
        <View style={styles.inputContainer}>
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
          </View>
        ) : (
        <View style={styles.responsesContainer}>
          <Text style={styles.responsesTitle}>Group Responses</Text>
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                user={users[submission.user_id]}
                isCurrentUser={submission.user_id === userId}
              />
            ))}
          </View>
        )}
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  promptText: {
    fontFamily: 'Nunito-Regular',
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
    fontFamily: 'Nunito-Regular',
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
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  responsesContainer: {
    padding: theme.spacing.lg,
  },
  responsesTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  submissionTime: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  submissionText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
});