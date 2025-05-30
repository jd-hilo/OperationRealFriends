// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendExpoPushNotification(token: string, title: string, body: string, data: any) {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  return response.json();
}

async function handleNotification(user_id: string, new_group_id: string) {
  console.log('Handling notification for user:', user_id, 'group:', new_group_id);
  
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
        headers: { Authorization: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! },
        },
      }
    )

  try {
    // Get user's push token
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('push_token')
      .eq('id', user_id)
      .single()

    if (userError) {
      console.error('Error getting user data:', userError);
      throw userError;
    }

    console.log('User data:', userData);

    if (userData?.push_token) {
      // Send push notification via Expo
      const pushResponse = await sendExpoPushNotification(
        userData.push_token,
        'New Group Assignment',
        'You have been assigned to a new group!',
        { group_id: new_group_id }
      );
      
      console.log('Push notification response:', pushResponse);

      // Create notification record
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id,
          title: 'New Group Assignment',
          body: 'You have been assigned to a new group!',
          data: { group_id: new_group_id },
          push_token: userData.push_token
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        throw notificationError;
    }
      
      console.log('Notification created successfully');
    } else {
      console.log('No push token found for user');
    }
  } catch (error) {
    console.error('Error in handleNotification:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received request:', req.method);
    
    const { user_id, new_group_id } = await req.json()
    console.log('Request body:', { user_id, new_group_id });

    if (!user_id || !new_group_id) {
      throw new Error('Missing required fields')
    }

    await handleNotification(user_id, new_group_id)

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in request handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/handle-group-join' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
