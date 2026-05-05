
-- Fonction : reconnexion d'une équipe par son nom
CREATE OR REPLACE FUNCTION public.find_team_by_name(p_name text)
RETURNS TABLE(id uuid, name text, token uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name, token FROM public.teams
  WHERE lower(trim(name)) = lower(trim(p_name))
  LIMIT 1;
$$;

-- Fonction : valider une sous-question d'une étape composée
-- Comptabilise une faute si mauvais, mais retourne TOUJOURS la bonne réponse + indice
CREATE OR REPLACE FUNCTION public.validate_substep(
  p_team_id uuid,
  p_step_id uuid,
  p_sub_index int,
  p_answer text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  IF NOT v_correct THEN
    -- Incrémenter total_faults de l'équipe
    UPDATE public.teams SET total_faults = total_faults + 1 WHERE id = p_team_id;
  END IF;

  RETURN jsonb_build_object(
    'correct', v_correct,
    'expected', v_expected,
    'hint', v_sub->>'hint'
  );
END;
$$;

-- Fonction : terminer une étape composée (débloque l'indice de salle suivante)
CREATE OR REPLACE FUNCTION public.complete_composite_step(p_team_id uuid, p_step_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_step_order integer;
  v_hint text;
BEGIN
  SELECT step_order, hint INTO v_step_order, v_hint
  FROM public.steps WHERE id = p_step_id;

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

-- Seed : nettoyage et 20 étapes placeholder
DELETE FROM public.team_progress;
DELETE FROM public.steps;

INSERT INTO public.steps (step_order, type, unlock_code, title, content, expected_answer, hint) VALUES
(1, 'enigme', 'CDHV01', 'Énigme 1 — Placeholder',
  '{"riddle":"Énigme placeholder n°1. Devinez le mot caché."}'::jsonb,
  'reponse1', 'Indice menant au code CDHV02'),
(2, 'question', 'CDHV02', 'Question 2 — Placeholder',
  '{"question":"Question placeholder n°2 sur l''entreprise."}'::jsonb,
  'reponse2', 'Indice menant au code CDHV03'),
(3, 'physique', 'CDHV03', 'Action physique 3 — Placeholder',
  '{"instruction":"Allez au [LIEU] et trouvez le code inscrit sur [OBJET]."}'::jsonb,
  'reponse3', 'Indice menant au code CDHV04'),
(4, 'composee', 'CDHV04', 'Étape composée 4 — Placeholder',
  '{"intro":"Résolvez ces 3 mini-épreuves pour avancer.","subs":[
    {"kind":"quiz","question":"Sous-question quiz n°1 ?","options":["A","B","C","D"],"answer":"A","hint":"Indice quiz 1"},
    {"kind":"input","question":"Sous-question texte n°2 ?","answer":"placeholder","hint":"Indice texte 2"},
    {"kind":"enigme","question":"Sous-énigme n°3 ?","answer":"enigme3","hint":"Indice énigme 3"}
  ]}'::jsonb,
  NULL, 'Indice menant au code CDHV05'),
(5, 'salle', 'CDHV05', 'Accès salle 5 — Placeholder',
  '{"message":"Vous pouvez accéder à la [SALLE 5]."}'::jsonb,
  NULL, 'Indice menant au code CDHV06'),
(6, 'enigme', 'CDHV06', 'Énigme 6 — Placeholder',
  '{"riddle":"Énigme placeholder n°6."}'::jsonb,
  'reponse6', 'Indice menant au code CDHV07'),
(7, 'composee', 'CDHV07', 'Étape composée 7 — Placeholder',
  '{"intro":"5 mini-épreuves vous attendent.","subs":[
    {"kind":"quiz","question":"Quiz 1 étape 7 ?","options":["A","B","C","D"],"answer":"B","hint":"Indice 7.1"},
    {"kind":"quiz","question":"Quiz 2 étape 7 ?","options":["A","B","C","D"],"answer":"C","hint":"Indice 7.2"},
    {"kind":"input","question":"Texte 3 étape 7 ?","answer":"reponse73","hint":"Indice 7.3"},
    {"kind":"enigme","question":"Énigme 4 étape 7 ?","answer":"reponse74","hint":"Indice 7.4"},
    {"kind":"input","question":"Texte 5 étape 7 ?","answer":"reponse75","hint":"Indice 7.5"}
  ]}'::jsonb,
  NULL, 'Indice menant au code CDHV08'),
(8, 'physique', 'CDHV08', 'Action physique 8 — Placeholder',
  '{"instruction":"Rendez-vous à [LIEU 8] et trouvez la réponse cachée."}'::jsonb,
  'reponse8', 'Indice menant au code CDHV09'),
