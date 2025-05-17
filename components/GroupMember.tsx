import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface GroupMemberProps {
  name: string;
  hasResponded: boolean;
  avatar?: string;
}

export const GroupMember: React.FC<GroupMemberProps> = ({ name, hasResponded, avatar }) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Text style={styles.avatar}>{avatar}</Text>
        ) : (
          <MaterialCommunityIcons name="account-circle" size={40} color="#666" />
        )}
        {hasResponded && (
          <View style={styles.checkmarkContainer}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    fontSize: 40,
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
}); 