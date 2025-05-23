import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { Message, User } from '../../types';

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
          source={{ uri: user.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
          style={styles.avatar}
        />
      )}
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        {!isCurrentUser && (
          <Text style={styles.username}>{user.id}</Text>
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

export default function ConnectScreen() {
  const { userId, groupId } = useUserStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      console.log('No groupId available, returning early');
      return;
    }

    console.log('Fetching messages for groupId:', groupId);

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        console.log('Fetching messages for groupId:', groupId);
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (messageError) {
          console.error('Error fetching messages:', messageError);
          return;
        }

        if (messageData) {
          console.log('Fetched messages:', messageData);
          console.log('Group IDs in messages:', messageData.map(m => m.group_id));
          setMessages(messageData);

          // Fetch user data for messages
          const userIds = [...new Set(messageData.map(m => m.user_id))];
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);

          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }

          if (userData) {
            const userMap = userData.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {} as Record<string, User>);
            setUsers(userMap);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
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
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  const handleSend = async () => {
    if (!message.trim() || !userId || !groupId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            group_id: groupId,
            user_id: userId,
            message_text: message.trim(),
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            user={users[msg.user_id]}
            isCurrentUser={msg.user_id === userId}
          />
        ))}
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
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.xs,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    maxHeight: 100,
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
}); 