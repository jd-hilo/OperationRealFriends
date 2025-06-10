import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, RefreshControl, Pressable, Alert, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow, format, isSameDay } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Message, User, Submission, Prompt, Reaction } from '../../types';
import Card from '../../components/Card';
import { useAuth } from '../../lib/auth';
import { translateMessage, Language, LANGUAGES } from '../../lib/translations';
import EmojiPicker from '../../components/EmojiPicker';
import { reportMessage } from '../../lib/reports';

interface ChatMessageProps {
  message: Message;
  user: User;
  isCurrentUser: boolean;
  currentUserLanguage?: string;
  onDelete?: (message: Message) => void;
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

const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, isCurrentUser, currentUserLanguage, onDelete }) => {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<Reaction[]>(message.reactions || []);
  const { user: currentUser } = useAuth();

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

  const handleAddReaction = async (emoji: string) => {
    if (!currentUser) return;

    // Trigger haptic feedback immediately
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Check if this emoji reaction already exists
      const existingReaction = localReactions?.find(r => r.emoji === emoji && r.user_id === currentUser.id);
      
      if (existingReaction) {
        // Remove existing reaction immediately from local state
        setLocalReactions(prev => 
          prev.filter(r => !(r.emoji === emoji && r.user_id === currentUser.id))
        );

        // Remove from database
        const { error } = await supabase
          .from('reactions')
          .delete()
          .match({ 
            message_id: message.id, 
            user_id: currentUser.id,
            emoji: emoji 
          });

        if (error) {
          // Restore on error
          setLocalReactions(prev => [...prev, existingReaction]);
          throw error;
        }
      } else {
        // Create optimistic reaction
        const optimisticReaction: Reaction = {
          id: `temp-${Date.now()}`,
          message_id: message.id,
          user_id: currentUser.id,
          emoji: emoji,
          created_at: new Date().toISOString()
        };

        // Add reaction immediately to local state
        setLocalReactions(prev => [...prev, optimisticReaction]);

        // Add to database
        const { data: newReaction, error } = await supabase
          .from('reactions')
          .insert([{
            message_id: message.id,
            user_id: currentUser.id,
            emoji: emoji
          }])
          .select()
          .single();

        if (error) {
          // Remove optimistic reaction on error
          setLocalReactions(prev => prev.filter(r => r.id !== optimisticReaction.id));
          throw error;
        } else {
          // Replace optimistic reaction with real one
          setLocalReactions(prev => prev.map(r => 
            r.id === optimisticReaction.id ? newReaction : r
          ));
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleReactionPress = async (emoji: string, userId: string) => {
    try {
      if (userId === currentUser?.id) {
        // If the current user clicked their own reaction, remove it
        const { error } = await supabase
          .from('reactions')
          .delete()
          .match({ 
            message_id: message.id, 
            user_id: currentUser.id,
            emoji: emoji 
          });

        if (error) throw error;

        // Update local state to remove the reaction
        setLocalReactions(prev => 
          prev.filter(r => !(r.emoji === emoji && r.user_id === currentUser.id))
        );
      } else {
        // If clicking someone else's reaction, add your own
        const { error } = await supabase
          .from('reactions')
          .insert([{
            message_id: message.id,
            user_id: currentUser?.id,
            emoji: emoji
          }]);

        if (error) throw error;

        // Update local state to add the new reaction
        setLocalReactions(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            message_id: message.id,
            user_id: currentUser!.id,
            emoji: emoji,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleLongPress = () => {
    if (isCurrentUser && onDelete) {
      onDelete(message);
    } else {
      Alert.alert(
        'Report Message',
        'Would you like to report this message?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Report',
            style: 'destructive',
            onPress: async () => {
              try {
                const { success, error } = await reportMessage(message.id, 'Inappropriate content');
                if (success) {
                  Alert.alert('Success', 'Message has been reported.');
                } else {
                  Alert.alert('Error', error || 'Failed to report message.');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to report message.');
              }
            }
          }
        ]
      );
    }
  };

  // Update the reactions rendering to use localReactions instead of message.reactions
  const renderReactions = () => {
    if (!localReactions.length) return null;

    const groupedReactions = localReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: []
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_id);
      return acc;
    }, {} as Record<string, { count: number; users: string[] }>);

    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(groupedReactions).map(([emoji, { count, users }]) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.reactionBubble,
              users.includes(currentUser?.id || '') && styles.ownReaction
            ]}
            onPress={() => handleReactionPress(emoji, users[0])}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 1 && (
              <Text style={styles.reactionCount}>{count}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isCurrentUser) {
    return (
      <View style={[styles.messageContainer, styles.currentUserMessage]}>
        <View style={styles.messageWrapper}>
          <Pressable
            onLongPress={handleLongPress}
            style={[styles.messageBubble, styles.currentUserBubble, styles.shadowMd]}
          >
            <Text style={[styles.messageText, styles.currentUserText]}>
              {message.message_text}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={styles.timestamp}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </Text>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => setShowEmojiPicker(true)}
              >
                <MaterialCommunityIcons
                  name="emoticon-outline"
                  size={16}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>

        {renderReactions()}

        <EmojiPicker
          visible={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={handleAddReaction}
        />
      </View>
    );
  }

  return (
    <View style={[styles.messageContainer, styles.otherUserMessage]}>
      <Image
        source={{ uri: user?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}` }}
        style={styles.avatarOval}
      />
      <View style={styles.messageWrapper}>
        <Pressable
          onLongPress={handleLongPress}
          style={[styles.messageBubble, styles.otherUserBubble, styles.shadowMd]}
        >
          <Text style={styles.usernameBold}>{user?.email?.split('@')[0] || 'Anonymous'}</Text>
          {isTranslating ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.translatingIndicator} />
          ) : (
            <Text style={styles.messageText}>
              {translatedText || message.message_text}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </Text>
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => setShowEmojiPicker(true)}
            >
              <MaterialCommunityIcons
                name="emoticon-outline"
                size={16}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </Pressable>

        {renderReactions()}
      </View>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleAddReaction}
      />
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
    <View style={styles.submissionPost}>
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
    </View>
  );
};

export default function ConnectScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

      // Fetch reactions for all messages
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select('*')
        .in('message_id', messageData.map(m => m.id));

      if (reactionsError) throw reactionsError;

      // Group reactions by message
      const reactionsByMessage = reactionsData.reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, any[]>);

      // Add reactions to messages
      const messagesWithReactions = messageData.map(message => ({
        ...message,
        reactions: reactionsByMessage[message.id] || []
      }));

      setMessages(messagesWithReactions);

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

    const setupSubscriptions = async () => {
      // Get the user's current group ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_group_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.current_group_id) {
        console.error('Error getting user group:', userError);
        return;
      }

      const groupId = userData.current_group_id;

      // Subscribe to new messages
      const messageSubscription = supabase
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
            setMessages(prev => [...prev, { ...newMessage, reactions: [] }]);

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

      // Subscribe to new reactions
      const reactionSubscription = supabase
        .channel('reactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reactions'
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newReaction = payload.new as Reaction;
              setMessages(prev => prev.map(message => 
                message.id === newReaction.message_id
                  ? { ...message, reactions: [...(message.reactions || []), newReaction] }
                  : message
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedReaction = payload.old as Reaction;
              setMessages(prev => prev.map(message => 
                message.id === deletedReaction.message_id
                  ? { ...message, reactions: (message.reactions || []).filter(r => r.id !== deletedReaction.id) }
                  : message
              ));
            }
          }
        )
        .subscribe();

      return () => {
        messageSubscription.unsubscribe();
        reactionSubscription.unsubscribe();
      };
    };

    setupSubscriptions();
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

    const messageText = message.trim();
    setMessage(''); // Clear input immediately

    try {
      // Get the user's current_group_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_group_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.current_group_id) {
        setError('Failed to send message. Please try again.');
        setMessage(messageText); // Restore message on error
        return;
      }

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        group_id: userData.current_group_id,
        user_id: user.id,
        message_text: messageText,
        created_at: new Date().toISOString(),
        reactions: []
      };

      // Add message to local state immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Trigger haptic feedback immediately
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Scroll to bottom immediately
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);

      // Send to database
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert([
          {
            group_id: userData.current_group_id,
            user_id: user.id,
            message_text: messageText,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        // Remove optimistic message and restore input on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        setMessage(messageText);
        setError('Failed to send message.');
      } else {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(m => 
          m.id === optimisticMessage.id ? { ...newMessage, reactions: [] } : m
        ));
      }
    } catch (error) {
      setError('Failed to send message.');
      setMessage(messageText); // Restore message on error
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
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
    <KeyboardAvoidingView
        style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
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
          returnKeyType={Platform.OS === 'ios' ? 'done' : 'send'}
          blurOnSubmit={Platform.OS !== 'ios'}
          onSubmitEditing={() => {
            handleSend();
            Keyboard.dismiss();
          }}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    marginRight: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  currentUserBubble: {
    backgroundColor: '#FAFAFA',
  },
  otherUserBubble: {
    backgroundColor: '#FAFAFA',
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
    padding: 20,
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    padding: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginRight: 12,
    minHeight: 50,
    maxHeight: 120,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    textAlignVertical: 'center',
    fontWeight: '500',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3AB9F9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3AB9F9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
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
    marginRight: 12,
    resizeMode: 'cover',
  },
  usernameBold: {
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  daySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  submissionPost: {
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
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ownReaction: {
    backgroundColor: '#E5E7EB',
  },
  reactionEmoji: {
    fontSize: theme.typography.fontSize.sm,
  },
  reactionCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  messageWrapper: {
    flex: 1,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  reactionButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  keyboardView: {
    flex: 1,
  },
}); 