(9, 'question', 'CDHV09', 'Question 9 — Placeholder',
  '{"question":"Question placeholder n°9."}'::jsonb,
  'reponse9', 'Indice menant au code CDHV10'),
(10, 'composee', 'CDHV10', 'Étape composée 10 — Placeholder',
  '{"intro":"4 défis à enchaîner.","subs":[
    {"kind":"quiz","question":"Quiz 10.1 ?","options":["A","B","C","D"],"answer":"D","hint":"Indice 10.1"},
    {"kind":"input","question":"Texte 10.2 ?","answer":"reponse102","hint":"Indice 10.2"},
    {"kind":"enigme","question":"Énigme 10.3 ?","answer":"reponse103","hint":"Indice 10.3"},
    {"kind":"quiz","question":"Quiz 10.4 ?","options":["A","B","C","D"],"answer":"A","hint":"Indice 10.4"}
  ]}'::jsonb,
  NULL, 'Indice menant au code CDHV11'),
(11, 'salle', 'CDHV11', 'Accès salle 11 — Placeholder',
  '{"message":"Vous pouvez accéder à la [SALLE 11]."}'::jsonb,
  NULL, 'Indice menant au code CDHV12'),
(12, 'enigme', 'CDHV12', 'Énigme 12 — Placeholder',
  '{"riddle":"Énigme placeholder n°12."}'::jsonb,
  'reponse12', 'Indice menant au code CDHV13'),
(13, 'physique', 'CDHV13', 'Action physique 13 — Placeholder',
  '{"instruction":"Allez à [LIEU 13] et notez la réponse trouvée."}'::jsonb,
  'reponse13', 'Indice menant au code CDHV14'),
(14, 'question', 'CDHV14', 'Question 14 — Placeholder',
  '{"question":"Question placeholder n°14."}'::jsonb,
  'reponse14', 'Indice menant au code CDHV15'),
(15, 'composee', 'CDHV15', 'Étape composée 15 — Placeholder',
  '{"intro":"3 énigmes à résoudre ensemble.","subs":[
    {"kind":"enigme","question":"Énigme 15.1 ?","answer":"reponse151","hint":"Indice 15.1"},
    {"kind":"input","question":"Texte 15.2 ?","answer":"reponse152","hint":"Indice 15.2"},
    {"kind":"quiz","question":"Quiz 15.3 ?","options":["A","B","C","D"],"answer":"B","hint":"Indice 15.3"}
  ]}'::jsonb,
  NULL, 'Indice menant au code CDHV16'),
(16, 'salle', 'CDHV16', 'Accès salle 16 — Placeholder',
  '{"message":"Vous pouvez accéder à la [SALLE 16]."}'::jsonb,
  NULL, 'Indice menant au code CDHV17'),
(17, 'physique', 'CDHV17', 'Action physique 17 — Placeholder',
  '{"instruction":"Trouvez l''indice caché à [LIEU 17]."}'::jsonb,
  'reponse17', 'Indice menant au code CDHV18'),
(18, 'enigme', 'CDHV18', 'Énigme 18 — Placeholder',
  '{"riddle":"Énigme placeholder n°18."}'::jsonb,
  'reponse18', 'Indice menant au code CDHV19'),
(19, 'composee', 'CDHV19', 'Étape composée 19 — Placeholder',
  '{"intro":"Dernier marathon : 6 mini-épreuves.","subs":[
    {"kind":"quiz","question":"Quiz 19.1 ?","options":["A","B","C","D"],"answer":"A","hint":"Indice 19.1"},
    {"kind":"input","question":"Texte 19.2 ?","answer":"reponse192","hint":"Indice 19.2"},
    {"kind":"enigme","question":"Énigme 19.3 ?","answer":"reponse193","hint":"Indice 19.3"},
    {"kind":"quiz","question":"Quiz 19.4 ?","options":["A","B","C","D"],"answer":"C","hint":"Indice 19.4"},
    {"kind":"input","question":"Texte 19.5 ?","answer":"reponse195","hint":"Indice 19.5"},
    {"kind":"enigme","question":"Énigme 19.6 ?","answer":"reponse196","hint":"Indice 19.6"}
  ]}'::jsonb,
  NULL, 'Indice menant au code CDHV20'),
(20, 'question', 'CDHV20', 'Question finale 20 — Placeholder',
  '{"question":"Dernière question placeholder n°20."}'::jsonb,
  'reponse20', 'Bravo, vous avez terminé !');
