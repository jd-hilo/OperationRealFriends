import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GroupDetailsCardProps {
  streakMilestone: string;
  promptsSeen: string;
  messagesExchanged: string;
  continents: string;
}

const facts = [
  { icon: '🔥', label: 'Streak Milestone', valueKey: 'streakMilestone' },
  { icon: '📝', label: 'Prompts Seen', valueKey: 'promptsSeen' },
  { icon: '💬', label: 'Messages Exchanged', valueKey: 'messagesExchanged' },
  { icon: '🌍', label: 'Continents', valueKey: 'continents' },
];

const GroupDetailsCard: React.FC<GroupDetailsCardProps> = ({ streakMilestone, promptsSeen, messagesExchanged, continents }) => {
  const values = { streakMilestone, promptsSeen, messagesExchanged, continents };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crew highlights</Text>
      <Text style={styles.subtitle}>A little something about your crew... because your group is kinda iconic😉😏</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.factBox}>
            <Text style={styles.emoji}>🔥</Text>
            <Text style={styles.factText} numberOfLines={2} ellipsizeMode="tail">{streakMilestone}</Text>
          </View>
          <View style={styles.factBox}>
            <Text style={styles.emoji}>📝</Text>
            <Text style={styles.factText} numberOfLines={2} ellipsizeMode="tail">{promptsSeen}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.factBox}>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.factText} numberOfLines={2} ellipsizeMode="tail">{messagesExchanged}</Text>
          </View>
          <View style={styles.factBox}>
            <Text style={styles.emoji}>🌍</Text>
            <Text style={styles.factText} numberOfLines={2} ellipsizeMode="tail">{continents}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 6,
    gap: 24,
    width: 350,
    height: 390,
    backgroundColor: '#FAFAFA',
    borderRadius: 44,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
    color: '#111',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  grid: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    width: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  factBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 150,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  factText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    maxWidth: 150,
  },
});

export default GroupDetailsCard; 