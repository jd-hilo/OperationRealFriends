import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow, format, isSameDay } from 'date-fns';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Message, User, Submission, Prompt } from '../../types';
import Card from '../../components/Card';
import { useAuth } from '../../lib/auth';
import { translateMessage, Language, LANGUAGES } from '../../lib/translations';

interface ChatMessageProps {
  message: Message;
  user: User;
  isCurrentUser: boolean;
  currentUserLanguage?: string;
}

const DaySeparator: React.FC<{ date: Date }> = ({ date }) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dateText;
  if (isSameDay(date, today)) {
    dateText = 'Today';
  } else if (isSameDay(date, yesterday)) {
    dateText = 'Yesterday';
  } else {
    dateText = format(date, 'MMMM d, yyyy');
  }

  return (
    <View style={styles.daySeparator}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorText}>{dateText}</Text>
      <View style={styles.separatorLine} />
    </View>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, isCurrentUser, currentUserLanguage }) => {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateIfNeeded = async () => {
      if (!isCurrentUser && currentUserLanguage) {
        // Find the language key that matches the user's preferred language
        const targetLanguage = Object.entries(LANGUAGES).find(
          ([_, value]) => value === currentUserLanguage
        )?.[0] as Language | undefined;

        if (targetLanguage) {
          setIsTranslating(true);
          try {
            const translated = await translateMessage(message.message_text, targetLanguage);
            setTranslatedText(translated);
          } catch (error) {
            console.error('Translation error:', error);
            setTranslatedText(message.message_text);
          } finally {
            setIsTranslating(false);
          }
        }
      }
    };

    translateIfNeeded();
  }, [message.message_text, isCurrentUser, currentUserLanguage]);

  if (isCurrentUser) {
    // Keep current user messages as is
    return (
      <View style={[styles.messageContainer, styles.currentUserMessage]}>
        <View style={[styles.messageBubble, styles.currentUserBubble, styles.shadowMd]}>
          <Text style={[styles.messageText, styles.currentUserText]}>
            {message.message_text}
          </Text>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  }

  // For other users, show avatar as oval, name in bold, message, and white bubble with shadow
  return (
    <View style={[styles.messageContainer, styles.otherUserMessage]}>
        <Image
          source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
        style={styles.avatarOval}
        />
      <View style={[styles.messageBubble, styles.otherUserBubble, styles.shadowMd]}>
        <Text style={styles.usernameBold}>{user?.email?.split('@')[0] || 'Anonymous'}</Text>
        {isTranslating ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.translatingIndicator} />
        ) : (
          <Text style={styles.messageText}>
            {translatedText || message.message_text}
          </Text>
        )}
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
};

interface SubmissionPostProps {
  submission: Submission;
  user: User;
  prompt: Prompt;
  isCurrentUser: boolean;
  currentUserLanguage?: string;
}

const SubmissionPost: React.FC<SubmissionPostProps> = ({ submission, user, prompt, isCurrentUser, currentUserLanguage }) => {
  const [translatedPrompt, setTranslatedPrompt] = useState<string | null>(null);
  const [translatedResponse, setTranslatedResponse] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateIfNeeded = async () => {
      if (!isCurrentUser && currentUserLanguage) {
        // Find the language key that matches the user's preferred language
        const targetLanguage = Object.entries(LANGUAGES).find(
          ([_, value]) => value === currentUserLanguage
        )?.[0] as Language | undefined;

        if (targetLanguage) {
          setIsTranslating(true);
          try {
            const [translatedPromptText, translatedResponseText] = await Promise.all([
              translateMessage(prompt?.content || '', targetLanguage),
              translateMessage(submission.response_text, targetLanguage)
            ]);
            setTranslatedPrompt(translatedPromptText);
            setTranslatedResponse(translatedResponseText);
          } catch (error) {
            console.error('Translation error:', error);
            setTranslatedPrompt(prompt?.content || '');
            setTranslatedResponse(submission.response_text);
          } finally {
            setIsTranslating(false);
          }
        }
      }
    };

    translateIfNeeded();
  }, [prompt?.content, submission.response_text, isCurrentUser, currentUserLanguage]);

  return (
    <Card style={styles.submissionPost}>
      <View style={styles.submissionHeader}>
        <Image
          source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
          style={styles.avatarOval}
        />
        <View style={styles.submissionInfo}>
          <Text style={styles.usernameBold}>{user?.preferred_name || user?.email?.split('@')[0] || 'Anonymous'}</Text>
          <Text style={styles.submissionTime}>
            {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
      <View style={styles.submissionContent}>
        {isTranslating ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.translatingIndicator} />
        ) : (
          <>
            <Text style={styles.submissionPrompt}>"{translatedPrompt || prompt?.content}"</Text>
            <Text style={styles.submissionResponse}>{translatedResponse || submission.response_text}</Text>
          </>
        )}
      </View>
    </Card>
  );
};

