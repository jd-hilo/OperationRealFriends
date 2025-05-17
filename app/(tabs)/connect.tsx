import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatMessage } from '../../components/ChatMessage';

export default function ConnectScreen() {
  const [message, setMessage] = useState('');

  // Mock data - replace with real data from your backend
  const messages = [
    {
      id: 1,
      message: "Hey everyone! How's your day going?",
      username: 'User 1',
      timestamp: new Date(Date.now() - 3600000),
      isCurrentUser: false,
    },
    {
      id: 2,
      message: 'Pretty good! Just finished the daily prompt.',
      username: 'You',
      timestamp: new Date(Date.now() - 1800000),
      isCurrentUser: true,
    },
    {
      id: 3,
      message: 'Same here! The prompt was really interesting today.',
      username: 'User 3',
      timestamp: new Date(Date.now() - 900000),
      isCurrentUser: false,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Add your message sending logic here
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            username={msg.username}
            timestamp={msg.timestamp}
            isCurrentUser={msg.isCurrentUser}
          />
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialCommunityIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
}); 