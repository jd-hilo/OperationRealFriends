export const theme = {
  colors: {
    primary: '#6366F1', // Indigo
    secondary: '#F472B6', // Pink
    accent: '#A78BFA', // Purple
    success: '#34D399', // Emerald
    warning: '#FBBF24', // Amber
    error: '#F87171', // Red
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: {
      primary: '#111827', // Gray-900
      secondary: '#4B5563', // Gray-600
      tertiary: '#9CA3AF', // Gray-400
    },
    border: '#E5E7EB', // Gray-200
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    circle: 9999,
  },
  typography: {
    fontFamily: {
      bodyRegular: 'Nunito-Regular',
      bodySemiBold: 'Nunito-SemiBold',
      headingRegular: 'Poppins-Regular',
      headingSemiBold: 'Poppins-SemiBold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};