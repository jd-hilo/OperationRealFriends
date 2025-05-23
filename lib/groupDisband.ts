import { supabase } from './supabase';
import { addDays, isAfter } from 'date-fns';

interface Group {
  id: string;
  created_at: string;
  member_ids: string[];
  streak_count: number;
  status: 'active' | 'disbanded';
}

export async function checkGroupDisband(groupId: string): Promise<boolean> {
  try {
    // Get group data
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;
    if (!group) return false;

    const groupData = group as Group;
    const groupCreatedAt = new Date(groupData.created_at);
    const twentyFourHoursAgo = addDays(new Date(), -1);

    // Check if group is older than 24 hours
    if (isAfter(twentyFourHoursAgo, groupCreatedAt)) {
      // Get all submissions for the group
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('group_id', groupId);

      if (submissionsError) throw submissionsError;

      // Check if all members have submitted
      const allMembersSubmitted = groupData.member_ids.every(memberId =>
        submissions?.some(sub => sub.user_id === memberId)
      );

      if (allMembersSubmitted) {
        // Increment streak count
        const { error: updateError } = await supabase
          .from('groups')
          .update({
            streak_count: groupData.streak_count + 1,
            status: 'active'
          })
          .eq('id', groupId);

        if (updateError) throw updateError;
        return false;
      } else {
        // Disband the group
        const { error: disbandError } = await supabase
          .from('groups')
          .update({
            status: 'disbanded'
          })
          .eq('id', groupId);

        if (disbandError) throw disbandError;

        // Update user statuses and add them back to queue
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            current_group_id: null,
            status: 'available'
          })
          .in('id', groupData.member_ids);

        if (userUpdateError) throw userUpdateError;

        // Add users back to queue
        const queueEntries = groupData.member_ids.map(userId => ({
          user_id: userId,
          created_at: new Date().toISOString()
        }));

        const { error: queueError } = await supabase
          .from('queue')
          .insert(queueEntries);

        if (queueError) throw queueError;

        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking group disband:', error);
    return false;
  }
}

export async function scheduleGroupDisbandCheck(groupId: string): Promise<() => void> {
  // Check immediately
  await checkGroupDisband(groupId);

  // Set up interval to check every hour
  const intervalId = setInterval(async () => {
    const isDisbanded = await checkGroupDisband(groupId);
    if (isDisbanded) {
      clearInterval(intervalId);
    }
  }, 60 * 60 * 1000); // Check every hour

  // Return cleanup function
  return () => clearInterval(intervalId);
} 