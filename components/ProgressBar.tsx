import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withTiming(progress, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedWidth.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.progress, progressStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: theme.spacing.md,
    width: '100%',
  },
  progress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
});

export default ProgressBar;