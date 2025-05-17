import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { theme } from '../constants/theme';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  min?: number;
  max?: number;
  step?: number;
}

const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minLabel = "Low",
  maxLabel = "High",
  min = 1,
  max = 10,
  step = 1,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const translateX = useSharedValue(0);
  
  const calculateValueFromPosition = (position: number) => {
    if (sliderWidth === 0) return min;
    
    const ratio = position / sliderWidth;
    const rawValue = min + ratio * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    
    return Math.max(min, Math.min(max, steppedValue));
  };
  
  const calculatePositionFromValue = (val: number) => {
    if (sliderWidth === 0) return 0;
    
    const ratio = (val - min) / (max - min);
    return ratio * sliderWidth;
  };
  
  useEffect(() => {
    // Update position if value changes externally
    if (sliderWidth > 0) {
      translateX.value = withTiming(calculatePositionFromValue(value));
    }
  }, [value, sliderWidth]);
  
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      const newX = ctx.startX + event.translationX;
      const boundedX = Math.max(0, Math.min(newX, sliderWidth));
      translateX.value = boundedX;
      
      runOnJS(onValueChange)(calculateValueFromPosition(boundedX));
    },
  });
  
  const handleContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
    
    // Initial position
    translateX.value = calculatePositionFromValue(value);
  };
  
  const handleTrackPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const boundedX = Math.max(0, Math.min(locationX, sliderWidth));
    
    translateX.value = withTiming(boundedX);
    onValueChange(calculateValueFromPosition(boundedX));
  };
  
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
  const activeTrackStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value,
    };
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{minLabel}</Text>
        <Text style={styles.labelText}>{maxLabel}</Text>
      </View>
      
      <View
        style={styles.sliderContainer}
        onLayout={handleContainerLayout}
      >
        <Pressable 
          style={styles.track} 
          onPress={handleTrackPress}
        >
          <Animated.View style={[styles.activeTrack, activeTrackStyle]} />
        </Pressable>
        
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </PanGestureHandler>
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  labelText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  sliderContainer: {
    height: 40,
    position: 'relative',
    justifyContent: 'center',
  },
  track: {
    height: 6,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
  },
  activeTrack: {
    height: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    top: -11,
    left: -14,
    ...theme.shadow.md,
  },
  valueContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  valueText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
});

export default Slider;