import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Smile, Clock, PenLine, Award } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import MemberIcon from '../../components/MemberIcon';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';
import { Group, Prompt, Submission } from '../../types';

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
              <MemberIcon 
                key={i} 
                active={i < memberCount}
                submitted={i < submissionCount}
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
});