import React from 'react';
import { View, StyleSheet } from 'react-native';
import { User, CheckCircle } from 'lucide-react-native';
import { theme } from '../constants/theme';

interface MemberIconProps {
  active: boolean;
  submitted?: boolean;
}

const MemberIcon: React.FC<MemberIconProps> = ({ active, submitted = false }) => {
  if (!active) {
    return (
      <View style={[styles.container, styles.inactiveContainer]}>
        <User size={24} color={theme.colors.text.tertiary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View 
        style={[
          styles.container, 
          submitted ? styles.submittedContainer : styles.activeContainer
        ]}
      >
        <User 
          size={24} 
          color={submitted ? '#FFFFFF' : theme.colors.text.primary} 
        />
      </View>
      {submitted && (
        <View style={styles.checkmarkContainer}>
          <CheckCircle size={16} color={theme.colors.success} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeContainer: {
    backgroundColor: theme.colors.surface,
  },
  submittedContainer: {
    backgroundColor: theme.colors.primary,
  },
  inactiveContainer: {
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
});

export default MemberIcon;