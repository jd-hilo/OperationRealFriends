import OpenAI from 'openai';
import { supabase } from './supabase';

const PERSONALITY_TYPES = [
  {
    type: "The Visionary Leader",
    description: "Natural leaders who inspire others with their creativity and strategic thinking. They excel at seeing the big picture and motivating teams toward ambitious goals."
  },
  {
    type: "The Empathetic Connector",
    description: "Warm and understanding individuals who build deep relationships. They're excellent listeners and natural mediators who bring people together."
  },
  {
    type: "The Analytical Problem-Solver",
    description: "Detail-oriented thinkers who excel at finding logical solutions. They approach challenges methodically and value accuracy and efficiency."
  },
  {
    type: "The Creative Innovator",
    description: "Original thinkers who push boundaries with their imagination. They see unique connections and aren't afraid to experiment with new ideas."
  },
  {
    type: "The Reliable Stabilizer",
    description: "Dependable individuals who provide consistency and structure. They excel at maintaining harmony and creating stable environments."
  },
  {
    type: "The Dynamic Energizer",
    description: "Enthusiastic motivators who bring energy to any situation. They're spontaneous, adaptable, and excel at getting others excited."
  },
  {
    type: "The Thoughtful Observer",
    description: "Perceptive individuals who notice subtle details others miss. They're excellent at understanding complex situations and offering insightful perspectives."
  },
  {
    type: "The Practical Achiever",
    description: "Results-oriented individuals who excel at turning ideas into reality. They're efficient, organized, and focused on tangible outcomes."
  },
  {
    type: "The Harmonious Diplomat",
    description: "Skilled negotiators who excel at finding common ground. They maintain peace while ensuring everyone's voices are heard."
  },
  {
    type: "The Curious Explorer",
    description: "Adventure-seekers who love learning and discovering new things. They're adaptable, open-minded, and always ready for new experiences."
  },
  {
    type: "The Nurturing Mentor",
    description: "Supportive guides who help others grow and develop. They're patient teachers who invest in others' success."
  },
  {
    type: "The Strategic Planner",
    description: "Forward-thinking organizers who excel at creating effective systems. They anticipate needs and develop comprehensive solutions."
  },
  {
    type: "The Authentic Individualist",
    description: "Unique souls who stay true to their values. They inspire others by embracing their authenticity and encouraging self-expression."
  },
  {
    type: "The Resilient Optimist",
    description: "Positive forces who maintain hope through challenges. They help others see opportunities in difficulties and inspire perseverance."
  },
  {
    type: "The Collaborative Builder",
    description: "Team players who excel at creating together. They value input from others and know how to leverage diverse strengths."
  }
];

interface QuizAnswers {
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
  question6: string;
  question7: string;
  question8: string;
  question9: string;
  question10: string;
  question11: string;
  question12: string;
  question13: string;
}

export async function determinePersonalityType(userId: string): Promise<void> {
  try {
    // Fetch the user's quiz answers
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('quiz_answers')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    if (!userData?.quiz_answers) throw new Error('No quiz answers found');

    const answers = userData.quiz_answers as QuizAnswers;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });

    // Prepare the prompt for OpenAI
    const prompt = `Based on the following quiz answers, match this person to one of these 15 personality types: ${PERSONALITY_TYPES.map(t => t.type).join(', ')}. Only respond with the exact name of the best matching personality type.

Quiz Answers:
1. Outgoing and sociable: ${answers.question1}
2. Compassionate and cooperative: ${answers.question2}
3. Organized and detail-oriented: ${answers.question3}
4. Calm under pressure: ${answers.question4}
5. Enjoys trying new things: ${answers.question5}
6. Preferred Saturday activity: ${answers.question6}
7. Ideal trip: ${answers.question7}
8. Self-expression preference: ${answers.question8}
9. Preferred social spot: ${answers.question9}
10. Learning style: ${answers.question10}
11. Main goal/project: ${answers.question11}
12. Preferred support style: ${answers.question12}
13. Giving support style: ${answers.question13}`;

    // Get OpenAI's response for personality type
    const typeCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
      max_tokens: 50,
    });

    const personalityType = typeCompletion.choices[0].message.content?.trim();
    const matchedType = PERSONALITY_TYPES.find(t => t.type === personalityType);

    if (!matchedType) {
      throw new Error('Could not match personality type');
    }

    // Generate personalized depth explanation
    const depthPrompt = `Based on the following quiz answers, write a detailed personality analysis in second person (using "you" and "your") following this exact structure:

1. Overview
[2-3 sentences that paint the big picture of your core motivations, worldview, and interaction style.]

2. Key Traits
• [Trait 1 Name]: [Short description of how it shows up in you]
• [Trait 2 Name]: [Short description of how it shows up in you]
• [Trait 3 Name]: [Short description of how it shows up in you]

3. Strengths
• [Strength A]: [Why it matters for you, with an example context]
• [Strength B]: [Why it matters for you, with an example context]
• [Strength C]: [Why it matters for you, with an example context]

4. Growth Areas
• [Area A]: [Your potential blind spot or challenge]
• [Area B]: [Your potential blind spot or challenge]
• [Area C]: [Your potential blind spot or challenge]

5. Ideal Accountability Partner(s)
• Preferred Check-in Style: [What works best for you]
• Complementary Types: [1-2 types that pair well with you]
• Matching Tips: [What to look for in a partner]

6. Communication Style
• Tone: [What resonates with you]
• Frequency: [Your ideal check-in cadence]
• Channel: [Your preferred communication method]

7. Motivation Triggers
• [Driver A]: [What energizes you]
• [Driver B]: [What energizes you]
• [Driver C]: [What energizes you]

8. Actionable Tips
1. [Concrete habit or ritual you can adopt]
2. [Another specific action you can take]
3. [A third practical step for you]

Quiz Answers:
1. Outgoing and sociable: ${answers.question1}
2. Compassionate and cooperative: ${answers.question2}
3. Organized and detail-oriented: ${answers.question3}
4. Calm under pressure: ${answers.question4}
5. Enjoys trying new things: ${answers.question5}
6. Preferred Saturday activity: ${answers.question6}
7. Ideal trip: ${answers.question7}
8. Self-expression preference: ${answers.question8}
9. Preferred social spot: ${answers.question9}
10. Learning style: ${answers.question10}
11. Main goal/project: ${answers.question11}
12. Preferred support style: ${answers.question12}
13. Giving support style: ${answers.question13}`;

    const depthCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: depthPrompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.8,
      max_tokens: 1000,
    });

    const personalityDepth = depthCompletion.choices[0].message.content?.trim();

    // Update the user's profile with their personality type and depth explanation
    const { error: updateError } = await supabase
      .from('users')
      .update({
        personalitytype: matchedType.type,
        personalitydescription: matchedType.description,
        personalitydepth: personalityDepth
      })
      .eq('id', userId);

    if (updateError) throw updateError;

  } catch (error) {
    console.error('Error determining personality type:', error);
    throw error;
  }
} 