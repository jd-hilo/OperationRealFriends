import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GroupMember } from '../../components/GroupMember';
import { Timer } from '../../components/Timer';

export default function HomeScreen() {
  // Mock data - replace with real data from your backend
  const groupMembers = [
    { id: 1, name: 'User 1', hasResponded: true, avatar: '👤' },
    { id: 2, name: 'User 2', hasResponded: false, avatar: '👤' },
    { id: 3, name: 'User 3', hasResponded: true, avatar: '👤' },
    { id: 4, name: 'User 4', hasResponded: false, avatar: '👤' },
    { id: 5, name: 'User 5', hasResponded: true, avatar: '👤' },
  ];

  const streakCount = 3;
  const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.streakText}>Day {streakCount} Together</Text>
        <Timer endTime={endTime} />
      </View>

      <View style={styles.membersContainer}>
        <Text style={styles.sectionTitle}>Your Group</Text>
        <View style={styles.membersGrid}>
          {groupMembers.map((member) => (
            <GroupMember
              key={member.id}
              name={member.name}
              hasResponded={member.hasResponded}
              avatar={member.avatar}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  streakText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  membersContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
}); 