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
  { 
    type: 'The Connector', 
    icon: '🤝', 
    description: 'Warm and outgoing, thrives on building relationships and bringing people together.',
    depthExample: `Your responses consistently demonstrate a natural talent for building bridges between people. You show genuine interest in others' experiences and perspectives, often finding common ground where others might see differences.

Your communication style reflects warmth and empathy, making others feel heard and valued. You tend to remember personal details and use them to strengthen connections, showing that relationships are truly important to you.

The way you approach group dynamics suggests you're most energized when facilitating meaningful interactions and helping others connect. Your answers indicate you have an intuitive understanding of what brings people together.`
  },
  { 
    type: 'The Organizer', 
    icon: '📋', 
    description: 'Detail-oriented and structured, excels at planning and keeping projects on track.',
    depthExample: `Your responses reveal a systematic approach to problem-solving and planning. You consistently show attention to detail and a preference for clear, structured processes that others can follow.

Your thought patterns demonstrate logical organization and a natural ability to break down complex tasks into manageable steps. You tend to think ahead and consider potential obstacles, showing strong planning instincts.

The way you process information suggests you're most comfortable when there's a clear framework to work within. Your answers indicate you value efficiency and reliability, making you someone others can depend on to get things done.`
  },
  { 
    type: 'The Thinker', 
    icon: '🤔', 
    description: 'Reflective and analytical, enjoys deep conversations and solving complex problems.',
    depthExample: `Your responses demonstrate a thoughtful, analytical approach to understanding the world around you. You consistently show curiosity about underlying causes and enjoy exploring ideas from multiple angles.

Your thought patterns reveal a preference for depth over breadth, often wanting to understand the "why" behind things before moving forward. You tend to process information carefully and consider various perspectives before forming conclusions.

The way you approach challenges suggests you're most energized when solving complex problems that require careful analysis. Your answers indicate you value intellectual growth and meaningful conversations that challenge your thinking.`
  },
  { 
    type: 'The Achiever', 
    icon: '🏆', 
    description: 'Goal-driven and energetic, constantly setting and reaching new milestones.',
    depthExample: `Your responses reveal a strong drive for accomplishment and personal growth. You consistently show enthusiasm for setting challenging goals and the determination to see them through to completion.

Your thought patterns demonstrate forward momentum and a natural ability to break down ambitious objectives into actionable steps. You tend to measure progress and celebrate milestones, showing that achievement is a core motivator.

The way you approach challenges suggests you're most energized when working toward meaningful goals that push your limits. Your answers indicate you have a natural competitive spirit and thrive on seeing tangible results from your efforts.`
  },
  { 
    type: 'The Supporter', 
    icon: '🤗', 
    description: 'Compassionate and dependable, offers encouragement and a listening ear.',
    depthExample: `Your responses consistently demonstrate genuine care for others' well-being and success. You show natural empathy and often put others' needs before your own, creating a safe space for people to share their challenges.

Your communication style reflects patience and understanding, making others feel supported and valued. You tend to offer practical help and emotional encouragement, showing that you truly want to see others succeed.

The way you interact with people suggests you're most energized when providing support and helping others overcome obstacles. Your answers indicate you have a natural nurturing instinct and find fulfillment in being there for others.`
  },
  { 
    type: 'The Visionary', 
    icon: '🌟', 
    description: 'Imaginative and future-focused, loves brainstorming big ideas and possibilities.',
    depthExample: `Your responses reveal a creative imagination and a natural ability to see beyond current limitations. You consistently show enthusiasm for exploring "what if" scenarios and connecting seemingly unrelated ideas in innovative ways.

Your thought patterns demonstrate big-picture thinking and a preference for focusing on future possibilities rather than current constraints. You tend to inspire others with your optimism and ability to envision positive change.

The way you approach ideas suggests you're most energized when brainstorming creative solutions and exploring new possibilities. Your answers indicate you have a natural talent for seeing potential where others might see obstacles.`
  },
  { 
    type: 'The Realist', 
    icon: '⚖️', 
    description: 'Practical and grounded, values clear plans and tangible results.',
    depthExample: `Your responses demonstrate a practical, down-to-earth approach to problem-solving and decision-making. You consistently show preference for concrete facts over abstract theories and value solutions that work in the real world.

Your thought patterns reveal a focus on what's achievable and a natural ability to identify potential obstacles before they become problems. You tend to ask practical questions and prefer clear, actionable advice over vague suggestions.

The way you approach challenges suggests you're most comfortable when there's a clear, logical path forward. Your answers indicate you value reliability and practical results, making you someone others turn to for grounded advice.`
  },
  { 
    type: 'The Innovator', 
    icon: '💡', 
    description: 'Creative and bold, often comes up with unconventional solutions.',
    depthExample: `Your responses reveal a creative mindset and a willingness to challenge conventional thinking. You consistently show enthusiasm for finding new approaches to problems and aren't afraid to suggest unconventional solutions.

Your thought patterns demonstrate lateral thinking and a natural ability to see connections between seemingly unrelated concepts. You tend to question assumptions and explore alternative perspectives, showing that innovation comes naturally to you.

The way you approach challenges suggests you're most energized when finding creative solutions that break from traditional methods. Your answers indicate you have a natural talent for thinking outside the box and inspiring others to consider new possibilities.`
  },
  { 
    type: 'The Reflector', 
    icon: '🪞', 
    description: 'Thoughtful and observant, learns from experiences and helps others do the same.',
    depthExample: `Your responses demonstrate a reflective nature and a natural ability to learn from both successes and challenges. You consistently show thoughtfulness about your experiences and often help others gain insights from their own journeys.

Your communication style reflects wisdom gained through reflection and a preference for meaningful conversations that go beyond surface-level topics. You tend to ask thoughtful questions and offer insights that help others see their situations more clearly.

The way you process experiences suggests you're most energized when helping others learn and grow from their experiences. Your answers indicate you have a natural ability to see patterns and extract meaningful lessons from life's ups and downs.`
  },
  { 
    type: 'The Strategist', 
    icon: '♟️', 
    description: 'Forward-thinking and methodical, excels at planning and decision-making.',
    depthExample: `Your responses reveal a strategic mindset and a natural ability to think several steps ahead. You consistently show preference for planning and considering long-term implications before making decisions.

Your thought patterns demonstrate systematic thinking and a natural ability to identify patterns and trends that others might miss. You tend to approach challenges methodically, showing that you value thorough analysis over quick decisions.

The way you approach problems suggests you're most energized when developing comprehensive plans and considering multiple scenarios. Your answers indicate you have a natural talent for strategic thinking and helping others see the bigger picture.`
  },
  { 
    type: 'The Motivator', 
    icon: '🌠', 
    description: 'Inspiring and energetic, brings out the best in others.',
    depthExample: `Your responses consistently demonstrate enthusiasm and a natural ability to inspire others to take action. You show genuine excitement for possibilities and often help others see their potential when they might be feeling discouraged.

Your communication style reflects energy and optimism, making others feel motivated and capable. You tend to focus on strengths and possibilities, showing that you naturally encourage others to believe in themselves.

The way you interact with people suggests you're most energized when helping others discover their capabilities and take positive steps forward. Your answers indicate you have a natural talent for motivation and creating positive momentum in any situation.`
  },
  { 
    type: 'The Analyst', 
    icon: '📊', 
    description: 'Detail-focused and logical, excels at solving complex problems.',
    depthExample: `Your responses reveal a logical, analytical approach to understanding complex situations. You consistently show attention to detail and a preference for gathering all relevant information before forming conclusions.

Your thought patterns demonstrate systematic analysis and a natural ability to identify key factors that others might overlook. You tend to ask clarifying questions and prefer evidence-based reasoning over intuitive judgments.

The way you approach problems suggests you're most energized when diving deep into complex issues and finding logical solutions. Your answers indicate you have a natural talent for analysis and helping others see the logical structure behind complex situations.`
  },
  { 
    type: 'The Enthusiast', 
    icon: '✨', 
    description: 'Passionate and optimistic, brings energy and excitement to projects.',
    depthExample: `Your responses consistently demonstrate enthusiasm and a natural ability to find excitement in new opportunities. You show genuine passion for your interests and often help others see the fun and potential in various situations.

Your communication style reflects energy and positivity, making others feel excited and motivated. You tend to focus on possibilities and opportunities, showing that you naturally bring a sense of adventure to any project.

The way you approach new experiences suggests you're most energized when exploring new possibilities and sharing your excitement with others. Your answers indicate you have a natural talent for enthusiasm and creating positive energy in any group or situation.`
  },
  { 
    type: 'The Harmonizer', 
    icon: '🎵', 
    description: 'Balanced and diplomatic, creates harmony in groups and relationships.',
    depthExample: `Your responses demonstrate a natural ability to find balance and create harmony in various situations. You consistently show diplomatic skills and often help others find common ground when there might be differences of opinion.

Your communication style reflects thoughtfulness and a preference for inclusive solutions that consider multiple perspectives. You tend to mediate conflicts and help others see different viewpoints, showing that harmony is truly important to you.

The way you approach group dynamics suggests you're most energized when helping others work together effectively and find mutually beneficial solutions. Your answers indicate you have a natural talent for diplomacy and creating positive, collaborative environments.`
  }
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