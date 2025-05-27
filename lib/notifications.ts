import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    console.log('Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      console.log('Permission request result:', status);
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission not granted, showing settings alert');
      Alert.alert(
        'Enable Notifications',
        'To receive important updates, please enable notifications in your device settings.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              console.log('Opening settings...');
              if (Platform.OS === 'ios') {
                await Linking.openURL('app-settings:');
              } else {
                await Linking.openSettings();
              }
            },
          },
        ]
      );
      return null;
    }
    
    try {
      console.log('Getting push token...');
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '4b91b1f8-9eef-48ad-b6ba-609ba25651f4',
      })).data;
      console.log('Successfully got push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Save the push token to Supabase
export async function savePushToken(userId: string, token: string) {
  console.log('Saving push token for user:', userId);
  const { error } = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
  console.log('Successfully saved push token');
}

// Send a test notification
export async function sendTestNotification(token: string) {
  const message = {
    to: token,
    sound: 'default',
    title: 'Test Notification',
    body: 'This is a test notification!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

export async function sendGroupAssignmentNotification(token: string, groupName: string) {
  const message = {
    to: token,
    sound: 'default',
    title: 'Time to Meet Your Group!',
    body: `You have been assigned to a group of friends accross the globe`,
    data: { groupName },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

export async function handleGroupAssignment(userId: string, groupId: string) {
  try {
    // Get the user's push token
    const { data: user } = await supabase.from('users').select('push_token').eq('id', userId).single();
    if (!user?.push_token) {
      console.log('User has no push token');
      return;
    }

    // Get the group name
    const { data: group } = await supabase.from('groups').select('name').eq('id', groupId).single();
    if (!group?.name) {
      console.log('Group not found');
      return;
    }

    // Send the notification
    await sendGroupAssignmentNotification(user.push_token, group.name);
    console.log('Group assignment notification sent successfully');
  } catch (error) {
    console.error('Error sending group assignment notification:', error);
  }
} 