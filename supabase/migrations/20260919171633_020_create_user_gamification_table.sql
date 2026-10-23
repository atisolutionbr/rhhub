CREATE TABLE IF NOT EXISTS user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level int DEFAULT 1,
  xp int DEFAULT 0,
  badges text[] DEFAULT '{}',
  streak_days int DEFAULT 0,
  last_activity date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_gamification" ON user_gamification;
CREATE POLICY "select_own_gamification" ON user_gamification FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_gamification" ON user_gamification;
CREATE POLICY "insert_own_gamification" ON user_gamification
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_gamification" ON user_gamification;
CREATE POLICY "update_own_gamification" ON user_gamification
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
