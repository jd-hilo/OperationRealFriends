import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Message as MessageType } from '../types';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import EmojiPicker from './EmojiPicker';

interface MessageProps {
  message: MessageType;
  onDelete: (messageId: string) => void;
}

export default function Message({ message, onDelete }: MessageProps) {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<{ emoji: string; count: number; users: string[] }[]>([]);

  const isOwnMessage = message.user_id === user?.id;

  const handleAddReaction = async (emoji: string) => {
    try {
      // Check if this emoji reaction already exists
      const existingReaction = reactions.find(r => r.emoji === emoji);
      
      if (existingReaction) {
        // If user already reacted with this emoji, remove their reaction
        if (existingReaction.users.includes(user!.id)) {
          const { error } = await supabase
            .from('reactions')
            .delete()
            .match({ 
              message_id: message.id, 
              user_id: user!.id,
              emoji: emoji 
            });

          if (error) throw error;

          setReactions(prev => 
            prev.map(r => 
              r.emoji === emoji 
                ? { 
                    ...r, 
                    count: r.count - 1,
                    users: r.users.filter(id => id !== user!.id)
                  }
                : r
            ).filter(r => r.count > 0)
          );
        } else {
          // Add user's reaction
          const { error } = await supabase
            .from('reactions')
            .insert([{
              message_id: message.id,
              user_id: user!.id,
              emoji: emoji
            }]);

          if (error) throw error;

          setReactions(prev => 
            prev.map(r => 
              r.emoji === emoji 
                ? { 
                    ...r, 
                    count: r.count + 1,
                    users: [...r.users, user!.id]
                  }
                : r
            )
          );
        }
      } else {
        // Create new reaction
        const { error } = await supabase
          .from('reactions')
          .insert([{
            message_id: message.id,
            user_id: user!.id,
            emoji: emoji
          }]);

        if (error) throw error;

        setReactions(prev => [
          ...prev,
          { emoji, count: 1, users: [user!.id] }
        ]);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleLongPress = () => {
    if (isOwnMessage) {
      onDelete(message.id);
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={styles.messageWrapper}>
        <Pressable
          onLongPress={handleLongPress}
          style={styles.messageContent}
        >
          <Text style={styles.messageText}>{message.message_text}</Text>
          <Text style={styles.timestamp}>
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </Pressable>

        <TouchableOpacity
          style={styles.reactionButton}
          onPress={() => setShowEmojiPicker(true)}
        >
          <MaterialCommunityIcons
            name="emoticon-outline"
            size={20}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {reactions.length > 0 && (
        <View style={styles.reactionsContainer}>
          {reactions.map((reaction, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.reactionBubble,
                reaction.users.includes(user!.id) && styles.ownReaction
              ]}
              onPress={() => handleAddReaction(reaction.emoji)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              {reaction.count > 1 && (
                <Text style={styles.reactionCount}>{reaction.count}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleAddReaction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageContent: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  reactionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
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
}); 