-- ============================================================================
-- SEED QUESTIONS - 27 Questions pour l'Escape Game
-- Structure: 22 questions utilisées, 5 en réserve
-- Rooms: 9 QUESTION salles avec 2-3 questions chacune
-- ============================================================================

-- ============================================================================
-- SALLE 1 - Accueil (3 questions -> Code: SALLE02)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  1, 'Q1-SALLE01-A', r.id, 1, 'question', 'Année de fondation',
  '{"question": "En quelle année la CDHV a-t-elle été fondée ?"}'::jsonb,
  '1985', 'Cherchez sur la plaque d''entrée', 'Allez chercher dans les archives', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 1;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  2, 'Q1-SALLE01-B', r.id, 2, 'question', 'Couleur charte',
  '{"question": "Quelle est la couleur dominante de la charte CDHV ?"}'::jsonb,
  'bleu', 'Regardez le logo en entrant', 'Cherchez les murs aux étages', 'LE0',
  true
FROM public.rooms r WHERE r.room_number = 1;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  3, 'Q1-SALLE01-C', r.id, 3, 'question', 'Nombre de bureaux',
  '{"question": "Combien de bureaux au rez-de-chaussée ?"}'::jsonb,
  '12', 'Comptez les portes', 'Descendez à l''étage suivant', '2',
  true
FROM public.rooms r WHERE r.room_number = 1;

-- ============================================================================
-- SALLE 2 - Bureau (2 questions -> Code: SALLE03)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  4, 'Q2-SALLE02-A', r.id, 1, 'question', 'Directeur fondateur',
  '{"question": "Quel est le nom du directeur fondateur ?"}'::jsonb,
  'durand', 'Regardez le portrait au mur', 'Montez à l''étage de réunion', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 2;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  5, 'Q2-SALLE02-B', r.id, 2, 'question', 'Années activités',
  '{"question": "Depuis combien d''années l''entreprise est-elle active ?"}'::jsonb,
  '39', 'Faites 2026 - 1985', 'Allez chercher les énigmes', 'LE03',
  true
FROM public.rooms r WHERE r.room_number = 2;

-- ============================================================================
-- SALLE 3 - Réunion (3 questions -> Code: EVENT01)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  6, 'Q3-SALLE03-A', r.id, 1, 'question', 'Sièges table réunion',
  '{"question": "Combien de sièges autour de la grande table ?"}'::jsonb,
  '16', 'Comptez bien chaque côté', 'Continuez vers l''événement', 'EVE',
  true
FROM public.rooms r WHERE r.room_number = 3;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  7, 'Q3-SALLE03-B', r.id, 2, 'question', 'Nombre d''étages',
  '{"question": "Combien d''étages compte le bâtiment ?"}'::jsonb,
  '5', 'Demandez à la réception', 'Cherchez l''indice suivant', 'NT0',
  true
FROM public.rooms r WHERE r.room_number = 3;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  8, 'Q3-SALLE03-C', r.id, 3, 'question', 'Étage du restaurant',
  '{"question": "À quel étage se trouve le restaurant ?"}'::jsonb,
  '3', 'C''est où on mange au travail', 'L''événement vous attend', '1',
  true
FROM public.rooms r WHERE r.room_number = 3;

-- ============================================================================
-- SALLE 5 - Laboratoire (2 questions -> Code: SALLE06)
-- ============================================================================
-- (EVENT01 passée en salle 4)
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  9, 'Q5-SALLE05-A', r.id, 1, 'question', 'Année dernière rénovation',
  '{"question": "Quelle année le labo a-t-il été rénové ?"}'::jsonb,
  '2020', 'Cherchez la date sur la porte', 'Montez à la bibliothèque', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 5;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  10, 'Q5-SALLE05-B', r.id, 2, 'question', 'Nombre d''équipements',
  '{"question": "Combien d''appareils de mesure dans le labo ?"}'::jsonb,
  '47', 'Comptez les armoires scientifiques', 'Cherchez les livres', 'LE06',
  true
FROM public.rooms r WHERE r.room_number = 5;

-- ============================================================================
-- SALLE 6 - Bibliothèque (3 questions -> Code: SALLE07)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  11, 'Q6-SALLE06-A', r.id, 1, 'question', 'Nombre de rayons',
  '{"question": "Combien de rayons de livres ?"}'::jsonb,
  '34', 'Faites le tour rapidement', 'Cherchez les serveurs', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 6;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  12, 'Q6-SALLE06-B', r.id, 2, 'question', 'Titre livre fondation',
  '{"question": "Quel est le titre du livre sur la fondation ?"}'::jsonb,
  'genese', 'Premier rayon, en haut', 'Descendez au sous-sol', 'LE0',
  true
FROM public.rooms r WHERE r.room_number = 6;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  13, 'Q6-SALLE06-C', r.id, 3, 'question', 'Année publication référence',
  '{"question": "Année de la publication référence ?"}'::jsonb,
  '1998', 'Cherchez sur le dos du livre', 'Les serveurs vous attendent', '7',
  true
FROM public.rooms r WHERE r.room_number = 6;

