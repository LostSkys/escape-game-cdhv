-- ============================================================================
-- MIGRATION: Système complet Escape Game - Rooms, Questions, Hints, Events
-- Date: 2026-05-13
-- ============================================================================

-- Enum pour les types de salle
CREATE TYPE public.room_type AS ENUM ('QUESTION', 'EVENT');

-- ============================================================================
-- TABLE: Rooms (12 salles : 9 QUESTION + 3 EVENT)
-- ============================================================================
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number INTEGER NOT NULL UNIQUE CHECK (room_number BETWEEN 1 AND 12),
  room_type public.room_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlock_code TEXT NOT NULL UNIQUE,
  -- Pour les salles EVENT : histoire à afficher après déverrouillage
  event_story_chapter TEXT,
  -- Indice pour accéder à cette salle (se montre dans l'onglet Hints)
  room_hint TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_number ON public.rooms(room_number);
CREATE INDEX idx_rooms_active ON public.rooms(is_active);

-- ============================================================================
-- Adapter la table STEPS en QUESTIONS (avec nouvelles colonnes)
-- ============================================================================
ALTER TABLE public.steps
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS question_order INTEGER,
  ADD COLUMN IF NOT EXISTS code_part TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hint_text TEXT,
  ADD COLUMN IF NOT EXISTS next_question_hint TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Les 'steps' existantes deviennent des questions sans salle assignée (backward compatibility)
-- Elles resteront accessibles via leur unlock_code

CREATE INDEX idx_steps_room ON public.steps(room_id);
CREATE INDEX idx_steps_active ON public.steps(is_active);
CREATE INDEX idx_steps_room_order ON public.steps(room_id, question_order);

-- ============================================================================
-- TABLE: Question Progress (track par question, pas juste par étape)
-- ============================================================================
CREATE TABLE public.question_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  faults INTEGER NOT NULL DEFAULT 0,
  hint_unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, question_id)
);

CREATE INDEX idx_question_progress_team ON public.question_progress(team_id);
CREATE INDEX idx_question_progress_room ON public.question_progress(room_id);
CREATE INDEX idx_question_progress_question ON public.question_progress(question_id);

-- ============================================================================
-- TABLE: Room Progress (track par salle - pour savoir si salle complétée)
-- ============================================================================
CREATE TABLE public.room_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, room_id)
);

CREATE INDEX idx_room_progress_team ON public.room_progress(team_id);
CREATE INDEX idx_room_progress_room ON public.room_progress(room_id);

-- ============================================================================
-- TABLE: Team Story (accumulation de l'histoire par chapitre)
-- ============================================================================
CREATE TABLE public.team_story (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  story_chapter TEXT NOT NULL,
  chapter_order INTEGER NOT NULL,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, room_id, chapter_order)
);

CREATE INDEX idx_team_story_team ON public.team_story(team_id);
CREATE INDEX idx_team_story_order ON public.team_story(team_id, chapter_order);

-- ============================================================================
-- Adapter la table TEAMS avec nouvelles colonnes
-- ============================================================================
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_story ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES
-- ============================================================================
-- Rooms : lecture publique (pas de réponses secrets)
CREATE POLICY "rooms_select_public" ON public.rooms FOR SELECT USING (true);

-- Question Progress : lecture/insert/update public
CREATE POLICY "question_progress_select_public" ON public.question_progress FOR SELECT USING (true);
CREATE POLICY "question_progress_insert_public" ON public.question_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "question_progress_update_public" ON public.question_progress FOR UPDATE USING (true);

-- Room Progress : lecture/insert/update public
CREATE POLICY "room_progress_select_public" ON public.room_progress FOR SELECT USING (true);
CREATE POLICY "room_progress_insert_public" ON public.room_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "room_progress_update_public" ON public.room_progress FOR UPDATE USING (true);

-- Team Story : lecture/insert public
CREATE POLICY "team_story_select_public" ON public.team_story FOR SELECT USING (true);
CREATE POLICY "team_story_insert_public" ON public.team_story FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS RPC (Core Queries)
-- ============================================================================

