import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PromptCardProps {
  promptType: 'text' | 'photo';
  date: string; // e.g. '09 May'
  prompt: string;
  timeLeft: string; // e.g. '02:34'
  onRespond: () => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ promptType, date, prompt, timeLeft, onRespond }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftTop}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{date.split(' ')[0]}</Text>
            <Text style={styles.dateMonth}>{date.split(' ')[1]}</Text>
            <LinearGradient
              colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dateUnderline}
            />
          </View>
        </View>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{timeLeft}</Text>
          <Text style={styles.timerLabel}>Hours</Text>
        </View>
      </View>
      <View style={styles.promptSection}>
        <Text style={styles.promptLabel}>Today's prompt</Text>
        <Text style={styles.promptText}>{prompt}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onRespond} activeOpacity={0.85}>
        <LinearGradient
          colors={["#3AB9F9", "#4B1AFF", "#006FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Respond now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 350,
    minHeight: 233,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  leftTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginRight: 8,
    position: 'relative',
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    backgroundColor: '#FFF',
    marginRight: 0,
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timerText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#222',
    marginTop: 2,
  },
  timerLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: -2,
  },
  promptSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 16,
    width: '100%',
  },
  promptLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  promptText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    height: 62,
    borderRadius: 51,
    borderWidth: 4,
    borderColor: '#FFF',
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 25.1,
    elevation: 6,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 20,
  },
  dateDay: {
    fontWeight: '700',
    fontSize: 20,
    color: '#222',
    lineHeight: 22,
  },
  dateMonth: {
    fontWeight: '600',
    fontSize: 14,
    color: '#6366F1',
    lineHeight: 16,
  },
  dateUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
});

export default PromptCard; 