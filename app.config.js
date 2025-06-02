import 'dotenv/config';

export default {
  expo: {
    name: 'Pact',
    slug: 'pact',
    owner: 'jd-hilo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'org.name.OperationRealSocial',
      buildNumber: '11',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      eas: {
        projectId: "4b91b1f8-9eef-48ad-b6ba-609ba25651f4"
      }
    }
  }
}; 