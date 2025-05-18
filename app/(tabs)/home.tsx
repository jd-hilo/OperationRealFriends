import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Smile, Clock, PenLine, Award } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import MemberIcon from '../../components/MemberIcon';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { Group, Prompt, Submission } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LocationPinProps {
  x: number;
  y: number;
  delay: number;
}

const LocationPin: React.FC<LocationPinProps> = ({ x, y, delay }) => {
  const pulseAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={[styles.pinContainer, { left: x, top: y }]}>
      <Animated.View
        style={[
          styles.pinPulse,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <MaterialCommunityIcons name="map-marker" size={24} color={theme.colors.primary} />
    </View>
  );
};

const MemberAvatar: React.FC<{ submitted: boolean; index: number }> = ({ submitted, index }) => {
  // Sample profile pictures - in a real app, these would come from user data
  const profilePictures = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=4',
    'https://i.pravatar.cc/150?img=5',
  ];

  return (
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: profilePictures[index] }}
        style={styles.avatar}
      />
      {!submitted && (
        <View style={styles.avatarOverlay}>
          <View style={styles.overlayContent}>
            <Clock size={16} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );
};

export default function Dashboard() {
  const { userId, groupId } = useUserStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);
        
        // Fetch group data
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
        
        if (groupError) throw groupError;
        
        // Fetch today's prompt
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (promptError) throw promptError;
        
        // Fetch submissions for today's prompt from group members
        if (promptData && groupData) {
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('submissions')
            .select('*')
            .eq('prompt_id', promptData.id)
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });
          
          if (submissionsError) throw submissionsError;
          
          setGroup(groupData);
          setCurrentPrompt(promptData);
          setSubmissions(submissionsData || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [groupId]);

  const hasSubmitted = submissions.some(s => s.user_id === userId);
  const memberCount = group?.member_ids?.length || 0;
  const submissionCount = submissions.length;
  
  const nextCheckInTime = "12:00 PM tomorrow"; // For MVP, this is static

  // Updated user locations with more realistic coordinates
  const userLocations = [
    { id: 1, x: width * 0.25, y: 120, delay: 0, name: 'New York' },    // USA
    { id: 2, x: width * 0.48, y: 110, delay: 500, name: 'London' },    // UK
    { id: 3, x: width * 0.75, y: 130, delay: 1000, name: 'Tokyo' },    // Japan
    { id: 4, x: width * 0.35, y: 180, delay: 1500, name: 'Sydney' },   // Australia
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Crew</Text>
        
        <View style={styles.streakContainer}>
          <Award size={24} color={theme.colors.primary} />
          <Text style={styles.streakText}>
            {group?.streak_count || 0} day streak
          </Text>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          <View style={styles.membersContainer}>
            {Array(5).fill(0).map((_, i) => (
              <MemberAvatar 
                key={i} 
                submitted={i < submissionCount}
                index={i}
              />
            ))}
          </View>
          <Text style={styles.membersStats}>
            {submissionCount}/{memberCount} checked in today
          </Text>
        </View>
        
        <Card style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={styles.promptIconContainer}>
              <PenLine size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.promptTitle}>Today's Prompt</Text>
          </View>
          
          <Text style={styles.promptText}>
            {currentPrompt?.question_text || "Loading today's question..."}
          </Text>
          
          <TouchableOpacity 
            style={[
              styles.promptButton,
              hasSubmitted && styles.promptButtonDisabled
            ]}
            onPress={() => router.push('/prompt')}
            disabled={hasSubmitted}
          >
            <Text style={[
              styles.promptButtonText,
              hasSubmitted && styles.promptButtonTextDisabled
            ]}>
              {hasSubmitted ? 'Submitted' : 'Respond Now'}
            </Text>
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.nextCheckInCard}>
          <View style={styles.nextCheckInHeader}>
            <Clock size={20} color={theme.colors.text.primary} />
            <Text style={styles.nextCheckInTitle}>Next Check-in</Text>
          </View>
          <Text style={styles.nextCheckInTime}>{nextCheckInTime}</Text>
        </Card>

        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Global Community</Text>
          <View style={styles.mapContainer}>
            <Image
              source={{ uri: 'https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/512/world.png' }}
              style={styles.mapImage}
              resizeMode="contain"
            />
            {userLocations.map((location) => (
              <LocationPin
                key={location.id}
                x={location.x}
                y={location.y}
                delay={location.delay}
              />
            ))}
            <View style={styles.mapOverlay}>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText}>Active Users</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Time Zones</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.text.primary,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  streakText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  membersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  membersStats: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  promptCard: {
    marginBottom: theme.spacing.lg,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  promptIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  promptTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  promptText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  promptButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  promptButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
  promptButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: '#FFFFFF',
  },
  promptButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  nextCheckInCard: {
    marginBottom: theme.spacing.lg,
  },
  nextCheckInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  nextCheckInTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  nextCheckInTime: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  mapSection: {
    padding: theme.spacing.lg,
  },
  mapContainer: {
    height: 300,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
    tintColor: theme.colors.text.secondary,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: 4,
  },
  legendText: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});