export default function ConnectScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [prompts, setPrompts] = useState<Record<string, Prompt>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to group messages and submissions by day
  const groupMessagesAndSubmissionsByDay = (messages: Message[], submissions: Submission[]) => {
    const allItems: { date: Date; type: 'message' | 'submission'; data: Message | Submission }[] = [];
    
    // Add messages
    messages.forEach((message) => {
      allItems.push({
        date: new Date(message.created_at),
        type: 'message',
        data: message
      });
    });

    // Add submissions
    submissions.forEach((submission) => {
      allItems.push({
        date: new Date(submission.created_at),
        type: 'submission',
        data: submission
      });
    });

    // Sort all items by date
    allItems.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by day
    const grouped: { date: Date; items: { type: 'message' | 'submission'; data: Message | Submission }[] }[] = [];
    
    allItems.forEach((item) => {
      const existingGroup = grouped.find(group => 
        isSameDay(group.date, item.date)
      );
      
      if (existingGroup) {
        existingGroup.items.push({ type: item.type, data: item.data });
      } else {
        grouped.push({
          date: item.date,
          items: [{ type: item.type, data: item.data }]
        });
      }
    });
    
    return grouped;
  };

  useEffect(() => {
    const setup = async () => {
      if (!user) return;

      try {
        // First get the user's current_group_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('current_group_id')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          setError('Failed to load chat. Please try again.');
          setLoading(false);
          return;
        }

        if (!userData?.current_group_id) {
          setError('No group found. Please join a group first.');
          setLoading(false);
          return;
        }

        await fetchMessages(userData.current_group_id);
        await fetchSubmissions(userData.current_group_id);
      } catch (error) {
        console.error('Error in setup:', error);
        setError('Failed to initialize chat. Please try again.');
        setLoading(false);
      }
    };

    setup();
  }, [user]);

  const fetchMessages = async (groupId: string) => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all messages for the group, ordered by creation time
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messageError) {
        setError('Failed to load messages.');
        return;
      }

      setMessages(messageData || []);

      // Fetch user data for avatars/names
      const userIds = [...new Set((messageData || []).map(m => m.user_id))];
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (!userError && userData) {
          const userMap = userData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
          setUsers(userMap);
        }
      }

      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSubmissions = async (groupId: string) => {
    try {
      // Fetch submissions with user and prompt data
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
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
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        return;
      }

      // Filter submissions to only include users in the current group
      const filteredSubmissions = submissionsData?.filter(submission => {
        const submissionUser = submission.users as unknown as User;
        return submissionUser?.current_group_id === groupId;
      }) || [];

      setSubmissions(filteredSubmissions);

      // Create user map from submissions
      const userMap = filteredSubmissions.reduce((acc: Record<string, User>, submission) => {
        const submissionUser = submission.users as unknown as User;
        if (submissionUser) {
          acc[submissionUser.id] = submissionUser;
        }
        return acc;
      }, {});

      // Create prompt map
      const promptMap = filteredSubmissions.reduce((acc: Record<string, Prompt>, submission) => {
        const submissionPrompt = submission.prompts as unknown as Prompt;
        if (submissionPrompt) {
          acc[submissionPrompt.id] = submissionPrompt;
        }
        return acc;
      }, {});

      setUsers(prev => ({ ...prev, ...userMap }));
      setPrompts(promptMap);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);

          // Fetch user data if not already cached
          if (!users[newMessage.user_id]) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', newMessage.user_id)
              .single();

            if (userData) {
              setUsers(prev => ({
                ...prev,
                [userData.id]: userData
              }));
            }
          }

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Scroll to bottom when messages change (initial load)
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length, loading]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;

    try {
      // Get the user's current_group_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_group_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.current_group_id) {
        setError('Failed to send message. Please try again.');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            group_id: userData.current_group_id,
            user_id: user.id,
            message_text: message.trim(),
            created_at: new Date().toISOString()
          }
        ]);

      if (!error) setMessage('');
    } catch (error) {
      setError('Failed to send message.');
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    
    // Get the user's current_group_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('current_group_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.current_group_id) {
      setError('Failed to refresh. Please try again.');
      setRefreshing(false);
      return;
    }

    await fetchMessages(userData.current_group_id);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.gradientBackground}>
        {/* Use a gradient background. If using expo-linear-gradient, replace with <LinearGradient ... /> */}
      </View>
    <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {submissions.length === 0 && messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
          </View>
        ) : (
          groupMessagesAndSubmissionsByDay(messages, submissions).map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              <DaySeparator date={group.date} />
              {group.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {item.type === 'message' ? (
                    <ChatMessage
                      message={item.data as Message}
                      user={users[(item.data as Message).user_id]}
                      isCurrentUser={(item.data as Message).user_id === user?.id}
                      currentUserLanguage={user?.preferred_language as Language | undefined}
                    />
                  ) : (
                    <SubmissionPost
                      submission={item.data as Submission}
                      user={users[(item.data as Submission).user_id]}
                      prompt={prompts[(item.data as Submission).prompt_id]}
                      isCurrentUser={(item.data as Submission).user_id === user?.id}
                      currentUserLanguage={user?.preferred_language as Language | undefined}
                    />
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={24}
            color={message.trim() ? '#FFFFFF' : theme.colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Off-white background
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    maxWidth: '70%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: '#000',
  },
  messageBubble: {
    padding: theme.spacing.sm,
    borderRadius: 12,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  currentUserBubble: {
    backgroundColor: '#FFFFFF', // White background
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF', // Flat white
  },
  username: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 18,
    fontWeight: '500',
  },
  currentUserText: {
    color: theme.colors.text.primary, // Black text
  },
  otherUserText: {
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    maxHeight: 100,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#9CA3AF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#87CEEB',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  avatarOval: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.sm,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#000',
  },
  usernameBold: {
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FAFAFA', // Off-white fallback
  },
  daySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#FAFAFA',
  },
  submissionPost: {
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
  submissionInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  submissionContent: {
    marginTop: theme.spacing.sm,
  },
  submissionPrompt: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  submissionResponse: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  submissionTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  translatingIndicator: {
    marginVertical: theme.spacing.xs,
  },
}); 