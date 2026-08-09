-- ====================================================================
-- ChemLab AI / LabFlow AI — Two-Role Auth & Access Control Schema
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Table: teacher_whitelist
CREATE TABLE IF NOT EXISTS teacher_whitelist (
  email text PRIMARY KEY,
  password_hash text NULL,
  security_question text NULL,
  security_answer_hash text NULL,
  failed_attempt_count int DEFAULT 0,
  locked_until timestamptz NULL,
  password_set_at timestamptz NULL,
  updated_at timestamptz DEFAULT now()
);

-- Ensure all columns exist if table was previously created
ALTER TABLE teacher_whitelist ADD COLUMN IF NOT EXISTS failed_attempt_count int DEFAULT 0;
ALTER TABLE teacher_whitelist ADD COLUMN IF NOT EXISTS locked_until timestamptz NULL;
ALTER TABLE teacher_whitelist ADD COLUMN IF NOT EXISTS password_set_at timestamptz NULL;
ALTER TABLE teacher_whitelist ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Seed initial faculty whitelist if missing
INSERT INTO teacher_whitelist (email) VALUES
  ('hod.chem@rajalakshmi.edu.in'),
  ('jeffithmanohar.e.2024.chem@rajalakshmi.edu.in'),
  ('praveenyt872@gmail.com'),
  ('praveen.r.2024.chem@rajalakshmi.edu.in'),
  ('shrivarshini.n.2024.chem@rajalakshmi.edu.in'),
  ('samyuktha.g.2024.chem@rajalakshmi.edu.in'),
  ('rahealcatherine.v.2024.chem@rajalakshmi.edu.in'),
  ('mangaleswari.s@rajalakshmi.edu.in'),
  ('sundararaman.tr@rajalakshmi.edu.in'),
  ('narasimhareddy.s@rajalakshmi.edu.in'),
  ('seelamnarasimhareddy@rajalakshmi.edu.in'),
  ('rameschandrapanda@rajalakshmi.edu.in'),
  ('vijayaraghavan.g@rajalakshmi.edu.in'),
  ('maryrosana.nt@rajalakshmi.edu.in'),
  ('vincentjoseph.kl@rajalakshmi.edu.in'),
  ('ambigadevi.j@rajalakshmi.edu.in'),
  ('sivamani.s@rajalakshmi.edu.in')
ON CONFLICT (email) DO NOTHING;


-- 2. Table: active_code (single site-wide access code)
CREATE TABLE IF NOT EXISTS active_code (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  code_hash text NULL,
  is_active boolean DEFAULT true,
  created_by text,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz NULL
);

-- Backward compatibility alias view / table support for access_code
CREATE TABLE IF NOT EXISTS access_code (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NULL,
  code_hash text NOT NULL,
  active boolean DEFAULT true,
  is_active boolean DEFAULT true,
  generated_by text,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz NULL
);


-- 3. Table: student_sessions (tracks active code student authorization)
CREATE TABLE IF NOT EXISTS student_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  student_email text,
  authorized_code text NOT NULL,
  code_row_id uuid NULL,
  authorized_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_student_sessions_user_active ON student_sessions (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_active_code_status ON active_code (is_active);


-- 4. Enable Supabase Realtime on active_code and access_code
ALTER PUBLICATION supabase_realtime ADD TABLE active_code;
ALTER PUBLICATION supabase_realtime ADD TABLE access_code;


-- 5. Row Level Security Policies
-- Disable RLS on active_code and student_sessions so public client can read active status & verify
ALTER TABLE active_code DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_code DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_whitelist DISABLE ROW LEVEL SECURITY;

-- 6. RPC Function: check_teacher_status
-- Safely queries teacher status without exposing password_hash or security_answer_hash to client
CREATE OR REPLACE FUNCTION check_teacher_status(p_email text)
RETURNS json AS $$
DECLARE
  v_teacher record;
  v_now timestamptz := now();
  v_locked boolean := false;
  v_rem_sec int := 0;
BEGIN
  SELECT * INTO v_teacher FROM teacher_whitelist WHERE lower(email) = lower(trim(p_email));
  
  IF NOT FOUND THEN
    RETURN json_build_object('exists', false);
  END IF;

  IF v_teacher.locked_until IS NOT NULL AND v_teacher.locked_until > v_now THEN
    v_locked := true;
    v_rem_sec := EXTRACT(EPOCH FROM (v_teacher.locked_until - v_now))::int;
  END IF;

  RETURN json_build_object(
    'exists', true,
    'needs_setup', (v_teacher.password_hash IS NULL),
    'is_locked', v_locked,
    'lock_remaining_seconds', v_rem_sec
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
