import { supabase } from './supabase';
import { startOfDay, isAfter, isBefore } from 'date-fns';

export async function updateGroupStreak(groupId: string): Promise<void> {
  try {
    // Get group data
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;
    if (!group) return;

    const today = startOfDay(new Date());
    const lastUpdate = group.last_streak_update ? startOfDay(new Date(group.last_streak_update)) : null;

    // If no last update or last update was before today
    if (!lastUpdate || isBefore(lastUpdate, today)) {
      // Update streak count and last update time
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          streak_count: group.streak_count + 1,
          last_streak_update: today.toISOString()
        })
        .eq('id', groupId);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error updating group streak:', error);
  }
} 