import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Message, User, Prompt, Submission } from '../../types';
import Card from '../../components/Card';
import { useAuth } from '../../lib/auth';

interface ChatMessageProps {
  message: Message;
  user: User;
  isCurrentUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, isCurrentUser }) => {
  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {!isCurrentUser && (
        <Image
          source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
          style={styles.avatar}
        />
      )}
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        {!isCurrentUser && (
          <Text style={styles.username}>{user?.email || 'Anonymous'}</Text>
        )}
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {message.message_text}
        </Text>
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
};

interface PromptMessageProps {
  prompt: Prompt;
  submissions: Submission[];
  users: Record<string, User>;
  currentUserId: string;
}

const PromptMessage: React.FC<PromptMessageProps> = ({ prompt, submissions, users, currentUserId }) => {
  return (
    <View style={styles.promptContainer}>
      {submissions.map((submission) => {
        const user = users[submission.user_id];
        return (
          <View key={submission.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image
                source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
                style={styles.postAvatar}
              />
              <View style={styles.postUserInfo}>
                <Text style={styles.postUserName}>{user?.email || 'Anonymous'}</Text>
                <Text style={styles.postTime}>{formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</Text>
              </View>
            </View>
            <Text style={styles.postResponse}>{submission.response_text}</Text>
            <View style={styles.postActions}>
              <MaterialCommunityIcons name="heart-outline" size={20} color="#888" />
              <Text style={styles.postActionText}>24</Text>
              <MaterialCommunityIcons name="comment-outline" size={20} color="#888" style={{ marginLeft: 16 }} />
              <Text style={styles.postActionText}>8</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default function ConnectScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

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

        // Fetch group data
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*, prompts!current_prompt_id(*)')
          .eq('id', userData.current_group_id)
          .single();
        
        if (groupError) {
          console.error('Error fetching group:', groupError);
          setError('Failed to load chat. Please try again.');
          setLoading(false);
          return;
        }

        if (!groupData) {
          setError('No group found. Please join a group first.');
          setLoading(false);
          return;
        }

        await Promise.all([
          fetchMessages(groupData.id),
          fetchPromptAndSubmissions(groupData.id)
        ]);
      } catch (error) {
        console.error('Error in setup:', error);
        setError('Failed to initialize chat. Please try again.');
        setLoading(false);
      }
    };

    setup();
  }, [user]);

  const fetchPromptAndSubmissions = async (groupId: string) => {
    try {
      // Fetch group data with the prompt
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*, prompts!current_prompt_id(*)')
        .eq('id', groupId)
        .single();
      
      if (groupError) {
        console.error('Error fetching group:', groupError);
        return;
      }
      
      if (groupData?.prompts) {
        setPrompt(groupData.prompts);
      }
      
      // Fetch submissions
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('group_id', groupId)
        .eq('prompt_id', groupData?.current_prompt_id || prompt?.id)
        .order('created_at', { ascending: true });
      
      if (!submissionError) {
        setSubmissions(submissionData || []);
      } else {
        console.error('Error fetching submissions:', submissionError);
      }
    } catch (error) {
      console.error('Error fetching prompt data:', error);
    }
  };

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
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Add subscription for submissions
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
          filter: `group_id=eq.${user.id}`
        },
        async (payload) => {
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
  }, [user]);

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
    <KeyboardAvoidingView
      style={styles.container}
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
        {prompt && (
          <PromptMessage
            prompt={prompt}
            submissions={submissions}
            users={users}
            currentUserId={user?.id || ''}
          />
        )}
        
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              user={users[msg.user_id]}
              isCurrentUser={msg.user_id === user?.id}
            />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    maxWidth: '80%',
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
  },
  messageBubble: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: theme.colors.primary,
  },
  otherUserBubble: {
    backgroundColor: theme.colors.surface,
  },
  username: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
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
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    maxHeight: 100,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
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
  promptContainer: {
    marginBottom: theme.spacing.lg,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUserInfo: {
    flexDirection: 'column',
  },
  postUserName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  postTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  postResponse: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  postActionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
}); 