-- 1. Récupérer les questions d'une salle (sans réponses)
CREATE OR REPLACE FUNCTION public.get_room_questions(p_room_id UUID)
RETURNS TABLE (
  id UUID,
  question_order INTEGER,
  title TEXT,
  content JSONB,
  hint_text TEXT,
  next_question_hint TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, question_order, title, content, hint_text, next_question_hint
  FROM public.steps
  WHERE room_id = p_room_id AND is_active = true
  ORDER BY question_order ASC;
$$;

-- 2. Récupérer une question par son unlock_code (sans réponse)
CREATE OR REPLACE FUNCTION public.get_question_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content JSONB,
  hint_text TEXT,
  next_question_hint TEXT,
  room_id UUID,
  question_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, title, content, hint_text, next_question_hint, room_id, question_order
  FROM public.steps
  WHERE unlock_code = upper(trim(p_code)) AND is_active = true;
$$;

-- 3. Récupérer une salle par son unlock_code (pour EVENT rooms)
CREATE OR REPLACE FUNCTION public.get_room_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID,
  room_number INTEGER,
  room_type public.room_type,
  title TEXT,
  event_story_chapter TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, room_number, room_type, title, event_story_chapter
  FROM public.rooms
  WHERE unlock_code = upper(trim(p_code)) AND is_active = true;
$$;

-- 4. Valider une réponse de question
CREATE OR REPLACE FUNCTION public.validate_question_answer(
  p_team_id UUID,
  p_question_id UUID,
  p_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected TEXT;
  v_hint_text TEXT;
  v_next_question_hint TEXT;
  v_room_id UUID;
  v_question_order INTEGER;
  v_code_part TEXT;
  v_correct BOOLEAN;
BEGIN
  SELECT expected_answer, hint_text, next_question_hint, room_id, question_order, code_part
  INTO v_expected, v_hint_text, v_next_question_hint, v_room_id, v_question_order, v_code_part
  FROM public.steps
  WHERE id = p_question_id AND is_active = true;

  IF v_expected IS NULL THEN
    RETURN jsonb_build_object('error', 'Question introuvable');
  END IF;

  v_correct := lower(trim(p_answer)) = lower(trim(v_expected));

  -- Upsert question_progress
  INSERT INTO public.question_progress (team_id, question_id, room_id, faults, completed_at)
  VALUES (
    p_team_id, p_question_id, v_room_id,
    CASE WHEN v_correct THEN 0 ELSE 1 END,
    CASE WHEN v_correct THEN now() ELSE NULL END
  )
  ON CONFLICT (team_id, question_id) DO UPDATE
  SET faults = question_progress.faults + CASE WHEN v_correct THEN 0 ELSE 1 END,
      hint_unlocked_at = CASE WHEN NOT v_correct AND question_progress.faults >= 1 THEN now() ELSE question_progress.hint_unlocked_at END,
      completed_at = CASE WHEN v_correct AND question_progress.completed_at IS NULL THEN now() ELSE question_progress.completed_at END,
      updated_at = now();

  -- Mettre à jour total_faults si erreur
  IF NOT v_correct THEN
    UPDATE public.teams
    SET total_faults = total_faults + 1
    WHERE id = p_team_id;
  END IF;

  RETURN jsonb_build_object(
    'correct', v_correct,
    'hint_text', v_hint_text,
    'next_question_hint', v_next_question_hint,
    'code_part', v_code_part,
    'faults', CASE WHEN v_correct THEN 0 ELSE 1 END
  );
END;
$$;

-- 5. Déverrouiller une salle (quand tous les codes des questions sont bons)
CREATE OR REPLACE FUNCTION public.unlock_room(
  p_team_id UUID,
  p_room_id UUID,
  p_concatenated_codes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_code TEXT;
  v_room_type public.room_type;
BEGIN
  SELECT unlock_code, room_type INTO v_expected_code, v_room_type
  FROM public.rooms
  WHERE id = p_room_id AND is_active = true;

  IF v_expected_code IS NULL THEN
    RETURN jsonb_build_object('error', 'Salle introuvable');
  END IF;

  IF upper(trim(p_concatenated_codes)) != upper(trim(v_expected_code)) THEN
    RETURN jsonb_build_object('error', 'Code salle incorrect');
  END IF;

  -- Upsert room_progress
  INSERT INTO public.room_progress (team_id, room_id, unlocked_at, completed_at)
  VALUES (
    p_team_id, p_room_id,
    now(),
    CASE WHEN v_room_type = 'EVENT' THEN now() ELSE NULL END
  )
  ON CONFLICT (team_id, room_id) DO UPDATE
  SET unlocked_at = COALESCE(room_progress.unlocked_at, now()),
      updated_at = now();

  -- Mettre à jour current_room_id
  UPDATE public.teams
  SET current_room_id = p_room_id
  WHERE id = p_team_id;

  RETURN jsonb_build_object('ok', true, 'room_type', v_room_type);
END;
$$;

-- 6. Récupérer les indices pour une équipe (3 colonnes)
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
DECLARE
  v_next_question_hint TEXT;
  v_next_room_hint TEXT;
  v_accumulated_story TEXT;
BEGIN
  -- Hint de la prochaine question (première non-complétée avec indice déverrouillé)
  SELECT hint_text INTO v_next_question_hint
  FROM public.steps s
  INNER JOIN public.question_progress qp ON s.id = qp.question_id
  WHERE qp.team_id = p_team_id
    AND qp.hint_unlocked_at IS NOT NULL
    AND qp.completed_at IS NULL
    AND s.is_active = true
  ORDER BY s.question_order ASC
  LIMIT 1;

  -- Hint de la prochaine salle
  SELECT room_hint INTO v_next_room_hint
  FROM public.rooms r
  LEFT JOIN public.room_progress rp ON r.id = rp.room_id AND rp.team_id = p_team_id
  WHERE rp.unlocked_at IS NULL AND r.is_active = true
  ORDER BY r.room_number ASC
  LIMIT 1;

  -- Accumuler l'histoire
  SELECT string_agg(story_chapter, E'\n\n' ORDER BY chapter_order)
  INTO v_accumulated_story
  FROM public.team_story
  WHERE team_id = p_team_id;

  RETURN QUERY SELECT v_next_question_hint, v_next_room_hint, COALESCE(v_accumulated_story, '');
END;
$$;

-- 7. Soumettre un code pour un événement (EVENT room)
CREATE OR REPLACE FUNCTION public.submit_event_code(
  p_team_id UUID,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_event_story TEXT;
BEGIN
  SELECT id, event_story_chapter INTO v_room_id, v_event_story
  FROM public.rooms
  WHERE unlock_code = upper(trim(p_code)) AND room_type = 'EVENT' AND is_active = true;

  IF v_room_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Code événement invalide');
  END IF;

  -- Marquer la salle comme complétée
  INSERT INTO public.room_progress (team_id, room_id, unlocked_at, completed_at)
  VALUES (p_team_id, v_room_id, now(), now())
  ON CONFLICT (team_id, room_id) DO UPDATE
  SET completed_at = COALESCE(room_progress.completed_at, now()),
      updated_at = now();

  -- Ajouter l'histoire à team_story
  IF v_event_story IS NOT NULL AND v_event_story != '' THEN
    INSERT INTO public.team_story (team_id, room_id, story_chapter, chapter_order)
    SELECT p_team_id, v_room_id, v_event_story, COALESCE(MAX(chapter_order), 0) + 1
    FROM public.team_story
    WHERE team_id = p_team_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'story_chapter', v_event_story,
    'room_id', v_room_id
  );
END;
$$;

-- 8. Finir le jeu
CREATE OR REPLACE FUNCTION public.finish_game_v2(
  p_team_id UUID,
  p_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_rooms INTEGER;
  v_total_points INTEGER;
BEGIN
  -- Vérifier le token
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND token = p_token) THEN
    RETURN jsonb_build_object('error', 'Équipe ou token invalide');
  END IF;

  -- Compter les salles complétées
  SELECT COUNT(*) INTO v_completed_rooms
  FROM public.room_progress
  WHERE team_id = p_team_id AND completed_at IS NOT NULL;

  -- Calculer les points : 100 par salle - 10 par faute
  v_total_points := (v_completed_rooms * 100) - ((
    SELECT COALESCE(SUM(faults), 0) FROM public.question_progress WHERE team_id = p_team_id
  ) * 10);

  -- Mettre à jour
  UPDATE public.teams
  SET finished_at = now(),
      total_points = v_total_points,
      updated_at = now()
  WHERE id = p_team_id AND finished_at IS NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'final_points', v_total_points,
    'completed_rooms', v_completed_rooms
  );
END;
$$;

-- ============================================================================
-- REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.question_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_story;

-- ============================================================================
-- SEED INITIAL : 12 Rooms
-- ============================================================================
INSERT INTO public.rooms (room_number, room_type, title, description, unlock_code, room_hint, is_active) VALUES
(1, 'QUESTION', 'Salle 1 - Accueil', 'La salle d''accueil CDHV', 'SALLE01', 'Cherchez dans l''entrée principale', true),
(2, 'QUESTION', 'Salle 2 - Bureau', 'Le bureau privé', 'SALLE02', 'Cherchez à gauche au 1er étage', true),
(3, 'QUESTION', 'Salle 3 - Réunion', 'La salle de réunion principale', 'SALLE03', 'Au cœur du bâtiment', true),
(4, 'EVENT', 'Événement 1 - Cérémonie', 'Premier événement narratif', 'EVENT01', 'Un moment spécial vous attend', true),
(5, 'QUESTION', 'Salle 5 - Laboratoire', 'Le laboratoire de recherche', 'SALLE05', 'À l''étage -1', true),
(6, 'QUESTION', 'Salle 6 - Bibliothèque', 'La bibliothèque interne', 'SALLE06', 'Montez à l''étage 2', true),
(7, 'QUESTION', 'Salle 7 - Serveurs', 'Salle informatique', 'SALLE07', 'Dans les sous-sols', true),
(8, 'EVENT', 'Événement 2 - Révélation', 'Deuxième événement narratif', 'EVENT02', 'Un secret se dévoile', true),
(9, 'QUESTION', 'Salle 9 - Archives', 'Les archives historiques', 'SALLE09', 'Dans le grenier du bâtiment', true),
(10, 'QUESTION', 'Salle 10 - Rooftop', 'Le toit du bâtiment', 'SALLE10', 'Montez au sommet', true),
(11, 'QUESTION', 'Salle 11 - Trésor', 'La chambre au trésor', 'SALLE11', 'Derrière la porte dorée', true),
(12, 'EVENT', 'Événement 3 - Finale', 'Événement final', 'EVENT03', 'L''aventure se termine', true);
