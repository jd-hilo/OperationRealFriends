import { supabase } from './supabase';
import { generatePrompt, updateGroupPrompt } from './prompts';

export async function checkAndUpdatePrompts() {
  try {
    // Get all groups that need a new prompt
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, next_prompt_due')
      .lte('next_prompt_due', new Date().toISOString());

    if (groupsError) throw groupsError;

    // Update prompts for each group
    for (const group of groups || []) {
      try {
        await updateGroupPrompt(group.id);
        console.log(`Updated prompt for group ${group.id}`);
      } catch (error) {
        console.error(`Error updating prompt for group ${group.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking and updating prompts:', error);
  }
} 