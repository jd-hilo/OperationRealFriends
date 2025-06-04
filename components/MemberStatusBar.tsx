import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../constants/theme';
import { CheckCircle2, Clock } from 'lucide-react-native';

interface Member {
  id: string;
  avatar_url?: string;
  preferred_name?: string;
  email?: string;
  submitted?: boolean;
}

interface MemberStatusBarProps {
  members: Member[];
  userId: string;
  nextCheckIn: string;
}

const MemberStatusBar: React.FC<MemberStatusBarProps> = ({
  members,
  userId,
  nextCheckIn,
}) => {
  const checkedInCount = members.filter(m => m.submitted).length;
  const totalCount = members.length;

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.avatarsRow}>
          {members.map((member, idx) => (
            <View key={member.id} style={styles.memberCol}>
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
                  <CheckCircle2 size={14} color="#287D00" style={{ marginRight: 4 }} />
                ) : (
                  <Clock size={14} color="rgba(0,0,0,0.7)" style={{ marginRight: 4 }} />
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
            </View>
          ))}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>{checkedInCount}/{totalCount} checked in</Text>
          </View>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>Submit By: {nextCheckIn}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 77,
    height: 120,
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
    height: 105,
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
    paddingHorizontal: 3,
    height: 27,
    borderRadius: 44,
    backgroundColor: 'rgba(40, 125, 0, 0.03)',
    marginTop: 2,
    gap: 4,
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
    fontSize: 11,
    lineHeight: 15,
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
    alignItems: 'flex-start',
    width: 355,
    height: 28,
    marginTop: 6,
    gap: 2,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
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
    lineHeight: 16,
    textAlign: 'center',
    color: '#000',
    marginLeft: 4,
  },
});

export default MemberStatusBar; 