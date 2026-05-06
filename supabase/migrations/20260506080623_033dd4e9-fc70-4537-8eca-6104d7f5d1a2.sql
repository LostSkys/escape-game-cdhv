-- 1) Ajouter colonne total_points sur teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0;

-- 2) Nettoyer les données de test
DELETE FROM public.team_progress;
DELETE FROM public.players;
DELETE FROM public.teams;

-- 3) validate_step_answer : +1 / -1 sur points
CREATE OR REPLACE FUNCTION public.validate_step_answer(p_team_id uuid, p_step_id uuid, p_answer text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expected TEXT;
  v_hint TEXT;
  v_step_order INTEGER;
  v_correct BOOLEAN;
BEGIN
  SELECT expected_answer, hint, step_order
  INTO v_expected, v_hint, v_step_order
  FROM public.steps WHERE id = p_step_id;

  IF v_expected IS NULL THEN
    RETURN jsonb_build_object('error', 'Étape introuvable');
  END IF;

  v_correct := lower(trim(p_answer)) = lower(trim(v_expected));

  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (
    p_team_id, p_step_id, v_step_order,
    CASE WHEN v_correct THEN 0 ELSE 1 END,
    CASE WHEN v_correct THEN now() ELSE NULL END
  )
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET faults = team_progress.faults + CASE WHEN v_correct THEN 0 ELSE 1 END,
      completed_at = CASE WHEN v_correct AND team_progress.completed_at IS NULL THEN now() ELSE team_progress.completed_at END;

  IF v_correct THEN
    UPDATE public.teams
    SET current_step = GREATEST(current_step, v_step_order + 1),
        total_points = total_points + 1
    WHERE id = p_team_id;
  ELSE
    UPDATE public.teams
    SET total_points = total_points - 1
    WHERE id = p_team_id;
  END IF;

  UPDATE public.teams
  SET total_faults = (SELECT COALESCE(SUM(faults), 0) FROM public.team_progress WHERE team_id = p_team_id)
  WHERE id = p_team_id;

  RETURN jsonb_build_object('correct', v_correct, 'hint', v_hint);
END;
$function$;

-- 4) validate_substep : +1 / -1 sur points
CREATE OR REPLACE FUNCTION public.validate_substep(p_team_id uuid, p_step_id uuid, p_sub_index integer, p_answer text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_content jsonb;
  v_sub jsonb;
  v_expected text;
  v_correct boolean;
BEGIN
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
    SET total_faults = total_faults + 1,
        total_points = total_points - 1
    WHERE id = p_team_id;
  END IF;

  RETURN jsonb_build_object(
    'correct', v_correct,
    'expected', v_expected,
    'hint', v_sub->>'hint'
  );
END;
$function$;

-- 5) complete_room_step : +1 point
CREATE OR REPLACE FUNCTION public.complete_room_step(p_team_id uuid, p_step_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_step_order INTEGER;
  v_type public.step_type;
BEGIN
  SELECT step_order, type INTO v_step_order, v_type
  FROM public.steps WHERE id = p_step_id;

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
$function$;

-- 6) score_minijeu : applique +1/-1 par question puis marque l'étape complétée
CREATE OR REPLACE FUNCTION public.score_minijeu(p_team_id uuid, p_step_id uuid, p_correct integer, p_wrong integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_step_order integer;
  v_hint text;
BEGIN
  SELECT step_order, hint INTO v_step_order, v_hint
  FROM public.steps WHERE id = p_step_id;

  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (p_team_id, p_step_id, v_step_order, p_wrong, now())
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET faults = team_progress.faults + p_wrong,
      completed_at = COALESCE(team_progress.completed_at, now());

  UPDATE public.teams
  SET current_step = GREATEST(current_step, v_step_order + 1),
      total_points = total_points + p_correct - p_wrong,
      total_faults = total_faults + p_wrong
  WHERE id = p_team_id;

  RETURN jsonb_build_object('ok', true, 'hint', v_hint);
END;
$function$;