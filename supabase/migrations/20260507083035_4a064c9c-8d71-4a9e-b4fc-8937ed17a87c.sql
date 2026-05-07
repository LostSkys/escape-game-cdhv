
-- ============ 1. RLS policies cleanup ============
-- TEAMS: drop public select/update/delete; keep nothing public (inscription via RPC)
DROP POLICY IF EXISTS teams_select_public ON public.teams;
DROP POLICY IF EXISTS teams_update_public ON public.teams;
DROP POLICY IF EXISTS teams_delete_public ON public.teams;
DROP POLICY IF EXISTS teams_insert_public ON public.teams;

-- PLAYERS: drop all public policies (handled via RPCs)
DROP POLICY IF EXISTS players_select_public ON public.players;
DROP POLICY IF EXISTS players_update_public ON public.players;
DROP POLICY IF EXISTS players_delete_public ON public.players;
DROP POLICY IF EXISTS players_insert_public ON public.players;

-- TEAM_PROGRESS: drop all public policies
DROP POLICY IF EXISTS progress_select_public ON public.team_progress;
DROP POLICY IF EXISTS progress_update_public ON public.team_progress;
DROP POLICY IF EXISTS progress_delete_public ON public.team_progress;
DROP POLICY IF EXISTS progress_insert_public ON public.team_progress;

