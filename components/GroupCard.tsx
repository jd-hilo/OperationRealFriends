import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { theme } from '../constants/theme';

interface Member {
  id: string;
  avatar_url?: string;
  preferred_name?: string;
}

interface GroupCardProps {
  name: string;
  subdescription: string;
  members: Member[];
  promptCount: number;
  mapComponent: React.ReactNode;
}

const GroupCard: React.FC<GroupCardProps> = ({
  name,
  subdescription,
  members,
  promptCount,
  mapComponent,
}) => {
  const previewMembers = members.slice(0, 2);
  const extraCount = members.length - 2;

  return (
    <View style={styles.container}>
      {/* Top row: name, subdesc, avatars */}
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <Text style={styles.groupName}>{name}</Text>
          <Text style={styles.groupSubdesc}>{subdescription}</Text>
        </View>
        <View style={styles.avatarPreviewRow}>
          {previewMembers.map((m, i) => (
            <Image
              key={m.id}
              source={m.avatar_url ? { uri: m.avatar_url } : { uri: 'https://i.pravatar.cc/150?img=1' }}
              style={[styles.avatar, { marginLeft: i === 0 ? 0 : -12 }]}
            />
          ))}
          {extraCount > 0 && (
            <View style={styles.extraBadge}>
              <Text style={styles.extraBadgeText}>+{extraCount}</Text>
            </View>
          )}
        </View>
      </View>
      {/* Map with member avatars */}
      <View style={styles.mapContainer}>{mapComponent}</View>
      {/* Prompt count badge */}
      <View style={styles.promptBadgeRow}>
        <View style={styles.promptBadge}>
          <Text style={styles.promptBadgeText}>{promptCount} prompts ✅</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 350,
    height: 269,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  nameSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: 200,
    height: 'auto',
  },
  groupName: {
    fontFamily: 'Open Sans',
    fontWeight: '700',
    fontSize: 16,
    color: '#010101',
    marginBottom: 2,
  },
  groupSubdesc: {
    fontFamily: 'Open Sans',
    fontWeight: '400',
    fontSize: 14,
    color: '#444',
    marginTop: 0,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginTop: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  extraBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: -8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  mapContainer: {
    width: '100%',
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  promptBadgeRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 0,
    marginBottom: 0,
  },
  promptBadge: {
    backgroundColor: '#F2F6FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  promptBadgeText: {
    color: '#1A7F37',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default GroupCard; 