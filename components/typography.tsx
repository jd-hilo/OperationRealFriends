import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { ReactNode } from 'react';
import React from 'react';

type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'body' 
  | 'bodyBold'
  | 'bodySmall'
  | 'caption'
  | 'button';

interface TypographyProps extends TextProps {
  variant: TypographyVariant;
  children: ReactNode;
  color?: string;
  style?: TextStyle | TextStyle[];
}

export function Typography({ 
  variant, 
  children, 
  color, 
  style, 
  ...props 
}: TypographyProps) {
  return (
    <Text 
      style={[
        styles[variant], 
        color ? { color } : null, 
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  }
});