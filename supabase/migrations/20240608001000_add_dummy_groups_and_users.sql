-- Insert dummy users
INSERT INTO users (id, email, has_completed_quiz, active_group) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com', true, NULL),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com', true, NULL),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.com', true, NULL);

-- Insert dummy groups
INSERT INTO groups (id, member_ids, streak_count, is_active, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222']::uuid[], 5, true, NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ARRAY['33333333-3333-3333-3333-333333333333']::uuid[], 2, true, NOW());

-- Assign users to groups in group_members
INSERT INTO group_members (id, group_id, user_id, role, created_at) VALUES
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'member', NOW()),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', NOW()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'member', NOW()); 