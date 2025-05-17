import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChatMessageProps {
  message: string;
  username: string;
  timestamp: Date;
  isCurrentUser: boolean;
  avatar?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  username,
  timestamp,
  isCurrentUser,
  avatar,
}) => {
  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUser : styles.otherUser]}>
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Text style={styles.avatar}>{avatar}</Text>
        ) : (
          <MaterialCommunityIcons name="account-circle" size={24} color="#666" />
        )}
      </View>
      <View style={styles.messageContainer}>
        <View style={styles.header}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.timestamp}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  currentUser: {
    flexDirection: 'row-reverse',
  },
  otherUser: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    fontSize: 24,
  },
  messageContainer: {
    maxWidth: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  message: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
  },
}); 