-- ============ 2. Admin password helper ============
CREATE OR REPLACE FUNCTION public._check_admin(p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_password IS NULL OR p_password <> 'cdhv-admin-2026-secure' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_check(p_password text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_password = 'cdhv-admin-2026-secure';
$$;

-- ============ 3. Team token helper ============
CREATE OR REPLACE FUNCTION public._check_team_token(p_team_id uuid, p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND token = p_token) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$;

-- ============ 4. Inscription RPC ============
CREATE OR REPLACE FUNCTION public.register_team(p_name text, p_players jsonb)
RETURNS TABLE(id uuid, name text, token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_token uuid;
  v_name text;
  v_player jsonb;
  v_count int;
BEGIN
  v_name := trim(p_name);
  IF length(v_name) < 2 OR length(v_name) > 60 THEN
    RAISE EXCEPTION 'Nom invalide';
  END IF;

  v_count := jsonb_array_length(p_players);
  IF v_count < 1 OR v_count > 10 THEN
    RAISE EXCEPTION 'Nombre de joueurs invalide';
  END IF;

  IF EXISTS (SELECT 1 FROM public.teams WHERE lower(public.teams.name) = lower(v_name)) THEN
    RAISE EXCEPTION 'duplicate_team';
  END IF;

  INSERT INTO public.teams (name) VALUES (v_name)
  RETURNING public.teams.id, public.teams.token INTO v_team_id, v_token;

  FOR v_player IN SELECT * FROM jsonb_array_elements(p_players) LOOP
    INSERT INTO public.players (team_id, first_name, last_name)
    VALUES (
      v_team_id,
      substring(trim(v_player->>'first_name') for 50),
      substring(trim(v_player->>'last_name') for 50)
    );
  END LOOP;

  RETURN QUERY SELECT v_team_id, v_name, v_token;
END;
$$;

-- ============ 5. Player-side read RPCs (with token) ============
CREATE OR REPLACE FUNCTION public.get_team_status(p_team_id uuid, p_token uuid)
RETURNS TABLE(finished_at timestamptz, total_points int, total_faults int, current_step int, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);
  RETURN QUERY SELECT t.finished_at, t.total_points, t.total_faults, t.current_step, t.name
               FROM public.teams t WHERE t.id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_progress(p_team_id uuid, p_token uuid)
RETURNS TABLE(step_id uuid, faults int, completed_at timestamptz, step_order int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);
  RETURN QUERY SELECT tp.step_id, tp.faults, tp.completed_at, tp.step_order
               FROM public.team_progress tp WHERE tp.team_id = p_team_id;
END;
$$;

-- ============ 6. get_step_by_code: strip answers from content ============
CREATE OR REPLACE FUNCTION public.get_step_by_code(p_code text)
RETURNS TABLE(id uuid, step_order int, type step_type, title text, content jsonb, hint text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_content jsonb;
  v_subs jsonb;
  v_questions jsonb;
  v_i int;
  v_item jsonb;
BEGIN
  SELECT s.id, s.step_order, s.type, s.title, s.content, s.hint
  INTO v_row
  FROM public.steps s
  WHERE s.unlock_code = upper(trim(p_code));

  IF v_row.id IS NULL THEN
    RETURN;
  END IF;

  v_content := v_row.content;

  -- Strip composite sub-step answers
  IF v_content ? 'subs' THEN
    v_subs := '[]'::jsonb;
    FOR v_i IN 0..(jsonb_array_length(v_content->'subs') - 1) LOOP
      v_item := (v_content->'subs')->v_i;
      v_item := v_item - 'answer';
      v_subs := v_subs || jsonb_build_array(v_item);
    END LOOP;
    v_content := jsonb_set(v_content, '{subs}', v_subs);
  END IF;

  -- Strip minijeu question answers
  IF v_content ? 'questions' THEN
    v_questions := '[]'::jsonb;
    FOR v_i IN 0..(jsonb_array_length(v_content->'questions') - 1) LOOP
      v_item := (v_content->'questions')->v_i;
      v_item := v_item - 'answer';
      v_questions := v_questions || jsonb_build_array(v_item);
    END LOOP;
    v_content := jsonb_set(v_content, '{questions}', v_questions);
  END IF;

  RETURN QUERY SELECT v_row.id, v_row.step_order, v_row.type, v_row.title, v_content, v_row.hint;
END;
$$;

-- ============ 7. Game RPCs: add token check ============
CREATE OR REPLACE FUNCTION public.validate_step_answer(p_team_id uuid, p_token uuid, p_step_id uuid, p_answer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected text;
  v_hint text;
  v_step_order int;
  v_correct bool;
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);

  SELECT expected_answer, hint, step_order
  INTO v_expected, v_hint, v_step_order
  FROM public.steps WHERE id = p_step_id;

  IF v_expected IS NULL THEN
    RETURN jsonb_build_object('error', 'Étape introuvable');
  END IF;

  v_correct := lower(trim(p_answer)) = lower(trim(v_expected));

  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (p_team_id, p_step_id, v_step_order,
          CASE WHEN v_correct THEN 0 ELSE 1 END,
          CASE WHEN v_correct THEN now() ELSE NULL END)
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET faults = team_progress.faults + CASE WHEN v_correct THEN 0 ELSE 1 END,
      completed_at = CASE WHEN v_correct AND team_progress.completed_at IS NULL THEN now() ELSE team_progress.completed_at END;

  IF v_correct THEN
    UPDATE public.teams
    SET current_step = GREATEST(current_step, v_step_order + 1),
        total_points = total_points + 1
    WHERE id = p_team_id;
  ELSE
    UPDATE public.teams SET total_points = total_points - 1 WHERE id = p_team_id;
  END IF;

  UPDATE public.teams
  SET total_faults = (SELECT COALESCE(SUM(faults), 0) FROM public.team_progress WHERE team_id = p_team_id)
  WHERE id = p_team_id;

  RETURN jsonb_build_object('correct', v_correct, 'hint', v_hint);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_room_step(p_team_id uuid, p_token uuid, p_step_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_step_order int;
  v_type public.step_type;
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);

  SELECT step_order, type INTO v_step_order, v_type FROM public.steps WHERE id = p_step_id;

  IF v_type != 'salle' THEN
    RETURN jsonb_build_object('error', 'Cette étape requiert une réponse');
  END IF;

  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (p_team_id, p_step_id, v_step_order, 0, now())
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET completed_at = COALESCE(team_progress.completed_at, now());

  UPDATE public.teams
  SET current_step = GREATEST(current_step, v_step_order + 1),
      total_points = total_points + 1
  WHERE id = p_team_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_game(p_team_id uuid, p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);
  UPDATE public.teams SET finished_at = now() WHERE id = p_team_id AND finished_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_substep(p_team_id uuid, p_token uuid, p_step_id uuid, p_sub_index int, p_answer text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content jsonb;
  v_sub jsonb;
  v_expected text;
  v_correct bool;
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);

  SELECT content INTO v_content FROM public.steps WHERE id = p_step_id;
  IF v_content IS NULL THEN
    RETURN jsonb_build_object('error', 'Étape introuvable');
  END IF;

  v_sub := v_content->'subs'->p_sub_index;
  IF v_sub IS NULL THEN
    RETURN jsonb_build_object('error', 'Sous-étape introuvable');
  END IF;

  v_expected := v_sub->>'answer';
  v_correct := lower(trim(p_answer)) = lower(trim(v_expected));

  IF v_correct THEN
    UPDATE public.teams SET total_points = total_points + 1 WHERE id = p_team_id;
  ELSE
    UPDATE public.teams
    SET total_faults = total_faults + 1, total_points = total_points - 1
    WHERE id = p_team_id;
  END IF;

  RETURN jsonb_build_object('correct', v_correct, 'expected', v_expected, 'hint', v_sub->>'hint');
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_composite_step(p_team_id uuid, p_token uuid, p_step_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_step_order int;
  v_hint text;
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);

  SELECT step_order, hint INTO v_step_order, v_hint FROM public.steps WHERE id = p_step_id;

  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (p_team_id, p_step_id, v_step_order, 0, now())
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET completed_at = COALESCE(team_progress.completed_at, now());

  UPDATE public.teams
  SET current_step = GREATEST(current_step, v_step_order + 1)
  WHERE id = p_team_id;

  RETURN jsonb_build_object('ok', true, 'hint', v_hint);
END;
$$;

-- Replace score_minijeu (client-evaluated) with server-evaluated validate_minijeu
DROP FUNCTION IF EXISTS public.score_minijeu(uuid, uuid, int, int);

CREATE OR REPLACE FUNCTION public.validate_minijeu(p_team_id uuid, p_token uuid, p_step_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content jsonb;
  v_questions jsonb;
  v_step_order int;
  v_hint text;
  v_correct int := 0;
  v_wrong int := 0;
  v_total int;
  v_i int;
  v_expected text;
  v_given text;
BEGIN
  PERFORM public._check_team_token(p_team_id, p_token);

  SELECT content, step_order, hint INTO v_content, v_step_order, v_hint
  FROM public.steps WHERE id = p_step_id;

  IF v_content IS NULL THEN
    RETURN jsonb_build_object('error', 'Étape introuvable');
  END IF;

  v_questions := v_content->'questions';
  v_total := COALESCE(jsonb_array_length(v_questions), 0);

  FOR v_i IN 0..(v_total - 1) LOOP
    v_expected := (v_questions->v_i)->>'answer';
    v_given := p_answers->>v_i;
    IF v_given IS NOT NULL AND lower(trim(v_given)) = lower(trim(v_expected)) THEN
      v_correct := v_correct + 1;
    ELSE
      v_wrong := v_wrong + 1;
    END IF;
  END LOOP;

  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (p_team_id, p_step_id, v_step_order, v_wrong, now())
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET faults = team_progress.faults + v_wrong,
      completed_at = COALESCE(team_progress.completed_at, now());

  UPDATE public.teams
  SET current_step = GREATEST(current_step, v_step_order + 1),
      total_points = total_points + v_correct - v_wrong,
      total_faults = total_faults + v_wrong
  WHERE id = p_team_id;

  RETURN jsonb_build_object(
    'correct', v_correct,
    'wrong', v_wrong,
    'total', v_total,
    'hint', v_hint,
    'results', (
      SELECT jsonb_agg(jsonb_build_object('answer', (v_questions->idx)->>'answer'))
      FROM generate_series(0, v_total - 1) AS idx
    )
  );
END;
$$;

-- ============ 8. Admin RPCs ============
CREATE OR REPLACE FUNCTION public.admin_list_teams(p_password text)
RETURNS TABLE(id uuid, name text, current_step int, total_faults int, total_points int, started_at timestamptz, finished_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._check_admin(p_password);
  RETURN QUERY SELECT t.id, t.name, t.current_step, t.total_faults, t.total_points, t.started_at, t.finished_at
               FROM public.teams t;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_players(p_password text)
RETURNS TABLE(id uuid, team_id uuid, first_name text, last_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._check_admin(p_password);
  RETURN QUERY SELECT p.id, p.team_id, p.first_name, p.last_name FROM public.players p;
END;
$$;

DROP FUNCTION IF EXISTS public.delete_team(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_team(p_password text, p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._check_admin(p_password);
  DELETE FROM public.team_progress WHERE team_id = p_team_id;
  DELETE FROM public.players WHERE team_id = p_team_id;
  DELETE FROM public.teams WHERE id = p_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_team(p_password text, p_team_id uuid, p_name text, p_players jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player jsonb;
BEGIN
  PERFORM public._check_admin(p_password);

  IF p_name IS NOT NULL AND length(trim(p_name)) > 0 THEN
    UPDATE public.teams SET name = trim(p_name) WHERE id = p_team_id;
  END IF;

  IF p_players IS NOT NULL THEN
    FOR v_player IN SELECT * FROM jsonb_array_elements(p_players) LOOP
      UPDATE public.players
      SET first_name = substring(trim(v_player->>'first_name') for 50),
          last_name = substring(trim(v_player->>'last_name') for 50)
      WHERE id = (v_player->>'id')::uuid AND team_id = p_team_id;
    END LOOP;
  END IF;
END;
$$;
