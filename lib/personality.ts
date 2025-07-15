import { supabase } from './supabase';

const personalityTypes = [
  { 
    type: 'The Explorer', 
    icon: '🧭', 
    description: 'Curious and adventurous, always seeking new experiences and ideas.',
    depthExample: `Your responses reveal a natural inclination towards discovery and experimentation. You consistently show enthusiasm for venturing into unknown territories, whether in conversations, activities, or intellectual pursuits.

Your thought patterns demonstrate remarkable adaptability and openness to new perspectives. You tend to approach challenges as opportunities for learning, showing a genuine excitement for understanding different viewpoints and methodologies.

The way you process information indicates a strong drive for personal growth through experience. Your answers suggest you're most energized when pushing boundaries and challenging conventional wisdom, making you a true Explorer at heart.`
  },
  { type: 'The Connector', icon: '🤝', description: 'Warm and outgoing, thrives on building relationships and bringing people together.' },
  { type: 'The Organizer', icon: '📋', description: 'Detail-oriented and structured, excels at planning and keeping projects on track.' },
  { type: 'The Thinker', icon: '🤔', description: 'Reflective and analytical, enjoys deep conversations and solving complex problems.' },
  { type: 'The Achiever', icon: '🏆', description: 'Goal-driven and energetic, constantly setting and reaching new milestones.' },
  { type: 'The Supporter', icon: '🤗', description: 'Compassionate and dependable, offers encouragement and a listening ear.' },
  { type: 'The Visionary', icon: '🌟', description: 'Imaginative and future-focused, loves brainstorming big ideas and possibilities.' },
  { type: 'The Realist', icon: '⚖️', description: 'Practical and grounded, values clear plans and tangible results.' },
  { type: 'The Innovator', icon: '💡', description: 'Creative and bold, often comes up with unconventional solutions.' },
  { type: 'The Reflector', icon: '🪞', description: 'Thoughtful and observant, learns from experiences and helps others do the same.' },
  { type: 'The Strategist', icon: '♟️', description: 'Forward-thinking and methodical, excels at planning and decision-making.' },
  { type: 'The Motivator', icon: '🌠', description: 'Inspiring and energetic, brings out the best in others.' },
  { type: 'The Analyst', icon: '📊', description: 'Detail-focused and logical, excels at solving complex problems.' },
  { type: 'The Enthusiast', icon: '✨', description: 'Passionate and optimistic, brings energy and excitement to projects.' },
  { type: 'The Harmonizer', icon: '🎵', description: 'Balanced and diplomatic, creates harmony in groups and relationships.' }
];

export async function determinePersonalityType(userId: string): Promise<void> {
  try {
    // Get user's quiz answers
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('quiz_answers')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return;
    }

    if (!userData?.quiz_answers) {
      console.error('No quiz answers found for user');
      return;
    }

    const answers = userData.quiz_answers;

    // Simple scoring system (you can make this more sophisticated)
    let scores = {
      Explorer: 0,
      Connector: 0,
      Organizer: 0,
      Thinker: 0,
      Achiever: 0,
      Supporter: 0,
      Visionary: 0,
      Realist: 0,
      Innovator: 0,
      Reflector: 0,
      Strategist: 0,
      Motivator: 0,
      Analyst: 0,
      Enthusiast: 0,
      Harmonizer: 0,
    };

    // Score based on answers (simplified example)
    if (answers.question1 === 'Very like me') scores.Connector += 2;
    if (answers.question2 === 'Very like me') scores.Supporter += 2;
    if (answers.question3 === 'Very like me') scores.Organizer += 2;
    if (answers.question4 === 'Very like me') scores.Realist += 2;
    if (answers.question5 === 'Very like me') scores.Explorer += 2;

    // Add more scoring logic based on other answers...

    // Find the highest scoring type
    let maxScore = 0;
    let personalityType = '';
    
    Object.entries(scores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score;
        personalityType = type;
      }
    });

    // Get the full personality type data
    const typeData = personalityTypes.find(t => t.type.includes(personalityType));
    
    if (!typeData) {
      console.error('No matching personality type found');
      return;
    }

    // Update user's personality type
    const { error: updateError } = await supabase
      .from('users')
      .update({
        personalitytype: typeData.type,
        personalitydescription: typeData.description,
        personalitydepth: typeData.depthExample || null,
        has_completed_quiz: true
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating personality type:', updateError);
      return;
    }

  } catch (error) {
    console.error('Error in determinePersonalityType:', error);
  }
} 