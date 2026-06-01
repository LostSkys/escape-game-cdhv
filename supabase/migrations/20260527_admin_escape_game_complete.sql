-- ============================================================================
-- ADMIN ESCAPE GAME V3 - COMPLETE REDESIGN (All-in-One Migration)
-- Date: 2026-05-26
-- Description: Full admin system with 12 rooms, 4 admin accounts, all RPC functions
-- ============================================================================

-- ============================================================================
-- PHASE 1: CLEANUP (Drop all old objects)
-- ============================================================================
DROP TABLE IF EXISTS public.attempt_log CASCADE;
DROP TABLE IF EXISTS public.team_hints CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.admin_teams CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.team_story CASCADE;
DROP TABLE IF EXISTS public.room_progress CASCADE;
DROP TABLE IF EXISTS public.question_progress CASCADE;
DROP TABLE IF EXISTS public.team_progress CASCADE;
DROP TABLE IF EXISTS public.steps CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;

DROP FUNCTION IF EXISTS public.get_team_status(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_status_v2(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_room_by_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_question_by_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_room_questions(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_question_answer(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_room(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_hints(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_accumulated_story(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.submit_event_code(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.finish_game_v2(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_progress_detailed(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_rooms_progress(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_hint_eligibility(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_room_code_parts(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_team_points(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reset_team_progress(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.mark_question_attempted(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.complete_composite_step(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.complete_room_step(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_minijeu(uuid, uuid, jsonb, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_step_answer(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_step_answer(uuid, uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_substep(uuid, uuid, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_substep(uuid, uuid, integer, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.find_team_by_name(text) CASCADE;
DROP FUNCTION IF EXISTS public.finish_game(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.finish_game(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_teams(text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_players(text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_team(text, uuid, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.admin_check(text) CASCADE;
DROP FUNCTION IF EXISTS public._check_admin(text) CASCADE;
DROP FUNCTION IF EXISTS public._check_team_token(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_login(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_team_with_members(uuid, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.validate_answer(uuid, uuid, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_progress(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_leaderboard() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_team(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_attempt_history(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_attempt_history(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_hints_progression(uuid) CASCADE;

DROP INDEX IF EXISTS public.idx_attempt_log_team CASCADE;
DROP INDEX IF EXISTS public.idx_attempt_log_admin CASCADE;
DROP INDEX IF EXISTS public.idx_team_members_team CASCADE;
DROP INDEX IF EXISTS public.idx_admin_teams_admin CASCADE;
DROP INDEX IF EXISTS public.idx_team_hints_team CASCADE;

DROP TYPE IF EXISTS public.room_type CASCADE;
DROP TYPE IF EXISTS public.step_type CASCADE;

-- ============================================================================
-- PHASE 2: NEW TABLES
-- ============================================================================

-- 1. Admin Accounts (4 admins with different passwords)
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teams (Redesigned - simple, no token)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Team Members (Max 5 per team)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  member_order INTEGER NOT NULL CHECK (member_order >= 1 AND member_order <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, member_order)
);

-- 4. Admin-Team Mapping (each admin manages one team)
CREATE TABLE public.admin_teams (
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (admin_id, team_id)
);

-- 5. Rooms (12 salles)
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER UNIQUE NOT NULL,
  room_type TEXT NOT NULL, -- 'QUESTION' or 'EVENT'
  title TEXT NOT NULL,
  description TEXT,
  unlock_code TEXT UNIQUE,
  room_hint TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Answers by Room (expected answers + hint pieces)
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  room_order INTEGER NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 1 CHECK (question_order >= 1 AND question_order <= 6),
  expected_answers TEXT[] NOT NULL, -- Array of valid answers (case-insensitive)
  question_text TEXT,
  hint_piece TEXT NOT NULL, -- Piece of clue for next room
  code_part TEXT,
  next_question_hint TEXT,
  includes_history BOOLEAN DEFAULT false,
  history_piece TEXT, -- Story piece for this room (if applicable)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, question_order)
);

-- 7. Team Hints (collected by team)
CREATE TABLE public.team_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  room_order INTEGER NOT NULL,
  hint_pieces TEXT[] DEFAULT '{}', -- Array of collected hints
  history_pieces TEXT[] DEFAULT '{}', -- Array of collected story pieces
  all_correct BOOLEAN DEFAULT false, -- True when all answers for this room are found
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, room_order)
);

-- 8. Attempt Log (history of all submissions)
CREATE TABLE public.attempt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.answers(id) ON DELETE SET NULL,
  room_order INTEGER NOT NULL,
  answer_submitted TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_change INTEGER, -- +1 or -1
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_attempt_log_team ON public.attempt_log(team_id);
CREATE INDEX idx_attempt_log_admin ON public.attempt_log(admin_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_admin_teams_admin ON public.admin_teams(admin_id);
CREATE INDEX idx_team_hints_team ON public.team_hints(team_id);

-- ============================================================================
-- PHASE 3: RPC FUNCTIONS
-- ============================================================================

-- 1. Admin Login
CREATE OR REPLACE FUNCTION public.admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  admin_id UUID,
  username TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_password_hash TEXT;
  v_input_hash TEXT;
BEGIN
  SELECT id, password_hash INTO v_admin_id, v_password_hash
  FROM public.admins
  WHERE public.admins.username = p_username;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;

  v_input_hash := md5(p_password);
  
  IF v_password_hash != v_input_hash THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;

  RETURN QUERY
  SELECT public.admins.id, public.admins.username, public.admins.name FROM public.admins WHERE id = v_admin_id;
END;
$$;

-- 2. Create Team with Members
CREATE OR REPLACE FUNCTION public.create_team_with_members(
  p_admin_id UUID,
  p_team_name TEXT,
  p_members JSONB
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  member_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_member JSONB;
  v_order INTEGER := 1;
BEGIN
  INSERT INTO public.teams (name) VALUES (p_team_name)
  RETURNING id INTO v_team_id;

  INSERT INTO public.admin_teams (admin_id, team_id) VALUES (p_admin_id, v_team_id);

  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    EXIT WHEN v_order > 5;
    
    INSERT INTO public.team_members (team_id, first_name, last_name, member_order)
    VALUES (
      v_team_id,
      v_member->>'first_name',
      v_member->>'last_name',
      v_order
    );
    
    v_order := v_order + 1;
  END LOOP;

  RETURN QUERY
  SELECT v_team_id, p_team_name, v_order - 1;
END;
$$;

-- 3. Validate Answer
CREATE OR REPLACE FUNCTION public.validate_answer(
  p_team_id UUID,
  p_admin_id UUID,
  p_room_order INTEGER,
  p_answer TEXT
)
RETURNS TABLE (
  is_correct BOOLEAN,
  points_change INTEGER,
  new_team_points INTEGER,
  hint_piece TEXT,
  history_piece TEXT,
  room_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_correct BOOLEAN;
  v_hint_piece TEXT;
  v_history_piece TEXT;
  v_includes_history BOOLEAN;
  v_expected_answers TEXT[];
  v_answer_normalized TEXT := LOWER(TRIM(p_answer));
  v_new_points INTEGER;
  v_room_id UUID;
  v_question_id UUID;
  v_total_questions INTEGER;
  v_correct_questions INTEGER;
BEGIN
  -- Get the next unanswered question for this room
  SELECT r.id, a.id, a.expected_answers, a.hint_piece, a.history_piece, a.includes_history
  INTO v_room_id, v_question_id, v_expected_answers, v_hint_piece, v_history_piece, v_includes_history
  FROM public.answers a
  JOIN public.rooms r ON a.room_id = r.id
  WHERE r.room_number = p_room_order
    AND NOT EXISTS (
      SELECT 1
      FROM public.attempt_log al
      WHERE al.team_id = p_team_id
        AND al.question_id = a.id
        AND al.is_correct = true
    )
  ORDER BY a.question_order
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT points INTO v_new_points FROM public.teams WHERE id = p_team_id;
    RETURN QUERY SELECT false, 0, v_new_points, NULL, NULL, true;
  END IF;

  -- Check if answer is correct (case-insensitive)
  v_is_correct := v_answer_normalized = ANY(
    SELECT LOWER(answer) FROM UNNEST(v_expected_answers) AS answer
  );

  -- Log the attempt
  INSERT INTO public.attempt_log (team_id, admin_id, room_id, question_id, room_order, answer_submitted, is_correct, points_change)
  VALUES (
    p_team_id,
    p_admin_id,
    v_room_id,
    v_question_id,
    p_room_order,
    p_answer,
    v_is_correct,
    CASE WHEN v_is_correct THEN 1 ELSE -1 END
  );

  -- Update team points
  UPDATE public.teams
  SET points = points + (CASE WHEN v_is_correct THEN 1 ELSE -1 END),
      updated_at = now()
  WHERE id = p_team_id
  RETURNING points INTO v_new_points;

  -- If correct, add to hints collected and mark the room complete only when all questions are answered
  IF v_is_correct THEN
    SELECT COUNT(*) INTO v_total_questions
    FROM public.answers a
    WHERE a.room_id = v_room_id;

    SELECT COUNT(DISTINCT al.question_id) INTO v_correct_questions
    FROM public.attempt_log al
    WHERE al.team_id = p_team_id
      AND al.room_id = v_room_id
      AND al.is_correct = true;

    INSERT INTO public.team_hints (team_id, room_order, hint_pieces, history_pieces, all_correct, completed_at)
    VALUES (
      p_team_id,
      p_room_order,
      ARRAY[v_hint_piece],
      CASE WHEN v_includes_history THEN ARRAY[v_history_piece] ELSE '{}'::TEXT[] END,
      v_correct_questions + 1 >= v_total_questions,
      CASE WHEN v_correct_questions + 1 >= v_total_questions THEN now() ELSE NULL END
    )
    ON CONFLICT (team_id, room_order) DO UPDATE
    SET 
      hint_pieces = array_cat(team_hints.hint_pieces, ARRAY[v_hint_piece]),
      history_pieces = CASE 
        WHEN v_includes_history 
        THEN array_cat(team_hints.history_pieces, ARRAY[v_history_piece])
        ELSE team_hints.history_pieces
      END,
      all_correct = team_hints.all_correct OR v_correct_questions + 1 >= v_total_questions,
      completed_at = CASE
        WHEN team_hints.all_correct OR v_correct_questions + 1 >= v_total_questions
        THEN COALESCE(team_hints.completed_at, now())
        ELSE team_hints.completed_at
      END;
  END IF;

  RETURN QUERY
  SELECT 
    v_is_correct,
    CASE WHEN v_is_correct THEN 1 ELSE -1 END,
    v_new_points,
    CASE WHEN v_is_correct THEN v_hint_piece ELSE NULL END,
    CASE WHEN v_is_correct AND v_includes_history THEN v_history_piece ELSE NULL END,
    CASE WHEN v_is_correct THEN true ELSE false END;
END;
$$;

-- 4. Get Team Progress
CREATE OR REPLACE FUNCTION public.get_team_progress(
  p_team_id UUID
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  points INTEGER,
  total_attempts INTEGER,
  correct_answers INTEGER,
  incorrect_answers INTEGER,
  rooms_completed INTEGER,
  total_rooms INTEGER,
  members TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    t.id,
    t.name,
    t.points,
    COALESCE(al.attempts, 0),
    COALESCE(al.correct, 0),
    COALESCE(al.incorrect, 0),
    COALESCE(th.rooms_completed, 0),
    (SELECT COUNT(*) FROM public.rooms),
    COALESCE(tm.members, '')
  FROM public.teams t
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS attempts,
      COUNT(*) FILTER (WHERE is_correct) AS correct,
      COUNT(*) FILTER (WHERE is_correct = false) AS incorrect
    FROM public.attempt_log
    WHERE team_id = t.id
  ) al ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS rooms_completed
    FROM public.team_hints
    WHERE team_id = t.id AND all_correct = true
  ) th ON true
  LEFT JOIN LATERAL (
    SELECT STRING_AGG(first_name || ' ' || last_name, ', ' ORDER BY member_order) AS members
    FROM public.team_members
    WHERE team_id = t.id
  ) tm ON true
  WHERE p_team_id IS NULL OR t.id = p_team_id
  ORDER BY t.points DESC;
$$;

-- 5. Get Leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank INTEGER,
  team_name TEXT,
  points INTEGER,
  members TEXT,
  last_activity TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY t.points DESC),
    t.name,
    t.points,
    COALESCE(tm.members, ''),
    la.last_activity
  FROM public.teams t
  LEFT JOIN LATERAL (
    SELECT STRING_AGG(first_name || ' ' || last_name, ', ' ORDER BY member_order) AS members
    FROM public.team_members
    WHERE team_id = t.id
  ) tm ON true
  LEFT JOIN LATERAL (
    SELECT MAX(created_at) AS last_activity
    FROM public.attempt_log
    WHERE team_id = t.id
  ) la ON true
  ORDER BY t.points DESC;
$$;

-- 6. Get Admin's Team
CREATE OR REPLACE FUNCTION public.get_admin_team(p_admin_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  points INTEGER,
  members JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT team_id INTO v_team_id
  FROM public.admin_teams
  WHERE admin_id = p_admin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No team assigned to this admin';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.points,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'first_name', tm.first_name,
        'last_name', tm.last_name,
        'order', tm.member_order
      ) ORDER BY tm.member_order
    ) FILTER (WHERE tm.id IS NOT NULL)
  FROM public.teams t
  LEFT JOIN public.team_members tm ON t.id = tm.team_id
  WHERE t.id = v_team_id
  GROUP BY t.id, t.name, t.points;
END;
$$;

-- 7. Get Attempt History (limit 500)
CREATE OR REPLACE FUNCTION public.get_attempt_history(
  p_team_id UUID,
  p_limit INTEGER DEFAULT 500
)
RETURNS TABLE (
  room_order INTEGER,
  room_title TEXT,
  answer_submitted TEXT,
  is_correct BOOLEAN,
  points_change INTEGER,
  admin_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    al.room_order,
    r.title,
    al.answer_submitted,
    al.is_correct,
    al.points_change,
    a.name,
    al.created_at
  FROM public.attempt_log al
  LEFT JOIN public.rooms r ON r.room_number = al.room_order
  LEFT JOIN public.admins a ON al.admin_id = a.id
  WHERE al.team_id = p_team_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
$$;

-- 8. Get Team Hints and Progression
CREATE OR REPLACE FUNCTION public.get_team_hints_progression(p_team_id UUID)
RETURNS TABLE (
  room_order INTEGER,
  room_title TEXT,
  room_type TEXT,
  unlocked BOOLEAN,
  hint_pieces TEXT[],
  history_pieces TEXT[],
  accumulated_clue TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.room_number,
    r.title,
    r.room_type,
    COALESCE(th.all_correct, false),
    COALESCE(th.hint_pieces, '{}'::TEXT[]),
    COALESCE(th.history_pieces, '{}'::TEXT[]),
    CASE WHEN COALESCE(th.hint_pieces, '{}'::TEXT[]) IS NOT NULL AND array_length(th.hint_pieces, 1) > 0
      THEN array_to_string(th.hint_pieces, ' ')
      ELSE ''
    END
  FROM public.rooms r
  LEFT JOIN public.team_hints th ON r.room_number = th.room_order AND th.team_id = p_team_id
  ORDER BY r.room_number;
END;
$$;

-- 6. Get Room by Code
CREATE OR REPLACE FUNCTION public.get_room_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID,
  room_number INTEGER,
  room_type TEXT,
  title TEXT,
  description TEXT,
  unlock_code TEXT,
  room_hint TEXT,
  is_active BOOLEAN,
  event_story_chapter TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    r.id,
    r.room_number,
    r.room_type,
    r.title,
    r.description,
    r.unlock_code,
    r.room_hint,
    r.is_active,
    CASE WHEN r.room_type = 'EVENT' THEN a.history_piece ELSE NULL END
  FROM public.rooms r
  LEFT JOIN public.answers a ON a.room_id = r.id
  WHERE r.unlock_code = p_code
  LIMIT 1;
$$;

-- 7. Get Room Questions
CREATE OR REPLACE FUNCTION public.get_room_questions(p_room_id UUID)
RETURNS TABLE (
  id UUID,
  room_id UUID,
  room_order INTEGER,
  question_order INTEGER,
  title TEXT,
  question_text TEXT,
  expected_answers TEXT[],
  hint_text TEXT,
  next_question_hint TEXT,
  code_part TEXT,
  includes_history BOOLEAN,
  history_piece TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    a.id,
    a.room_id,
    a.room_order,
    a.question_order,
    COALESCE(a.question_text, 'Question ' || a.question_order),
    a.question_text,
    a.expected_answers,
    a.hint_piece,
    a.next_question_hint,
    a.code_part,
    a.includes_history,
    a.history_piece
  FROM public.answers a
  WHERE a.room_id = p_room_id
  ORDER BY a.room_order, a.question_order;
$$;

-- 8. Get Team Progress Detailed
CREATE OR REPLACE FUNCTION public.get_team_progress_detailed(
  p_team_id UUID,
  p_room_id UUID
)
RETURNS TABLE (
  question_id UUID,
  room_id UUID,
  room_order INTEGER,
  question_order INTEGER,
  title TEXT,
  question_text TEXT,
  hint_text TEXT,
  next_question_hint TEXT,
  faults INTEGER,
  hint_unlocked BOOLEAN,
  completed BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    a.id,
    a.room_id,
    a.room_order,
    a.question_order,
    COALESCE(a.question_text, 'Question ' || a.question_order),
    a.question_text,
    a.hint_piece,
    a.next_question_hint,
    COALESCE(wrong.faults, 0),
    COALESCE(wrong.faults, 0) >= 2,
    COALESCE(correct.count, 0) > 0
  FROM public.answers a
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS faults
    FROM public.attempt_log al
    WHERE al.team_id = p_team_id
      AND al.question_id = a.id
      AND al.is_correct = false
  ) AS wrong ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS count
    FROM public.attempt_log al
    WHERE al.team_id = p_team_id
      AND al.question_id = a.id
      AND al.is_correct = true
  ) AS correct ON true
  WHERE a.room_id = p_room_id
  ORDER BY a.room_order, a.question_order;
$$;

-- 9. Validate Question Answer
CREATE OR REPLACE FUNCTION public.validate_question_answer(
  p_team_id UUID,
  p_question_id UUID,
  p_answer TEXT
)
RETURNS TABLE (
  correct BOOLEAN,
  points_change INTEGER,
  new_team_points INTEGER,
  code_part TEXT,
  hint_unlocked BOOLEAN,
  hint_text TEXT,
  next_question_hint TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_answers TEXT[];
  v_hint_piece TEXT;
  v_history_piece TEXT;
  v_includes_history BOOLEAN;
  v_code_part TEXT;
  v_next_question_hint TEXT;
  v_room_id UUID;
  v_room_order INTEGER;
  v_new_points INTEGER;
  v_answer_normalized TEXT := LOWER(TRIM(p_answer));
  v_wrong_count INTEGER;
  v_total_questions INTEGER;
  v_correct_count INTEGER;
  v_all_correct BOOLEAN;
BEGIN
  SELECT a.expected_answers, a.hint_piece, a.history_piece, a.includes_history, a.code_part, a.next_question_hint, a.room_id, a.room_order
  INTO v_expected_answers, v_hint_piece, v_history_piece, v_includes_history, v_code_part, v_next_question_hint, v_room_id, v_room_order
  FROM public.answers a
  WHERE a.id = p_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question introuvable';
  END IF;

  correct := v_answer_normalized = ANY(
    SELECT LOWER(answer) FROM UNNEST(v_expected_answers) AS answer
  );

  INSERT INTO public.attempt_log (team_id, room_id, question_id, room_order, answer_submitted, is_correct, points_change)
  VALUES (
    p_team_id,
    v_room_id,
    p_question_id,
    v_room_order,
    p_answer,
    correct,
    CASE WHEN correct THEN 1 ELSE -1 END
  );

  SELECT COUNT(*) INTO v_total_questions
  FROM public.answers
  WHERE room_id = v_room_id;

  SELECT COUNT(DISTINCT al.question_id) INTO v_correct_count
  FROM public.attempt_log al
  WHERE al.team_id = p_team_id
    AND al.is_correct = true
    AND al.question_id IN (
      SELECT id FROM public.answers WHERE room_id = v_room_id
    );

  v_all_correct := (v_correct_count >= v_total_questions);

  SELECT points + (CASE WHEN correct THEN 1 ELSE -1 END) INTO v_new_points
  FROM public.teams
  WHERE id = p_team_id;

  UPDATE public.teams
  SET points = points + (CASE WHEN correct THEN 1 ELSE -1 END),
      updated_at = now()
  WHERE id = p_team_id;

  IF correct THEN
    INSERT INTO public.team_hints (team_id, room_order, hint_pieces, history_pieces, all_correct, completed_at)
    VALUES (
      p_team_id,
      v_room_order,
      ARRAY[v_hint_piece],
      CASE WHEN v_includes_history THEN ARRAY[v_history_piece] ELSE '{}'::TEXT[] END,
      v_all_correct,
      CASE WHEN v_all_correct THEN now() ELSE NULL END
    )
    ON CONFLICT (team_id, room_order) DO UPDATE
    SET
      hint_pieces = array_cat(team_hints.hint_pieces, ARRAY[v_hint_piece]),
      history_pieces = CASE
        WHEN v_includes_history
        THEN array_cat(team_hints.history_pieces, ARRAY[v_history_piece])
        ELSE team_hints.history_pieces
      END,
      all_correct = (
        SELECT COUNT(DISTINCT al.question_id) = COUNT(*)
        FROM public.answers q
        LEFT JOIN public.attempt_log al ON al.question_id = q.id
           AND al.team_id = p_team_id
           AND al.is_correct = true
        WHERE q.room_id = v_room_id
      ),
      completed_at = CASE
        WHEN (
          SELECT COUNT(DISTINCT al.question_id) = COUNT(*)
          FROM public.answers q
          LEFT JOIN public.attempt_log al ON al.question_id = q.id
             AND al.team_id = p_team_id
             AND al.is_correct = true
          WHERE q.room_id = v_room_id
        )
        THEN now()
        ELSE team_hints.completed_at
      END;
  END IF;

  SELECT COUNT(*) INTO v_wrong_count
  FROM public.attempt_log al
  WHERE al.team_id = p_team_id
    AND al.question_id = p_question_id
    AND al.is_correct = false;

  RETURN QUERY
  SELECT
    correct,
    CASE WHEN correct THEN 1 ELSE -1 END,
    v_new_points,
    v_code_part,
    v_wrong_count >= 2,
    v_hint_piece,
    v_next_question_hint;
END;
$$;

-- 10. Unlock Room
CREATE OR REPLACE FUNCTION public.unlock_room(
  p_team_id UUID,
  p_room_id UUID,
  p_concatenated_codes TEXT
)
RETURNS TABLE (ok BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.answers a
    WHERE a.room_id = p_room_id
      AND NOT EXISTS (
        SELECT 1 FROM public.attempt_log al
        WHERE al.team_id = p_team_id
          AND al.question_id = a.id
          AND al.is_correct = true
      )
  );
$$;

-- 11. Submit Event Code
CREATE OR REPLACE FUNCTION public.submit_event_code(p_code TEXT, p_team_id UUID)
RETURNS TABLE (ok BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_room_order INTEGER;
  v_hint_piece TEXT;
  v_history_piece TEXT;
  v_includes_history BOOLEAN;
BEGIN
  SELECT r.id, r.room_number, a.hint_piece, a.history_piece, a.includes_history
  INTO v_room_id, v_room_order, v_hint_piece, v_history_piece, v_includes_history
  FROM public.rooms r
  JOIN public.answers a ON a.room_id = r.id
  WHERE r.unlock_code = p_code
    AND r.room_type = 'EVENT'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;

  INSERT INTO public.team_hints (team_id, room_order, hint_pieces, history_pieces, all_correct, completed_at)
  VALUES (
    p_team_id,
    v_room_order,
    ARRAY[v_hint_piece],
    CASE WHEN v_includes_history THEN ARRAY[v_history_piece] ELSE '{}'::TEXT[] END,
    true,
    now()
  )
  ON CONFLICT (team_id, room_order) DO UPDATE
  SET
    hint_pieces = array_cat(team_hints.hint_pieces, ARRAY[v_hint_piece]),
    history_pieces = CASE
      WHEN v_includes_history
      THEN array_cat(team_hints.history_pieces, ARRAY[v_history_piece])
      ELSE team_hints.history_pieces
    END,
    all_correct = true,
    completed_at = now();

  RETURN QUERY SELECT true;
END;
$$;

-- 12. Get Team Hints
CREATE OR REPLACE FUNCTION public.get_team_hints(p_team_id UUID)
RETURNS TABLE (
  next_question_hint TEXT,
  next_room_hint TEXT,
  accumulated_story TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT a.next_question_hint
     FROM public.rooms r
     JOIN public.answers a ON a.room_id = r.id
     WHERE r.room_type = 'QUESTION'
       AND NOT EXISTS (
         SELECT 1 FROM public.team_hints th
         WHERE th.team_id = p_team_id
           AND th.room_order = r.room_number
           AND th.all_correct = true
       )
     ORDER BY r.room_number
     LIMIT 1),
    (SELECT r.room_hint
     FROM public.rooms r
     WHERE NOT EXISTS (
       SELECT 1 FROM public.team_hints th
       WHERE th.team_id = p_team_id
         AND th.room_order = r.room_number
         AND th.all_correct = true
     )
     ORDER BY r.room_number
     LIMIT 1),
    (SELECT string_agg(hist, ' ' ORDER BY room_order, ordinal)
     FROM (
       SELECT th.room_order,
              u.ordinal,
              u.history_piece AS hist
       FROM public.team_hints th
       CROSS JOIN LATERAL unnest(th.history_pieces) WITH ORDINALITY AS u(history_piece, ordinal)
       WHERE th.team_id = p_team_id
     ) sub);
END;
$$;

-- 13. Get Team Accumulated Story
CREATE OR REPLACE FUNCTION public.get_team_accumulated_story(p_team_id UUID)
RETURNS TABLE (
  chapter_order INTEGER,
  story_chapter TEXT,
  room_number INTEGER,
  revealed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY th.room_order, u.ordinal) AS chapter_order,
    u.history_piece,
    th.room_order,
    th.completed_at
  FROM public.team_hints th
  CROSS JOIN LATERAL unnest(th.history_pieces) WITH ORDINALITY AS u(history_piece, ordinal)
  WHERE th.team_id = p_team_id
  ORDER BY th.room_order, u.ordinal;
$$;

-- ============================================================================
-- PHASE 4: SEED DATA
-- ============================================================================

-- 1. Create 4 Admin Accounts (with different passwords)
INSERT INTO public.admins (username, password_hash, name) VALUES
  ('admin1', md5('cdhv-admin-2026-secure-1'), 'Maître du Jeu 1'),
  ('admin2', md5('cdhv-admin-2026-secure-2'), 'Maître du Jeu 2'),
  ('admin3', md5('cdhv-admin-2026-secure-3'), 'Maître du Jeu 3'),
  ('admin4', md5('cdhv-admin-2026-secure-4'), 'Maître du Jeu 4')
ON CONFLICT (username) DO NOTHING;

-- 2. Create 12 Rooms
INSERT INTO public.rooms (room_number, room_type, title, description, unlock_code, room_hint, is_active) VALUES
(1, 'QUESTION', 'Salle 1 - Accueil', 'La salle d''accueil CDHV', 'SALLE01', 'Cherchez dans l''entrée principale', true),
(2, 'QUESTION', 'Salle 2 - Massif', 'Sale sur le massif des Vosges', 'SALLE02', 'Chercher à droite de l\'accueil', true),
(3, 'QUESTION', 'Salle 3 - 5 sens', 'A la découverte des 5 sens', 'SALLE03', 'Pas très loin du labo et du massif !', true),
(4, 'QUESTION', 'Salle 4 - Labo', 'Le labo des bonbons', 'SALLE04', 'Un moment spécial vous attend', true),
(5, 'QUESTION', 'Salle 5 - Jardin', 'Le jardin secret', 'SALLE05', 'Dans le coin sud-est du jardin', true),
(6, 'QUESTION', 'Salle 6 - Cinéma', 'Le cinéma des délices', 'SALLE06', 'Juste à côté du labo', true),
(7, 'QUESTION', 'Salle 7 - Atelier fab', 'L''atelier de fabrication', 'SALLE07', 'Découvrer cet espace unique !', true),
(8, 'QUESTION', 'Salle 8 - Atelier d\'antan', 'Salle de révélation', 'SALLE08', 'Un renouveau des labos', true),
(9, 'QUESTION', 'Salle 9 - Archives', 'Les archives historiques', 'SALLE09', 'Dans le grenier du bâtiment', true),
(10, 'QUESTION', 'Salle 10 - Rooftop', 'Le toit du bâtiment', 'SALLE10', 'Montez au sommet', true),
(11, 'QUESTION', 'Salle 11 - Trésor', 'La chambre au trésor', 'SALLE11', 'Derrière la porte dorée', true),
(12, 'QUESTION', 'Salle 12 - Finale', 'Salle finale', 'SALLE12', 'L''aventure se termine', true);

-- 3. Create Sample Answers/Hints for each room
-- Room 1: QUESTION
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 1, ARRAY['SUPERBIEN', 'CORRECT1'], 'Quel est le mot code pour démarrer l''escape game ?', 'SA', 'SA', 'Commencez avec l''entrée principale.', false, NULL FROM public.rooms WHERE room_number = 1;

-- Room 2: QUESTION (4 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 2, ARRAY['Le grand tétras', 'tétras', 'TÉTRAS', 'TETRAS', 'GRAND TETRAS', 'GRAND TÉTRAS'], 'Quel animal emblématique des Vosges est représenté sur la table devant vous ? ', 'Q2-1', 'Q2-1', 'on en croise dans les forêts de conifères', false, NULL FROM public.rooms WHERE room_number = 2;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 2, ARRAY['Sapin', 'SAPIN'], 'Citez toutes les plantes des vosges utilisées dans nos bonbons', 'Q2-2', 'Q2-2', 'chercher les saveurs dans la salle', false, NULL FROM public.rooms WHERE room_number = 2;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 2, ARRAY['700', '700m', '700M'], 'À quelle altitude moyenne se situe la confiserie ?', 'Q2-3', 'Q2-3', 'Regardez la carte des Vosges et trouvez notre emplacement.', false, NULL FROM public.rooms WHERE room_number = 2;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 2, ARRAY['CLÉ'], 'Quel mot clé est caché sous l''ordinateur ?', 'Q2-4', 'Q2-4', 'Ouvrez la cassette secrète.', false, NULL FROM public.rooms WHERE room_number = 2;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 2, ARRAY['JEU'], 'Mini-jeu : décidez le bon ordre des objets.', 'MINI-2', NULL, 'Une combinaison doit être trouvée.', false, NULL FROM public.rooms WHERE room_number = 2;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 6, 2, ARRAY['ÉNIGME'], 'Énigme : quel mot termine la phrase ?', 'ENIG2', NULL, 'Reliez les indices précédents.', false, NULL FROM public.rooms WHERE room_number = 2;

-- Room 3: QUESTION (4 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 3, ARRAY['ENIGME'], 'Quel mot clé de réunion apparaît dans l''agenda ?', 'Q3-1', 'Q3-1', 'Vérifiez l''ordre des sujets.', false, NULL FROM public.rooms WHERE room_number = 3;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 3, ARRAY['TABLE'], 'Quel objet est mentionné dans le procès-verbal ?', 'Q3-2', 'Q3-2', 'Cherchez le mobilier décrit.', false, NULL FROM public.rooms WHERE room_number = 3;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 3, ARRAY['PRISE'], 'Quel mot apparaît près de la prise ?', 'Q3-3', 'Q3-3', 'Observez les symboles électriques.', false, NULL FROM public.rooms WHERE room_number = 3;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 3, ARRAY['CIRCUIT'], 'Quel terme technique est inscrit sur la feuille ?', 'Q3-4', 'Q3-4', 'Suivez le fil conducteur.', false, NULL FROM public.rooms WHERE room_number = 3;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 3, ARRAY['JEU'], 'Mini-jeu : alignez les documents dans le bon ordre.', 'MINI-3', NULL, 'L''ordre est la clé.', false, NULL FROM public.rooms WHERE room_number = 3;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 6, 3, ARRAY['ENIGME'], 'Énigme : quel mot coiffe la réunion ?', 'ENIG3', NULL, 'Reliez tous les éléments vus.', false, NULL FROM public.rooms WHERE room_number = 3;

-- Room 4: QUESTION (question + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 4, ARRAY['MYSTERE'], 'Quel mot décrit le début de la cérémonie ?', 'Q4-1', 'Q4-1', 'Cherchez le respect de la tradition.', false, NULL FROM public.rooms WHERE room_number = 4;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 4, ARRAY['OFFRE'], 'Quel mot apparaît sur l''offrande ?', 'Q4-2', 'Q4-2', 'Regardez près de l''autel.', false, NULL FROM public.rooms WHERE room_number = 4;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 4, ARRAY['CHANT'], 'Quel mot est inscrit sur la banderole ?', 'Q4-3', 'Q4-3', 'Les paroles du chant contiennent la clé.', false, NULL FROM public.rooms WHERE room_number = 4;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 4, ARRAY['MINI'], 'Mini-jeu : ordonnez les éléments du rituel.', 'MINI-4', NULL, 'L''ordre est important.', false, NULL FROM public.rooms WHERE room_number = 4;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 4, ARRAY['ENIGME'], 'Énigme : quel mot verrouille la cérémonie ?', 'ENIG4', NULL, 'Assemblez les indices précédents.', false, NULL FROM public.rooms WHERE room_number = 4;

-- Room 5: QUESTION (3 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 5, ARRAY['LABO'], 'Quel mot caché apparaît sur le tableau blanc ?', 'Q5-1', 'Q5-1', 'Regardez les notes laissées.', false, NULL FROM public.rooms WHERE room_number = 5;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 5, ARRAY['ACIDE'], 'Quel composé est mentionné dans les notes ?', 'Q5-2', 'Q5-2', 'Les flacons ont la réponse.', false, NULL FROM public.rooms WHERE room_number = 5;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 5, ARRAY['LUMIERE'], 'Quel mot est dans le carnet du chercheur ?', 'Q5-3', 'Q5-3', 'Cherchez l''indice écrit à la lumière.', false, NULL FROM public.rooms WHERE room_number = 5;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 5, ARRAY['JEU'], 'Mini-jeu : associez les formules et les symboles.', 'MINI-5', NULL, 'Chaque formule a son symbole.', false, NULL FROM public.rooms WHERE room_number = 5;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 5, ARRAY['ENIGME'], 'Énigme : quel mot verrouille la salle ?', 'ENIG5', NULL, 'Assemblez les indices précédents.', false, NULL FROM public.rooms WHERE room_number = 5;

-- Room 6: QUESTION (3 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 6, ARRAY['BOOK'], 'Quel mot se cache dans le catalogue ?', 'Q6-1', 'Q6-1', 'Feuilletez les bons ouvrages.', false, NULL FROM public.rooms WHERE room_number = 6;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 6, ARRAY['PAGE'], 'Quel mot est écrit sur la première page ?', 'Q6-2', 'Q6-2', 'Ouvrez le livre au bon endroit.', false, NULL FROM public.rooms WHERE room_number = 6;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 6, ARRAY['LECTURE'], 'Quel mot conclut la note de lecture ?', 'Q6-3', 'Q6-3', 'Le résumé contient la réponse.', false, NULL FROM public.rooms WHERE room_number = 6;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 6, ARRAY['JEU'], 'Mini-jeu : triez les livres par thème.', 'MINI-6', NULL, 'La bonne pile révèle le secret.', false, NULL FROM public.rooms WHERE room_number = 6;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 6, ARRAY['ENIGME'], 'Énigme : quel mot s''associe à la dernière couverture ?', 'ENIG6', NULL, 'Reliez la couverture au thème.', false, NULL FROM public.rooms WHERE room_number = 6;

-- Room 7: QUESTION (4 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 7, ARRAY['SERVEUR'], 'Quel mot apparaît sur le serveur principal ?', 'Q7-1', 'Q7-1', 'Regardez les voyants lumineux.', false, NULL FROM public.rooms WHERE room_number = 7;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 7, ARRAY['CABLE'], 'Quel mot est gravé sur le câble rouge ?', 'Q7-2', 'Q7-2', 'Suivez le câble jusqu''au boîtier.', false, NULL FROM public.rooms WHERE room_number = 7;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 7, ARRAY['RÉSEAU'], 'Quel mot se trouve dans le manuel réseau ?', 'Q7-3', 'Q7-3', 'Le manuel explique la connexion.', false, NULL FROM public.rooms WHERE room_number = 7;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 7, ARRAY['PORT'], 'Quel mot figure près du port Ethernet ?', 'Q7-4', 'Q7-4', 'Vérifiez tous les ports actifs.', false, NULL FROM public.rooms WHERE room_number = 7;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 7, ARRAY['JEU'], 'Mini-jeu : réparez le réseau en reconnectant les bons câbles.', 'MINI-7', NULL, 'Chaque câble compte.', false, NULL FROM public.rooms WHERE room_number = 7;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 6, 7, ARRAY['ENIGME'], 'Énigme : quel mot ouvre la salle serveur ?', 'ENIG7', NULL, 'Rassemblez tous les indices.', false, NULL FROM public.rooms WHERE room_number = 7;

INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 8, ARRAY['REFLET'], 'Quel mot apparaît sur le miroir de la salle ?', 'Q8-1', 'Q8-1', 'Observez les reflets.', false, NULL FROM public.rooms WHERE room_number = 8;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 8, ARRAY['CLEF'], 'Quel mot est gravé sur la petite clé ?', 'Q8-2', 'Q8-2', 'La clé ouvre une caisse.', false, NULL FROM public.rooms WHERE room_number = 8;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 8, ARRAY['OMBRE'], 'Quel mot se forme avec les ombres projetées ?', 'Q8-3', 'Q8-3', 'Alignez les projecteurs.', false, NULL FROM public.rooms WHERE room_number = 8;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 8, ARRAY['SIGNE'], 'Quel symbole est dessiné sur le sol ?', 'Q8-4', 'Q8-4', 'Suivez la trajectoire.', false, NULL FROM public.rooms WHERE room_number = 8;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 8, ARRAY['MINI'], 'Mini-jeu : recombinez les fragments révélés.', 'MINI-8', NULL, 'Chaque fragment compte.', false, NULL FROM public.rooms WHERE room_number = 8;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 6, 8, ARRAY['ENIGME'], 'Énigme : quel mot achève la révélation ?', 'ENIG8', NULL, 'Tous les indices se rejoignent.', false, NULL FROM public.rooms WHERE room_number = 8;

-- Room 9: QUESTION (3 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 9, ARRAY['ARCHIVE'], 'Quel mot apparaît dans les archives ?', 'Q9-1', 'Q9-1', 'Les vieux dossiers contiennent la clé.', false, NULL FROM public.rooms WHERE room_number = 9;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 9, ARRAY['PAPIER'], 'Quel mot est inscrit sur la boîte de documents ?', 'Q9-2', 'Q9-2', 'La boîte cache un indice.', false, NULL FROM public.rooms WHERE room_number = 9;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 9, ARRAY['SILENCE'], 'Quel mot apparaît sur le panneau de silence ?', 'Q9-3', 'Q9-3', 'Écoutez le silence des archives.', false, NULL FROM public.rooms WHERE room_number = 9;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 9, ARRAY['JEU'], 'Mini-jeu : reconstituez le code de classement.', 'MINI-9', NULL, 'Chaque code est important.', false, NULL FROM public.rooms WHERE room_number = 9;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 9, ARRAY['ENIGME'], 'Énigme : quel mot ouvre le coffre des archives ?', 'ENIG9', NULL, 'Combinez les indexes.', false, NULL FROM public.rooms WHERE room_number = 9;

-- Room 10: QUESTION (4 questions + mini-jeu + énigme)
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 10, ARRAY['TOIT'], 'Quel mot apparaît sur le panneau du rooftop ?', 'Q10-1', 'Q10-1', 'Admirez la vue pour trouver l''indice.', false, NULL FROM public.rooms WHERE room_number = 10;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 2, 10, ARRAY['VENT'], 'Quel mot est gravé sur la rampe ?', 'Q10-2', 'Q10-2', 'Le vent porte une réponse.', false, NULL FROM public.rooms WHERE room_number = 10;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 3, 10, ARRAY['LUNE'], 'Quel mot est associé à la lune sur le toit ?', 'Q10-3', 'Q10-3', 'Regardez le ciel nocturne.', false, NULL FROM public.rooms WHERE room_number = 10;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 4, 10, ARRAY['CLE'], 'Quel mot cache la clé du toit ?', 'Q10-4', 'Q10-4', 'La clé est sous le toit.', false, NULL FROM public.rooms WHERE room_number = 10;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 5, 10, ARRAY['JEU'], 'Mini-jeu : trouvez la bonne combinaison de panneaux.', 'MINI-10', NULL, 'Les panneaux forment un mot.', false, NULL FROM public.rooms WHERE room_number = 10;
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 6, 10, ARRAY['ENIGME'], 'Énigme : quel mot conclut l''aventure sur le toit ?', 'ENIG10', NULL, 'Tous les indices précédents sont nécessaires.', false, NULL FROM public.rooms WHERE room_number = 10;

-- Room 11: QUESTION
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 11, ARRAY['TRESOR'], 'Quel est le mot du trésor ?', 'TR', 'TR', 'Le coffre garde la dernière clé.', false, NULL FROM public.rooms WHERE room_number = 11;

-- Room 12: QUESTION finale
INSERT INTO public.answers (room_id, question_order, room_order, expected_answers, question_text, hint_piece, code_part, next_question_hint, includes_history, history_piece)
SELECT id, 1, 12, ARRAY['FIN'], 'Quel est le code final pour conclure l''aventure ?', 'FIN', 'FIN', NULL, false, NULL FROM public.rooms WHERE room_number = 12;

-- ============================================================================
-- END: Schema complete and seeded
-- ============================================================================
