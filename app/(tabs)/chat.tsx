import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard
} from 'react-native';
import { format } from 'date-fns';
import { Send } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/userStore';
import { Message } from '../../types';

export default function ChatScreen() {
  const { userId, groupId } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!groupId) return;
    
    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        if (data) {
          // Reverse to display in chronological order
          setMessages(data.reverse());
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
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
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Scroll to bottom on new message
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !groupId) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            group_id: groupId,
            user_id: userId,
            message_text: newMessage.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      setNewMessage('');
      Keyboard.dismiss();
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === userId;
    
    return (
      <View 
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}
      >
        <View 
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}
        >
          <Text style={styles.messageText}>{item.message_text}</Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Crew Chat</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || loading) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || loading}
        >
          <Send
            size={20}
            color={!newMessage.trim() || loading ? theme.colors.text.tertiary : '#FFFFFF'}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.text.primary,
  },
  messagesContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.primary,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.surface,
  },
  messageText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  messageTime: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.md,
    maxHeight: 100,
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
});