-- ============================================================================
-- SALLE 7 - Serveurs (2 questions -> Code: SALLE09)
-- ============================================================================
-- (SALLE08 va être l'EVENT02)
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  14, 'Q7-SALLE07-A', r.id, 1, 'question', 'Processeur principal',
  '{"question": "Quelle est la marque du processeur principal ?"}'::jsonb,
  'intel', 'Regardez le boîtier du serveur', 'Cherchez les archives', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 7;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  15, 'Q7-SALLE07-B', r.id, 2, 'question', 'Capacité totale stockage',
  '{"question": "Capacité totale de stockage en TO ?"}'::jsonb,
  '500', 'Additionnez les disques durs', 'Les archives vous attendent', 'LE09',
  true
FROM public.rooms r WHERE r.room_number = 7;

-- ============================================================================
-- SALLE 9 - Archives (3 questions -> Code: SALLE10)
-- ============================================================================
-- (SALLE08 = EVENT02)
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  16, 'Q9-SALLE09-A', r.id, 1, 'question', 'Nombre de cartons',
  '{"question": "Combien de cartons archivés ?"}'::jsonb,
  '287', 'Comptez par rangée', 'Cherchez au rooftop', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 9;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  17, 'Q9-SALLE09-B', r.id, 2, 'question', 'Année plus anciens documents',
  '{"question": "Quelle année pour le plus ancien document ?"}'::jsonb,
  '1972', 'Regardez le premier carton', 'Montez plus haut', 'LE10',
  true
FROM public.rooms r WHERE r.room_number = 9;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  18, 'Q9-SALLE09-C', r.id, 3, 'question', 'Nombre de classeurs',
  '{"question": "Combien de classeurs métalliques ?"}'::jsonb,
  '42', 'Ils sont contre les murs', 'Le trésor vous appelle', '3',
  true
FROM public.rooms r WHERE r.room_number = 9;

-- ============================================================================
-- SALLE 10 - Rooftop (2 questions -> Code: SALLE11)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  19, 'Q10-SALLE10-A', r.id, 1, 'question', 'Nombre de panneaux solaires',
  '{"question": "Combien de panneaux solaires ?"}'::jsonb,
  '156', 'Regardez vers le ciel', 'Cherchez le trésor', 'SAL',
  true
FROM public.rooms r WHERE r.room_number = 10;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  20, 'Q10-SALLE10-B', r.id, 2, 'question', 'Hauteur du rooftop',
  '{"question": "Hauteur approximative du toit en mètres ?"}'::jsonb,
  '25', 'Regardez sur le plan du bâtiment', 'Le trésor final vous attend', 'LE11',
  true
FROM public.rooms r WHERE r.room_number = 10;

-- ============================================================================
-- SALLE 11 - Trésor (3 questions -> Code: EVENT03)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  21, 'Q11-SALLE11-A', r.id, 1, 'question', 'Objet précieux 1',
  '{"question": "Quel est le premier objet dans le coffre ?"}'::jsonb,
  'medaille', 'Regardez le piédestal doré', 'Continuez votre quête', 'EVE',
  true
FROM public.rooms r WHERE r.room_number = 11;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  22, 'Q11-SALLE11-B', r.id, 2, 'question', 'Clé chiffre',
  '{"question": "Quel chiffre sur la clé d''or ?"}'::jsonb,
  '777', 'Gravé sur le métal', 'Cherchez l''issue finale', 'NT0',
  true
FROM public.rooms r WHERE r.room_number = 11;

INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
SELECT 
  23, 'Q11-SALLE11-C', r.id, 3, 'question', 'Date trésor',
  '{"question": "Quelle date est gravée sur le coffre ?"}'::jsonb,
  '1985', 'Regardez l''intérieur du couvercle', 'C''est la fin qui vous attend', '3',
  true
FROM public.rooms r WHERE r.room_number = 11;

-- ============================================================================
-- QUESTIONS DE RÉSERVE (inutilisées, restent dans la BDD)
-- ============================================================================
INSERT INTO public.steps (
  step_order, unlock_code, room_id, question_order, type, title, content, 
  expected_answer, hint_text, next_question_hint, code_part, is_active
) 
VALUES
  (24, 'Q-RESERVE-1', NULL, NULL, 'question', 'Question de réserve 1',
   '{"question": "Question de réserve 1"}'::jsonb,
   'reponse1', 'Indice 1', 'Prochain indice', 'RES', false),
  (25, 'Q-RESERVE-2', NULL, NULL, 'question', 'Question de réserve 2',
   '{"question": "Question de réserve 2"}'::jsonb,
   'reponse2', 'Indice 2', 'Prochain indice', 'ERV', false),
  (26, 'Q-RESERVE-3', NULL, NULL, 'question', 'Question de réserve 3',
   '{"question": "Question de réserve 3"}'::jsonb,
   'reponse3', 'Indice 3', 'Prochain indice', 'ER1', false),
  (27, 'Q-RESERVE-4', NULL, NULL, 'question', 'Question de réserve 4',
   '{"question": "Question de réserve 4"}'::jsonb,
   'reponse4', 'Indice 4', 'Prochain indice', 'VE2', false),
  (28, 'Q-RESERVE-5', NULL, NULL, 'question', 'Question de réserve 5',
   '{"question": "Question de réserve 5"}'::jsonb,
   'reponse5', 'Indice 5', 'Prochain indice', 'RV3', false);

-- ============================================================================
-- Update ROOMS avec event_story_chapter pour les salles EVENT
-- ============================================================================
UPDATE public.rooms SET 
  event_story_chapter = 'Une cérémonie solennelle se déroule. Les participants vous remetent le premier fragment de l''histoire : "Dans les murs anciens reposait un secret..."'
WHERE room_number = 4;

UPDATE public.rooms SET 
  event_story_chapter = 'Un moment mystérieux révèle une nouvelle vérité : "Le cofondateur avait caché des indices à travers les étages de son œuvre."'
WHERE room_number = 8;

UPDATE public.rooms SET 
  event_story_chapter = 'L''énigme finale se résout : "Le vrai trésor n''était pas l''or, mais le voyage et la connaissance acquise. Bravo à vous !"'
WHERE room_number = 12;
