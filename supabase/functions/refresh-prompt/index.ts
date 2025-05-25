// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface Prompt {
  content: string;
  type: string;
}

interface Group {
  id: string;
  current_prompt_id: string;
  prompts: {
    id: string;
    content: string;
    prompt_type: string;
  };
}

const generatePrompt = async (supabase: SupabaseClient): Promise<Prompt> => {
  // For now, return a simple prompt. You can integrate with OpenAI here later
  return {
    content: "What's one thing you're grateful for today?",
    type: 'text'
  }
}

serve(async (req: Request) => {
  console.log('Received request:', req.method);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Get the group ID from the request
    const body = await req.json();
    console.log('Request body:', body);
    
    const { groupId } = body;
    if (!groupId) {
      console.error('Missing groupId in request');
      return new Response(
        JSON.stringify({ error: 'Group ID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Processing request for group:', groupId);

    // Generate new prompt
    const { content: promptText, type: promptType } = await generatePrompt(supabaseClient);
    console.log('Generated prompt:', { content: promptText, type: promptType });

    // Start a transaction
    const { data: prompt, error: promptError } = await supabaseClient
      .from('prompts')
      .insert([
        {
          content: promptText,
          group_id: groupId,
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          prompt_type: promptType
        }
      ])
      .select()
      .single();

    if (promptError) {
      console.error('Error creating prompt:', promptError);
      return new Response(
        JSON.stringify({ error: 'Failed to create prompt', details: promptError }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Created prompt:', prompt);

    // Update the group
    const { data: updatedGroup, error: updateError } = await supabaseClient
      .from('groups')
      .update({
        current_prompt_id: prompt.id,
        next_prompt_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', groupId)
      .select(`
        *,
        prompts!current_prompt_id(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating group:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update group', details: updateError }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Updated group:', updatedGroup);

    return new Response(
      JSON.stringify({ success: true, data: updatedGroup }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 