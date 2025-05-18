import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PromptAnswerProps {
  onPressComments: () => void;
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Comment {
  id: number;
  user: string;
  text: string;
  time: string;
  avatar: string;
}

const PromptAnswer: React.FC<PromptAnswerProps> = ({ onPressComments }) => {
  return (
    <View style={styles.promptContainer}>
      <View style={styles.promptHeader}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
          style={styles.avatar}
        />
        <View style={styles.promptInfo}>
          <Text style={styles.promptUsername}>Sarah Johnson</Text>
          <Text style={styles.promptTime}>2 hours ago</Text>
        </View>
      </View>
      <View style={styles.promptContent}>
        <Text style={styles.promptQuestion}>Today's Prompt: What's one thing you're proud of accomplishing recently?</Text>
        <Text style={styles.promptAnswer}>
          I finally finished writing my first short story! It's been a dream of mine for years, and I'm really proud of pushing through the self-doubt to complete it. The process taught me so much about perseverance and creative expression. 🌟
        </Text>
      </View>
      <View style={styles.promptFooter}>
        <TouchableOpacity style={styles.promptAction}>
          <MaterialCommunityIcons name="heart-outline" size={20} color="#666" />
          <Text style={styles.promptActionText}>24</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.promptAction} onPress={onPressComments}>
          <MaterialCommunityIcons name="comment-outline" size={20} color="#666" />
          <Text style={styles.promptActionText}>8</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CommentModal: React.FC<CommentModalProps> = ({ visible, onClose }) => {
  const [comment, setComment] = useState('');

  const comments: Comment[] = [
    {
      id: 1,
      user: 'Alex Chen',
      text: "That's amazing! Writing can be so challenging but also incredibly rewarding.",
      time: '1 hour ago',
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
    {
      id: 2,
      user: 'Maria Garcia',
      text: 'Would love to read it sometime! Keep up the great work!',
      time: '45 mins ago',
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
    {
      id: 3,
      user: 'You',
      text: 'Thank you both for the encouragement! It means a lot.',
      time: '30 mins ago',
      avatar: 'https://i.pravatar.cc/150?img=4'
    }
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>{comment.user}</Text>
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentSendButton, !comment.trim() && styles.commentSendButtonDisabled]}
              disabled={!comment.trim()}
            >
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface PromptAnswerData {
  id: number;
  user: string;
  question: string;
  answer: string;
  likes: number;
  comments: number;
  time: string;
  avatar: string;
}

export default function ConnectScreen() {
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);

  const promptAnswers: PromptAnswerData[] = [
    {
      id: 1,
      user: 'Sarah Johnson',
      question: "What's one thing you're proud of accomplishing recently?",
      answer: "I finally finished writing my first short story! It's been a dream of mine for years, and I'm really proud of pushing through the self-doubt to complete it. The process taught me so much about perseverance and creative expression. 🌟",
      likes: 24,
      comments: 8,
      time: '2 hours ago',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    {
      id: 2,
      user: 'Michael Park',
      question: "What's one thing you're proud of accomplishing recently?",
      answer: "I ran my first 10K race last weekend! Never thought I could do it, but training consistently for the past 3 months really paid off. The feeling of crossing that finish line was incredible! 🏃‍♂️",
      likes: 18,
      comments: 5,
      time: '3 hours ago',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.feedContainer}>
        {promptAnswers.map((prompt) => (
          <PromptAnswer
            key={prompt.id}
            onPressComments={() => setCommentModalVisible(true)}
          />
        ))}
      </ScrollView>

      <CommentModal
        visible={isCommentModalVisible}
        onClose={() => setCommentModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  feedContainer: {
    flex: 1,
    padding: 10,
  },
  promptContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  promptInfo: {
    flex: 1,
  },
  promptUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  promptTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  promptContent: {
    marginBottom: 12,
  },
  promptQuestion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  promptAnswer: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  promptFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  promptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  promptActionText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  commentsList: {
    flex: 1,
    padding: 15,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  commentSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendButtonDisabled: {
    backgroundColor: '#ccc',
  },
}); 