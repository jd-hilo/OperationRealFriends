import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { theme } from '../constants/theme';
import { CheckCircle2, Clock, X, Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

interface Member {
  id: string;
  avatar_url?: string;
  preferred_name?: string;
  email?: string;
  bio?: string;
  submitted?: boolean;
}

interface MemberStatusBarProps {
  members: Member[];
  userId: string;
  nextCheckIn: string;
  groupId: string;
}

const MemberStatusBar: React.FC<MemberStatusBarProps> = ({
  members,
  userId,
  nextCheckIn,
  groupId,
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [leaving, setLeaving] = useState(false);

  const checkedInCount = members.filter(m => m.submitted).length;
  const totalCount = members.length;

  const handleLeaveGroup = () => {
    if (!selectedMember) return;
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeaving(true);
              await supabase
                .from('group_members')
                .delete()
                .eq('user_id', userId)
                .eq('group_id', groupId);
              await supabase.from('users').update({ current_group_id: null }).eq('id', userId);
              setSelectedMember(null);
              router.replace('/(tabs)/home');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.avatarsRow}>
          {members.map((member, idx) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberCol}
              onPress={() => setSelectedMember(member)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: member.avatar_url || `https://i.pravatar.cc/150?img=${idx + 1}` }}
                style={styles.avatar}
              />
              <View style={
                [styles.statusBadge,
                  member.submitted
                    ? styles.statusDone
                    : styles.statusPending
                ]
              }>
                {member.submitted ? (
                  <CheckCircle2 size={12} color="#287D00" style={{ marginRight: 2 }} />
                ) : (
                  <Clock size={12} color="rgba(0,0,0,0.7)" style={{ marginRight: 2 }} />
                )}
                <Text style={
                  [styles.statusText,
                    member.submitted
                      ? styles.statusTextDone
                      : styles.statusTextPending
                  ]
                }>
                  {member.submitted ? 'Done' : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>{checkedInCount}/{totalCount} checked in</Text>
          </View>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>Submit by: {nextCheckIn}</Text>
          </View>
        </View>
      </View>
      {/* User Info Modal */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedMember(null)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedMember(null)}>
              <X size={28} color="#222" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedMember?.avatar_url || 'https://i.pravatar.cc/150?img=1' }}
              style={styles.modalAvatar}
            />
            <Text style={styles.modalName}>{selectedMember?.preferred_name || 'Anonymous'}</Text>
            {selectedMember?.bio && (
              <Text style={styles.modalBio}>{selectedMember.bio}</Text>
            )}
            {selectedMember && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeaveGroup}
                disabled={leaving}
              >
                {leaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Users size={18} color="#fff" />
                    <Text style={styles.leaveButtonText}>Block User ⚠️</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 77,
    height: 130,
    backgroundColor: '#FFF',
    borderTopWidth: 4,
    borderTopColor: 'rgba(58, 185, 249, 0.11)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    width: 355,
    height: 115,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 355,
    height: 71,
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  memberCol: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 71,
    height: 71,
    gap: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DEDEDE',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1,
    height: 24,
    borderRadius: 44,
    backgroundColor: 'rgba(40, 125, 0, 0.03)',
    marginTop: 2,
    gap: 1,
  },
  statusDone: {
    backgroundColor: 'rgba(40, 125, 0, 0.03)',
  },
  statusPending: {
    backgroundColor: '#FAFAFA',
  },
  statusText: {
    fontFamily: 'Open Sans',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  statusTextDone: {
    color: '#287D00',
  },
  statusTextPending: {
    color: 'rgba(0,0,0,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 355,
    height: 48,
    marginTop: 6,
    gap: 2,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 44,
    backgroundColor: 'rgba(58, 185, 249, 0.06)',
    marginHorizontal: 2,
    minWidth: 120,
    justifyContent: 'center',
  },
  statsText: {
    fontFamily: 'Open Sans',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    color: '#000',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#E0E7FF',
  },
  modalName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalBio: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    maxWidth: 240,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#FFB800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 32,
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default MemberStatusBar; 