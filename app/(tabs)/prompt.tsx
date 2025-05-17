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
  Alert
} from 'react-native';
import { format } from 'date-fns';
import { CheckCircle2, Lightbulb } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';
import { Prompt, Submission } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PromptScreen() {
  const { userId, groupId } = useUserStore();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARS = 500;

  useEffect(() => {
    const fetchPromptAndSubmissions = async () => {
      if (!groupId) return;
      
      try {
        // Fetch the latest prompt
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (promptError) throw promptError;
        setPrompt(promptData);
        
        // Check if user has already submitted
        if (promptData) {
          const { data: userSubmission, error: submissionError } = await supabase
            .from('submissions')
            .select('*')
            .eq('prompt_id', promptData.id)
            .eq('user_id', userId)
            .single();
          
          if (!submissionError && userSubmission) {
            setHasSubmitted(true);
            setResponse(userSubmission.response_text);
          }
          
          // Fetch all submissions for this prompt from group members
          const { data: allSubmissions, error: allSubmissionsError } = await supabase
            .from('submissions')
            .select('*')
            .eq('prompt_id', promptData.id)
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });
          
          if (!allSubmissionsError) {
            setSubmissions(allSubmissions || []);
          }
        }
      } catch (error) {
        console.error('Error fetching prompt data:', error);
      }
    };
    
    fetchPromptAndSubmissions();
  }, [groupId, userId]);

  const handleSubmit = async () => {
    if (!response.trim() || !userId || !groupId || !prompt) {
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
            prompt_id: prompt.id,
            response_text: response.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      setHasSubmitted(true);
      
      // Refresh submissions to include new one
      const { data: updatedSubmissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('prompt_id', prompt.id)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (updatedSubmissions) {
        setSubmissions(updatedSubmissions);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.promptContainer}>
        <Text style={styles.promptTitle}>Today's Prompt</Text>
        <Text style={styles.promptText}>{prompt?.question_text || "Loading today's question..."}</Text>
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
          {submissions.map((submission, index) => (
            <Card key={submission.id} style={styles.responseItem}>
              <Text style={styles.responseUsername}>
                {submission.user_id === userId ? 'You' : `Member ${index + 1}`}
              </Text>
              <Text style={styles.responseText}>{submission.response_text}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    lineHeight: 28,
  },
  inputContainer: {
    padding: theme.spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 150,
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  characterCountContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  characterCount: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
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
  responseItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  responseUsername: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  responseText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
});
});