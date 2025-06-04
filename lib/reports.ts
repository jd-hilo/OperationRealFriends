import { supabase } from './supabase';

export interface Report {
  id: string;
  reporter_id: string;
  reported_message_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  updated_at: string;
}

export async function reportMessage(
  messageId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Report failed: No authenticated user found');
      return { success: false, error: 'User not authenticated' };
    }

    if (!messageId) {
      console.error('Report failed: No message ID provided');
      return { success: false, error: 'Message ID is required' };
    }

    // First verify the message exists
    const { data: message, error: messageCheckError } = await supabase
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .single();

    if (messageCheckError || !message) {
      console.error('Report failed: Message not found', { messageId, error: messageCheckError });
      return { success: false, error: 'Message not found' };
    }

    // Create the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert([
        {
          reporter_id: user.id,
          reported_message_id: messageId,
          reason,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (reportError) {
      console.error('Report failed: Error creating report', { 
        messageId, 
        userId: user.id, 
        error: reportError 
      });
      return { success: false, error: reportError.message };
    }

    // Update the message's reported status
    const { error: messageUpdateError } = await supabase
      .from('messages')
      .update({ reported: true })
      .eq('id', messageId);

    if (messageUpdateError) {
      console.error('Report failed: Error updating message status', { 
        messageId, 
        error: messageUpdateError 
      });
      // Try to rollback the report creation
      await supabase
        .from('reports')
        .delete()
        .eq('id', report.id);
      return { success: false, error: messageUpdateError.message };
    }

    console.log('Report created successfully', { 
      reportId: report.id, 
      messageId, 
      userId: user.id 
    });
    return { success: true };
  } catch (error) {
    console.error('Report failed: Unexpected error', { 
      messageId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function getUserReports(): Promise<{ 
  reports: Report[] | null; 
  error?: string 
}> {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return { reports: null, error: error.message };
    }

    return { reports };
  } catch (error) {
    console.error('Error in getUserReports:', error);
    return { 
      reports: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
} 