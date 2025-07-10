import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Edit, Settings, LogOut, User, Mail, MapPin, ArrowRight, Camera, Users } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [nameText, setNameText] = useState(user?.preferred_name || '');
  const [locationText, setLocationText] = useState(user?.location || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Local state for immediate UI updates
  const [localUserData, setLocalUserData] = useState({
    bio: user?.bio || '',
    preferred_name: user?.preferred_name || '',
    location: user?.location || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
  });

  // Update local state when user context changes
  React.useEffect(() => {
    if (user) {
      setLocalUserData({
        bio: user.bio || '',
        preferred_name: user.preferred_name || '',
        location: user.location || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
      });
      setBioText(user.bio || '');
      setNameText(user.preferred_name || '');
      setLocationText(user.location || '');
    }
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/signup');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const updateUserField = async (field: string, value: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state immediately for instant UI refresh
      setLocalUserData(prev => ({
        ...prev,
        [field]: value
      }));

      Alert.alert('Success', `${field.replace('_', ' ')} updated successfully!`);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditBio = () => {
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    await updateUserField('bio', bioText);
    setIsEditingBio(false);
  };

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    await updateUserField('preferred_name', nameText);
    setIsEditingName(false);
  };

  const handleEditLocation = () => {
    setIsEditingLocation(true);
  };

  const handleSaveLocation = async () => {
    await updateUserField('location', locationText);
    setIsEditingLocation(false);
  };

  const handleEditProfilePicture = async () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Photo Library', onPress: () => pickImage('library') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Check current permission status
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        let result;
        if (source === 'camera') {
          const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
          if (cameraStatus === 'granted') {
            result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
          } else {
            const { status: requestCameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (requestCameraStatus === 'granted') {
              result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });
            } else {
              Alert.alert('Permission denied', 'Please enable camera access in your device settings to take a profile picture.');
              return;
            }
          }
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
        }
        if (!result.canceled && result.assets[0]) {
          Alert.alert('Success', 'Profile picture updated! (Feature coming soon)');
        }
        return;
      }
      // Not granted, request permission (shows system modal)
      const { status: requestStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (requestStatus === 'granted') {
      let result;
      if (source === 'camera') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
          if (cameraStatus === 'granted') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
          } else {
            Alert.alert('Permission denied', 'Please enable camera access in your device settings to take a profile picture.');
            return;
          }
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }
      if (!result.canceled && result.assets[0]) {
        Alert.alert('Success', 'Profile picture updated! (Feature coming soon)');
        }
      } else {
        Alert.alert('Permission denied', 'Please enable photo access in your device settings to change your profile picture.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture.');
    }
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile page
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page
    Alert.alert('Settings', 'Settings page coming soon!');
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;
              
              // Delete user data from Supabase
              const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id);

              if (deleteError) throw deleteError;

              // Delete the user's auth account
              const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
              if (authError) throw authError;

              // Sign out and redirect to welcome screen
              await signOut();
              router.replace('/welcome');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = async () => {
    if (!user?.current_group_id) return;

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Group',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove user from group_members
              const { error: deleteError } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', user.current_group_id)
                .eq('user_id', user.id);

              if (deleteError) throw deleteError;

              // Update user's current_group_id to null
              const { error: updateError } = await supabase
                .from('users')
                .update({ current_group_id: null })
                .eq('id', user.id);

              if (updateError) throw updateError;

              // Navigate to home screen
              router.replace('/(tabs)/home');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#E9F2FE", "#EDE7FF", "#FFFFFF"]}
      locations={[0, 0.4808, 0.9904]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={localUserData.avatar_url ? { uri: localUserData.avatar_url } : { uri: 'https://i.pravatar.cc/150?img=1' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfilePicture}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {localUserData.preferred_name || localUserData.email?.split('@')[0] || 'Anonymous'}
          </Text>
          <Text style={styles.userEmail}>{localUserData.email}</Text>
          <Text style={styles.userBio}>
            {localUserData.bio || 'Add a bio to tell others about yourself'}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <User size={20} color="#3AB9F9" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Display Name</Text>
              <Text style={styles.infoValue}>
                {localUserData.preferred_name || 'Not set'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleEditName}>
              <Edit size={16} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Mail size={20} color="#3AB9F9" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{localUserData.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <User size={20} color="#3AB9F9" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>
                {localUserData.bio || 'Not set'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleEditBio}>
              <Edit size={16} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <MapPin size={20} color="#3AB9F9" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {localUserData.location || 'Not set'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleEditLocation}>
              <Edit size={16} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionItem} onPress={handleSettings}>
            <Settings size={20} color="#3AB9F9" />
            <Text style={styles.actionText}>Settings</Text>
            <ArrowRight size={16} color="#999" />
          </TouchableOpacity>

          {user?.current_group_id && (
            <TouchableOpacity style={[styles.actionItem, styles.leaveGroupItem]} onPress={handleLeaveGroup}>
              <Users size={20} color="#FFB800" />
              <Text style={[styles.actionText, styles.leaveGroupText]}>Leave Group ⚠️</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionItem, styles.signOutItem]} onPress={handleSignOut}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, styles.deleteAccountItem]} 
            onPress={handleDeleteAccount}
          >
            <LogOut size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.deleteAccountText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Bio Modal */}
      <Modal visible={isEditingBio} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Bio</Text>
            <TextInput
              style={styles.textInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Tell others about yourself..."
              multiline
              maxLength={150}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            <Text style={styles.characterCount}>{bioText.length}/150</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setBioText(localUserData.bio || '');
                  setIsEditingBio(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveBio}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal visible={isEditingName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <TextInput
              style={[styles.textInput, styles.singleLineInput]}
              value={nameText}
              onChangeText={setNameText}
              placeholder="Enter your display name..."
              maxLength={50}
              placeholderTextColor="#999"
            />
            <Text style={styles.characterCount}>{nameText.length}/50</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNameText(localUserData.preferred_name || '');
                  setIsEditingName(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveName}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Location Modal */}
      <Modal visible={isEditingLocation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Location</Text>
            <TextInput
              style={[styles.textInput, styles.singleLineInput]}
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Enter your postal code or city..."
              maxLength={20}
              placeholderTextColor="#999"
            />
            <Text style={styles.characterCount}>{locationText.length}/20</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setLocationText(localUserData.location || '');
                  setIsEditingLocation(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveLocation}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  userBio: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    maxWidth: 280,
  },
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoText: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  actionsCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: '#FF3B30',
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deleteAccountText: {
    color: '#FF3B30',
  },
  leaveGroupItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leaveGroupText: {
    color: '#FFB800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FAFAFA',
    padding: 30,
    borderRadius: 32,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: 120,
    borderColor: '#E5E7EB',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  singleLineInput: {
    height: 50,
    textAlignVertical: 'center',
  },
  characterCount: {
    alignSelf: 'flex-end',
    color: '#666',
    fontSize: 14,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    padding: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
}); 