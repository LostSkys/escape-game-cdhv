-- Enum types
CREATE TYPE public.step_type AS ENUM ('question', 'enigme', 'minijeu', 'salle');

-- Teams
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 1,
  total_faults INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Players
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_team ON public.players(team_id);

-- Trigger : max 10 joueurs par équipe
CREATE OR REPLACE FUNCTION public.check_player_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.players WHERE team_id = NEW.team_id) >= 10 THEN
    RAISE EXCEPTION 'Une équipe ne peut pas avoir plus de 10 joueurs';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_player_limit
BEFORE INSERT ON public.players
FOR EACH ROW EXECUTE FUNCTION public.check_player_limit();

-- Steps
CREATE TABLE public.steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_order INTEGER NOT NULL UNIQUE,
  unlock_code TEXT NOT NULL UNIQUE,
  type public.step_type NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_answer TEXT,
  hint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team progress
CREATE TABLE public.team_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  faults INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, step_id)
);

CREATE INDEX idx_progress_team ON public.team_progress(team_id);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_progress ENABLE ROW LEVEL SECURITY;

-- Policies teams : lecture publique (sauf token), insert public
CREATE POLICY "teams_select_public" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert_public" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "teams_update_public" ON public.teams FOR UPDATE USING (true);

-- Policies players : lecture/insert public
CREATE POLICY "players_select_public" ON public.players FOR SELECT USING (true);
CREATE POLICY "players_insert_public" ON public.players FOR INSERT WITH CHECK (true);

-- Policies steps : PAS de lecture publique (les réponses doivent rester secrètes)
-- L'accès se fera via une fonction RPC sécurisée
-- (aucune policy = aucun accès en mode anon)

-- Policies team_progress : lecture/insert/update public
CREATE POLICY "progress_select_public" ON public.team_progress FOR SELECT USING (true);
CREATE POLICY "progress_insert_public" ON public.team_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "progress_update_public" ON public.team_progress FOR UPDATE USING (true);

-- Fonction RPC : récupérer une étape par son code (sans la réponse)
CREATE OR REPLACE FUNCTION public.get_step_by_code(p_code TEXT)
RETURNS TABLE (
  id UUID,
  step_order INTEGER,
  type public.step_type,
  title TEXT,
  content JSONB,
  hint TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, step_order, type, title, content, hint
  FROM public.steps
  WHERE unlock_code = upper(trim(p_code));
$$;

-- Fonction RPC : valider une réponse (renvoie correct + indice toujours)
CREATE OR REPLACE FUNCTION public.validate_step_answer(
  p_team_id UUID,
  p_step_id UUID,
  p_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected TEXT;
  v_hint TEXT;
  v_step_order INTEGER;
  v_correct BOOLEAN;
  v_progress_id UUID;
BEGIN
  SELECT expected_answer, hint, step_order
  INTO v_expected, v_hint, v_step_order
  FROM public.steps WHERE id = p_step_id;

  IF v_expected IS NULL THEN
    RETURN jsonb_build_object('error', 'Étape introuvable');
  END IF;

  v_correct := lower(trim(p_answer)) = lower(trim(v_expected));

  -- Upsert progress
  INSERT INTO public.team_progress (team_id, step_id, step_order, faults, completed_at)
  VALUES (
    p_team_id, p_step_id, v_step_order,
    CASE WHEN v_correct THEN 0 ELSE 1 END,
    CASE WHEN v_correct THEN now() ELSE NULL END
  )
  ON CONFLICT (team_id, step_id) DO UPDATE
  SET faults = team_progress.faults + CASE WHEN v_correct THEN 0 ELSE 1 END,
      completed_at = CASE WHEN v_correct AND team_progress.completed_at IS NULL THEN now() ELSE team_progress.completed_at END
  RETURNING id INTO v_progress_id;

  -- Mettre à jour le total fautes et current_step de l'équipe
  IF v_correct THEN
    UPDATE public.teams
    SET current_step = GREATEST(current_step, v_step_order + 1)
    WHERE id = p_team_id;
  END IF;

  UPDATE public.teams
  SET total_faults = (SELECT COALESCE(SUM(faults), 0) FROM public.team_progress WHERE team_id = p_team_id)
  WHERE id = p_team_id;

  RETURN jsonb_build_object(
    'correct', v_correct,
    'hint', v_hint
  );
END;
$$;

-- Fonction RPC : marquer étape (salle) comme complétée (pas de réponse à valider)
CREATE OR REPLACE FUNCTION public.complete_room_step(
  p_team_id UUID,
  p_step_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SET current_step = GREATEST(current_step, v_step_order + 1)
  WHERE id = p_team_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Fonction RPC : terminer le jeu
CREATE OR REPLACE FUNCTION public.finish_game(p_team_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.teams SET finished_at = now() WHERE id = p_team_id AND finished_at IS NULL;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_progress;

-- Seed des étapes d'exemple
INSERT INTO public.steps (step_order, unlock_code, type, title, content, expected_answer, hint) VALUES
(1, 'CDHV01', 'question', 'L''histoire de la CDHV',
 '{"question": "En quelle année la CDHV a-t-elle été fondée ?"}'::jsonb,
 '1985',
 'Cherchez la plaque commémorative à l''entrée principale.'),
(2, 'CDHV02', 'salle', 'Accès à la salle de pause',
 '{"message": "Bravo ! Vous pouvez maintenant accéder à la salle de pause du 1er étage. Demandez à l''hôte sur place le code suivant."}'::jsonb,
 NULL,
 'La salle de pause se trouve à droite des escaliers du 1er étage.'),
(3, 'CDHV03', 'enigme', 'L''énigme du bâtiment',
 '{"riddle": "Je suis présent à chaque étage, je relie le haut et le bas, sans moi vous monterez à pied. Qui suis-je ?"}'::jsonb,
 'ascenseur',
 'Pensez vertical.'),
(4, 'CDHV04', 'minijeu', 'Quiz éclair CDHV',
 '{"questions": [
    {"q": "Combien d''étages compte le nouveau bâtiment ?", "options": ["3", "4", "5", "6"], "answer": "5"},
    {"q": "Quelle est la couleur dominante de la charte CDHV ?", "options": ["Bleu", "Vert", "Rouge", "Orange"], "answer": "Bleu"},
    {"q": "Combien de salles de réunion au total ?", "options": ["8", "10", "12", "15"], "answer": "12"}
  ]}'::jsonb,
 'gagne',
 'Répondez correctement à toutes les questions pour valider.'),
(5, 'CDHV05', 'question', 'Les valeurs de l''entreprise',
 '{"question": "Quelle est la première valeur affichée dans le hall d''entrée ?"}'::jsonb,
 'innovation',
 'Levez les yeux en entrant dans le hall.'),
(6, 'CDHV06', 'salle', 'Accès au rooftop',
 '{"message": "Félicitations ! Rendez-vous sur le rooftop pour la dernière étape. Profitez de la vue !"}'::jsonb,
 NULL,
 'Empruntez l''ascenseur jusqu''au dernier étage.'),
(7, 'CDHV07', 'enigme', 'L''énigme finale',
 '{"riddle": "Plus on en a, plus on en partage. Qu''est-ce que c''est ?"}'::jsonb,
 'sourire',
 'C''est la signature de l''accueil CDHV.');