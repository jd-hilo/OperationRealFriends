// import { supabase } from './supabase';
// import OpenAI from 'openai';
// import { config } from './config';

// const openai = new OpenAI({
//   apiKey: config.openai.apiKey,
//   dangerouslyAllowBrowser: true // Required for Expo/React Native
// });

// type PromptType = 'text' | 'audio' | 'photo';

// const PROMPT_TYPES: PromptType[] = ['text', 'audio', 'photo'];

// function getRandomPromptType(): PromptType {
//   return PROMPT_TYPES[Math.floor(Math.random() * PROMPT_TYPES.length)];
// }

// export async function generatePrompt(): Promise<{ content: string; type: PromptType }> {
//   try {
//     const promptType = getRandomPromptType();
//     let systemPrompt = "You are a thoughtful prompt generator for a social app. Generate a daily reflection prompt that encourages meaningful sharing and connection. The prompt should be engaging, open-ended, and suitable for a group setting. Keep it under 100 words.";

//     // Add type-specific instructions
//     switch (promptType) {
//       case 'audio':
//         systemPrompt += " The prompt should encourage users to share a voice message or audio clip.";
//         break;
//       case 'photo':
//         systemPrompt += " The prompt should encourage users to share a photo or image.";
//         break;
//       case 'text':
//         systemPrompt += " The prompt should encourage users to share their thoughts in writing.";
//         break;
//     }

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: systemPrompt
//         },
//         {
//           role: "user",
//           content: "Generate a daily reflection prompt."
//         }
//       ],
//       max_tokens: 100,
//     });

//     return {
//       content: completion.choices[0].message.content || "What's on your mind today?",
//       type: promptType
//     };
//   } catch (error) {
//     console.error('Error generating prompt:', error);
//     return {
//       content: "What's on your mind today?",
//       type: 'text'
//     };
//   }
// }

// export async function updateGroupPrompt(groupId: string): Promise<void> {
//   try {
//     // Generate new prompt
//     const { content: promptText, type: promptType } = await generatePrompt();

//     // Create new prompt in prompts table
//     const { data: prompt, error: promptError } = await supabase
//       .from('prompts')
//       .insert([
//         {
//           content: promptText,
//           created_at: new Date().toISOString(),
//           due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
//           prompt_type: promptType
//         }
//       ])
//       .select()
//       .single();

//     if (promptError) throw promptError;

//     // Create entry in group_prompts junction table
//     const { error: junctionError } = await supabase
//       .from('group_prompts')
//       .insert([
//         {
//           group_id: groupId,
//           prompt_id: prompt.id,
//           due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
//           is_active: true
//         }
//       ]);

//     if (junctionError) throw junctionError;

//     // Update group with new prompt
//     const { error: groupError } = await supabase
//       .from('groups')
//       .update({
//         current_prompt_id: prompt.id,
//         next_prompt_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
//       })
//       .eq('id', groupId);

//     if (groupError) throw groupError;

//     console.log('Successfully updated group prompt:', groupId);
//   } catch (error) {
//     console.error('Error updating group prompt:', error);
//     throw error;
//   }
// }

// export async function refreshPromptForTestGroup(): Promise<void> {
//   try {
//     // Just generate a new prompt
//     const { content, type } = await generatePrompt();
//     console.log('Generated new prompt:', { content, type });
//   } catch (error) {
//     console.error('Error generating prompt:', error);
//     throw error;
//   }
// } 