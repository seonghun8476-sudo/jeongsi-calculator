-- ==========================================
-- 어대갈까 Supabase 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor 에서 실행
-- ==========================================

-- 1. 대학 테이블
CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('국립', '사립')),
  logo_url TEXT
);

-- 2. 학과 테이블
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('인문', '자연', '의약', '예체능'))
);

CREATE INDEX IF NOT EXISTS idx_departments_university ON departments(university_id);

-- 3. 커트라인 테이블
CREATE TABLE IF NOT EXISTS cutoff_scores (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  admission_type TEXT NOT NULL DEFAULT '정시',
  min_standard_score INTEGER NOT NULL,
  min_percentile INTEGER NOT NULL,
  competition_rate NUMERIC(4,1) NOT NULL,
  avg_standard_score INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cutoff_department ON cutoff_scores(department_id);
CREATE INDEX IF NOT EXISTS idx_cutoff_year ON cutoff_scores(year);

-- 4. 점수 변환 테이블
CREATE TABLE IF NOT EXISTS score_conversion (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  subject TEXT NOT NULL,
  raw_score INTEGER NOT NULL,
  standard_score INTEGER NOT NULL,
  percentile INTEGER NOT NULL,
  grade INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversion_year_subject ON score_conversion(year, subject);

-- 5. 대학별 반영비율
CREATE TABLE IF NOT EXISTS admission_weights (
  id SERIAL PRIMARY KEY,
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  korean_weight NUMERIC(4,1) NOT NULL,
  math_weight NUMERIC(4,1) NOT NULL,
  english_weight NUMERIC(4,1) NOT NULL,
  exploration_weight NUMERIC(4,1) NOT NULL,
  english_grade_bonus JSONB
);

CREATE INDEX IF NOT EXISTS idx_weights_university ON admission_weights(university_id);

-- 6. 관심대학 (유저별)
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, department_id)
);

-- 7. 유저 구독 정보
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);

-- ==========================================
-- RLS (Row Level Security) 정책
-- ==========================================

-- 공개 데이터: 누구나 읽기 가능
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "universities_public_read" ON universities FOR SELECT USING (true);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_public_read" ON departments FOR SELECT USING (true);

ALTER TABLE cutoff_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cutoff_scores_public_read" ON cutoff_scores FOR SELECT USING (true);

ALTER TABLE score_conversion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "score_conversion_public_read" ON score_conversion FOR SELECT USING (true);

ALTER TABLE admission_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admission_weights_public_read" ON admission_weights FOR SELECT USING (true);

-- 유저 데이터: 본인만 읽기/쓰기
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_favorites_own" ON user_favorites
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_subscriptions_own_read" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
