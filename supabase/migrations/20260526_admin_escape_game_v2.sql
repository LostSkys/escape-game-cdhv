-- ============================================================================
-- ADMIN ESCAPE GAME V2 - Complete Redesign
-- Date: 2026-05-26
-- New architecture: 4 admins, each managing 1 team, +1/-1 scoring
-- ============================================================================

-- ============ 1. Admin Accounts ============
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 2. Teams (Redesigned) ============
ALTER TABLE IF EXISTS public.teams DROP CONSTRAINT IF EXISTS teams_pkey CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 3. Team Members (Max 5) ============
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  member_order INTEGER NOT NULL CHECK (member_order >= 1 AND member_order <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, member_order)
);

-- ============ 4. Admin-Team Mapping ============
CREATE TABLE IF NOT EXISTS public.admin_teams (
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (admin_id, team_id)
);

-- ============ 5. Answers by Room ============
-- Each room has expected answer(s) and hints/history pieces associated
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_order INTEGER NOT NULL UNIQUE,
  expected_answers TEXT[] NOT NULL, -- Array of valid answers (case-insensitive)
  hint_piece TEXT NOT NULL, -- Piece of clue for next room
  includes_history BOOLEAN DEFAULT false,
  history_piece TEXT, -- Story piece for this room (if applicable)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 6. Attempt Log ============
CREATE TABLE IF NOT EXISTS public.attempt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE SET NULL,
  room_order INTEGER NOT NULL,
  answer_submitted TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_change INTEGER, -- +1 or -1
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 7. Team Progress - Hints Collected ============
CREATE TABLE IF NOT EXISTS public.team_hints (
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

-- ============ 8. RPC: Admin Login ============
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
BEGIN
  -- For now, simple password check (in production use bcrypt)
  SELECT id, password_hash INTO v_admin_id, v_password_hash
  FROM public.admins
  WHERE username = p_username;

  IF NOT FOUND OR v_password_hash != md5(p_password) THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;

  RETURN QUERY
  SELECT id, username, name FROM public.admins WHERE id = v_admin_id;
END;
$$;

-- ============ 9. RPC: Create Team ============
CREATE OR REPLACE FUNCTION public.create_team_with_members(
  p_admin_id UUID,
  p_team_name TEXT,
  p_members JSONB -- [{first_name, last_name}, ...]
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
  -- Create team
  INSERT INTO public.teams (name) VALUES (p_team_name)
  RETURNING id INTO v_team_id;

  -- Create admin-team mapping
  INSERT INTO public.admin_teams (admin_id, team_id) VALUES (p_admin_id, v_team_id);

  -- Add members (max 5)
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

-- ============ 10. RPC: Validate Answer ============
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
  v_current_points INTEGER;
BEGIN
  -- Get expected answers for this room
  SELECT expected_answers, hint_piece, history_piece, includes_history
  INTO v_expected_answers, v_hint_piece, v_history_piece, v_includes_history
  FROM public.answers
  WHERE room_order = p_room_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if answer is correct (case-insensitive)
  v_is_correct := v_answer_normalized = ANY(
    SELECT LOWER(answer) FROM UNNEST(v_expected_answers) AS answer
  );

  -- Log the attempt
  INSERT INTO public.attempt_log (team_id, admin_id, room_order, answer_submitted, is_correct, points_change)
  VALUES (
    p_team_id,
    p_admin_id,
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

  -- If correct, add to hints collected
  IF v_is_correct THEN
    INSERT INTO public.team_hints (team_id, room_order, hint_pieces, history_pieces)
    VALUES (
      p_team_id,
      p_room_order,
      ARRAY[v_hint_piece],
      CASE WHEN v_includes_history THEN ARRAY[v_history_piece] ELSE '{}'::TEXT[] END
    )
    ON CONFLICT (team_id, room_order) DO UPDATE
    SET 
      hint_pieces = array_append(EXCLUDED.hint_pieces, v_hint_piece),
      history_pieces = CASE 
        WHEN v_includes_history 
        THEN array_append(EXCLUDED.history_pieces, v_history_piece)
        ELSE EXCLUDED.history_pieces
      END,
      all_correct = true,
      completed_at = now();
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

-- ============ 11. RPC: Get Team Progress ============
CREATE OR REPLACE FUNCTION public.get_team_progress(
  p_team_id UUID
)
RETURNS TABLE (
  team_name TEXT,
  points INTEGER,
  members_count INTEGER,
  hint_pieces TEXT[],
  history_pieces TEXT[],
  accumulated_hints TEXT,
  last_attempt TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    t.name,
    t.points,
    COUNT(DISTINCT tm.id),
    array_agg(DISTINCT th.hint_pieces[1]) FILTER (WHERE th.hint_pieces IS NOT NULL),
    array_agg(DISTINCT th.history_pieces[1]) FILTER (WHERE th.history_pieces IS NOT NULL),
    COALESCE(
      STRING_AGG(DISTINCT th.hint_pieces[1], ' | ' ORDER BY th.hint_pieces[1]),
      ''
    ),
    MAX(al.created_at)
  FROM public.teams t
  LEFT JOIN public.team_members tm ON t.id = tm.team_id
  LEFT JOIN public.team_hints th ON t.id = th.team_id
  LEFT JOIN public.attempt_log al ON t.id = al.team_id
  WHERE t.id = p_team_id
  GROUP BY t.id, t.name, t.points;
$$;

-- ============ 12. RPC: Get Leaderboard ============
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
    STRING_AGG(tm.first_name || ' ' || tm.last_name, ', ' ORDER BY tm.member_order),
    MAX(al.created_at)
  FROM public.teams t
  LEFT JOIN public.team_members tm ON t.id = tm.team_id
  LEFT JOIN public.attempt_log al ON t.id = al.team_id
  GROUP BY t.id, t.name, t.points
  ORDER BY t.points DESC;
$$;

-- ============ 13. RPC: Get Admin's Team ============
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

-- ============ 14. RPC: Get Attempt History ============
CREATE OR REPLACE FUNCTION public.get_attempt_history(
  p_team_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  room_order INTEGER,
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
    al.answer_submitted,
    al.is_correct,
    al.points_change,
    a.name,
    al.created_at
  FROM public.attempt_log al
  LEFT JOIN public.admins a ON al.admin_id = a.id
  WHERE al.team_id = p_team_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
$$;

-- ============ 15. Initialize Admin Accounts ============
INSERT INTO public.admins (username, password_hash, name) VALUES
  ('admin1', md5('cdhv-admin-2026-secure'), 'Maître du Jeu 1'),
  ('admin2', md5('cdhv-admin-2026-secure'), 'Maître du Jeu 2'),
  ('admin3', md5('cdhv-admin-2026-secure'), 'Maître du Jeu 3'),
  ('admin4', md5('cdhv-admin-2026-secure'), 'Maître du Jeu 4')
ON CONFLICT (username) DO NOTHING;

-- ============ 16. Sample Answers (ROOMS) ============
-- You'll customize these with actual answers
INSERT INTO public.answers (room_order, expected_answers, hint_piece, includes_history, history_piece) VALUES
  (1, ARRAY['answer1', 'alt-answer1'], 'Indice pour la salle 2', false, NULL),
  (2, ARRAY['answer2'], 'Indice pour la salle 3', true, 'Chapitre 1 de l''histoire'),
  (3, ARRAY['answer3', 'alt-answer3'], 'Indice pour la salle 4', false, NULL)
ON CONFLICT DO NOTHING;
