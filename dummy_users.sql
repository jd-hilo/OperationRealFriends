-- Insert 4 dummy users with complete information and assign them to group aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

-- User 1: Sarah Chen - The Connector
INSERT INTO users (
  id,
  email,
  created_at,
  has_completed_quiz,
  current_group_id,
  submitted,
  last_submission_date,
  location,
  preferred_name,
  bio,
  avatar_url,
  personalitytype,
  personalitydescription,
  personalitydepth,
  push_token
) VALUES (
  '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'sarah.chen@example.com',
  '2024-01-15T10:00:00Z',
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true,
  '2024-01-20T14:30:00Z',
  '10001',
  'Sarah',
  'Passionate about building meaningful connections and bringing people together. Love exploring new cultures through food and travel.',
  'https://images.pexels.com/photos/7035526/pexels-photo-7035526.jpeg',
  'The Connector',
  'Warm and outgoing, thrives on building relationships and bringing people together.',
  'Your responses consistently demonstrate a natural talent for building bridges between people. You show genuine interest in others experiences and perspectives, often finding common ground where others might see differences. Your communication style reflects warmth and empathy, making others feel heard and valued. You tend to remember personal details and use them to strengthen connections, showing that relationships are truly important to you. The way you approach group dynamics suggests you are most energized when facilitating meaningful interactions and helping others connect. Your answers indicate you have an intuitive understanding of what brings people together.',
  'ExponentPushToken[test-token-1]'
);

-- User 2: Marcus Rodriguez - The Explorer
INSERT INTO users (
  id,
  email,
  created_at,
  has_completed_quiz,
  current_group_id,
  submitted,
  last_submission_date,
  location,
  preferred_name,
  bio,
  avatar_url,
  personalitytype,
  personalitydescription,
  personalitydepth,
  push_token
) VALUES (
  '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'marcus.rodriguez@example.com',
  '2024-01-16T11:00:00Z',
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true,
  '2024-01-20T15:45:00Z',
  '90210',
  'Marcus',
  'Adventure seeker and creative soul. Always looking for the next challenge and love pushing boundaries in art and life.',
  'https://images.pexels.com/photos/6214726/pexels-photo-6214726.jpeg',
  'The Explorer',
  'Creative and adventurous, constantly seeking new experiences and pushing boundaries.',
  'Your responses reveal a natural curiosity and desire to explore uncharted territory. You approach challenges with creativity and enthusiasm, often seeing opportunities where others see obstacles. Your adventurous spirit comes through in how you tackle problems and your willingness to try new approaches. You seem energized by novelty and change, preferring to chart your own path rather than follow established routes. Your creative thinking suggests you have a unique perspective that can bring fresh insights to any situation.',
  'ExponentPushToken[test-token-2]'
);

-- User 3: Emma Thompson - The Thinker
INSERT INTO users (
  id,
  email,
  created_at,
  has_completed_quiz,
  current_group_id,
  submitted,
  last_submission_date,
  location,
  preferred_name,
  bio,
  avatar_url,
  personalitytype,
  personalitydescription,
  personalitydepth,
  push_token
) VALUES (
  '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'emma.thompson@example.com',
  '2024-01-17T12:00:00Z',
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  false,
  NULL,
  '60601',
  'Emma',
  'Deep thinker and problem solver. Enjoy analyzing complex situations and finding elegant solutions through careful consideration.',
  'https://images.pexels.com/photos/6988724/pexels-photo-6988724.jpeg',
  'The Thinker',
  'Analytical and thoughtful, prefers to carefully consider all angles before making decisions.',
  'Your responses demonstrate a methodical and analytical approach to problem-solving. You prefer to gather information and think through situations carefully before taking action. Your thoughtful nature comes through in how you consider multiple perspectives and weigh different options. You seem to value precision and accuracy, often catching details that others might miss. Your analytical mindset suggests you excel at breaking down complex problems into manageable parts and finding logical solutions.',
  'ExponentPushToken[test-token-3]'
);

-- User 4: Alex Kim - The Supporter
INSERT INTO users (
  id,
  email,
  created_at,
  has_completed_quiz,
  current_group_id,
  submitted,
  last_submission_date,
  location,
  preferred_name,
  bio,
  avatar_url,
  personalitytype,
  personalitydescription,
  personalitydepth,
  push_token
) VALUES (
  '44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'alex.kim@example.com',
  '2024-01-18T13:00:00Z',
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true,
  '2024-01-20T16:15:00Z',
  '33101',
  'Alex',
  'Supportive and reliable friend who values stability and helping others succeed. Love creating safe spaces for people to grow.',
  'https://images.pexels.com/photos/7525042/pexels-photo-7525042.jpeg',
  'The Supporter',
  'Reliable and supportive, creates stability and helps others achieve their goals.',
  'Your responses consistently show a caring and supportive nature. You seem to naturally take on the role of helping others and creating a stable foundation for those around you. Your reliability comes through in how you approach commitments and your willingness to be there for others. You appear to value harmony and cooperation, often working behind the scenes to ensure everyone feels supported. Your supportive nature suggests you have a gift for recognizing what others need and providing it in a thoughtful way.',
  'ExponentPushToken[test-token-4]'
);

-- Note: Group will automatically have 4 members based on user assignments

-- Verify the insertions
SELECT 
  u.id,
  u.preferred_name,
  u.personalitytype,
  u.current_group_id,
  u.submitted,
  u.location,
  u.bio
FROM users u 
WHERE u.current_group_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY u.created_at;
