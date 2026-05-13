-- ============================================================================
-- RPC SUPPLEMENTAIRES - Escape Game System
-- Date: 2026-05-13
-- ============================================================================

-- 1. Récupérer la progression complète d'une équipe (par question)
CREATE OR REPLACE FUNCTION public.get_team_progress_detailed(
  p_team_id UUID,
  p_token UUID
)
RETURNS TABLE (
  question_id UUID,
  room_id UUID,
  room_number INTEGER,
  title TEXT,
  faults INTEGER,
  hint_unlocked BOOLEAN,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    s.id,
    s.room_id,
    r.room_number,
    s.title,
    COALESCE(qp.faults, 0),
    qp.hint_unlocked_at IS NOT NULL,
    qp.completed_at IS NOT NULL,
    qp.completed_at
  FROM public.steps s
  LEFT JOIN public.question_progress qp ON s.id = qp.question_id AND qp.team_id = p_team_id
  LEFT JOIN public.rooms r ON s.room_id = r.id
  WHERE (SELECT token FROM public.teams WHERE id = p_team_id) = p_token
  ORDER BY r.room_number, s.question_order;
$$;

-- 2. Récupérer la progression par salle
CREATE OR REPLACE FUNCTION public.get_team_rooms_progress(
  p_team_id UUID,
  p_token UUID
)
RETURNS TABLE (
  room_id UUID,
  room_number INTEGER,
  title TEXT,
  room_type public.room_type,
  unlocked BOOLEAN,
  completed BOOLEAN,
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    r.id,
    r.room_number,
    r.title,
    r.room_type,
    rp.unlocked_at IS NOT NULL,
    rp.completed_at IS NOT NULL,
    rp.unlocked_at,
    rp.completed_at
  FROM public.rooms r
  LEFT JOIN public.room_progress rp ON r.id = rp.room_id AND rp.team_id = p_team_id
  WHERE r.is_active = true
    AND (SELECT token FROM public.teams WHERE id = p_team_id) = p_token
  ORDER BY r.room_number;
$$;

-- 3. Récupérer le statut d'une équipe (info générale)
CREATE OR REPLACE FUNCTION public.get_team_status_v2(
  p_team_id UUID,
  p_token UUID
)
RETURNS TABLE (
  team_name TEXT,
  total_points INTEGER,
  total_faults INTEGER,
  completed_questions INTEGER,
  completed_rooms INTEGER,
  current_room_number INTEGER,
  finished_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    t.name,
    t.total_points,
    t.total_faults,
    (SELECT COUNT(*) FROM public.question_progress WHERE team_id = p_team_id AND completed_at IS NOT NULL),
    (SELECT COUNT(*) FROM public.room_progress WHERE team_id = p_team_id AND completed_at IS NOT NULL),
    (SELECT room_number FROM public.rooms WHERE id = t.current_room_id),
    t.finished_at
  FROM public.teams t
  WHERE t.id = p_team_id AND t.token = p_token;
$$;

-- 4. Vérifier si une question peut être déverrouillée (si l'indice doit s'afficher)
CREATE OR REPLACE FUNCTION public.check_hint_eligibility(
  p_team_id UUID,
  p_question_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_faults INTEGER;
  v_should_unlock BOOLEAN;
BEGIN
  SELECT faults INTO v_faults
  FROM public.question_progress
  WHERE team_id = p_team_id AND question_id = p_question_id;

  -- Indice se déverrouille après 2 erreurs (faults >= 2)
  v_should_unlock := COALESCE(v_faults, 0) >= 2;

  RETURN jsonb_build_object(
    'should_unlock_hint', v_should_unlock,
    'faults', COALESCE(v_faults, 0),
    'remaining_tries', GREATEST(0, 2 - COALESCE(v_faults, 0))
  );
END;
$$;

-- 5. Récupérer tous les codes des questions d'une salle (pour vérifier si prête à déverrouiller)
CREATE OR REPLACE FUNCTION public.get_room_code_parts(
  p_team_id UUID,
  p_room_id UUID
)
RETURNS TABLE (
  code_part TEXT,
  is_complete BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    s.code_part,
    qp.completed_at IS NOT NULL
  FROM public.steps s
  LEFT JOIN public.question_progress qp ON s.id = qp.question_id AND qp.team_id = p_team_id
  WHERE s.room_id = p_room_id AND s.is_active = true
  ORDER BY s.question_order;
$$;

-- 6. Calculer les points actuels d'une équipe
CREATE OR REPLACE FUNCTION public.calculate_team_points(
  p_team_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_completed_rooms INTEGER;
  v_total_faults INTEGER;
  v_points INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_completed_rooms
  FROM public.room_progress
  WHERE team_id = p_team_id AND completed_at IS NOT NULL;

  SELECT COALESCE(SUM(faults), 0) INTO v_total_faults
  FROM public.question_progress
  WHERE team_id = p_team_id;

  -- Formule : 100 pts par salle - 10 pts par faute
  v_points := (v_completed_rooms * 100) - (v_total_faults * 10);
  v_points := GREATEST(0, v_points); -- Minimum 0 pts

  RETURN jsonb_build_object(
    'total_points', v_points,
    'completed_rooms', v_completed_rooms,
    'total_faults', v_total_faults,
    'breakdown', jsonb_build_object(
      'rooms_bonus', v_completed_rooms * 100,
      'faults_penalty', v_total_faults * 10
    )
  );
END;
$$;

-- 7. Réinitialiser une équipe (pour admin - recommencer depuis le début)
CREATE OR REPLACE FUNCTION public.reset_team_progress(
  p_team_id UUID,
  p_admin_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérification du mot de passe admin (même que dans adminAuth.ts)
  IF p_admin_password != 'CDHV2025' THEN
    RETURN jsonb_build_object('error', 'Mot de passe admin invalide');
  END IF;

  -- Supprimer la progression
  DELETE FROM public.question_progress WHERE team_id = p_team_id;
  DELETE FROM public.room_progress WHERE team_id = p_team_id;
  DELETE FROM public.team_story WHERE team_id = p_team_id;

  -- Réinitialiser les données de l'équipe
  UPDATE public.teams
  SET 
    current_step = 1,
    current_room_id = NULL,
    total_faults = 0,
    total_points = 0,
    finished_at = NULL,
    started_at = now(),
    updated_at = now()
  WHERE id = p_team_id;

  RETURN jsonb_build_object('ok', true, 'message', 'Progression réinitialisée');
END;
$$;

-- 8. Récupérer l'histoire accumulée d'une équipe (pour l'onglet Story)
CREATE OR REPLACE FUNCTION public.get_team_accumulated_story(
  p_team_id UUID,
  p_token UUID
)
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
    ts.chapter_order,
    ts.story_chapter,
    r.room_number,
    ts.revealed_at
  FROM public.team_story ts
  LEFT JOIN public.rooms r ON ts.room_id = r.id
  WHERE ts.team_id = p_team_id
    AND (SELECT token FROM public.teams WHERE id = p_team_id) = p_token
  ORDER BY ts.chapter_order ASC;
$$;

-- 9. Marquer une question comme "attempting" (commencée)
CREATE OR REPLACE FUNCTION public.mark_question_attempted(
  p_team_id UUID,
  p_question_id UUID,
  p_room_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer une entry de progress si elle n'existe pas
  INSERT INTO public.question_progress (team_id, question_id, room_id, faults, completed_at)
  VALUES (p_team_id, p_question_id, p_room_id, 0, NULL)
  ON CONFLICT (team_id, question_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 10. Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_timestamp_rooms
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER trg_update_timestamp_question_progress
BEFORE UPDATE ON public.question_progress
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER trg_update_timestamp_room_progress
BEFORE UPDATE ON public.room_progress
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER trg_update_timestamp_teams
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
