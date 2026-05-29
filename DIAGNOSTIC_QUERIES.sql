-- ============================================================================
-- DIAGNOSTIC SUPABASE - Vérification Complète du Système Admin
-- ============================================================================
-- Exécutez ces requêtes dans Supabase SQL Editor
-- Date: 27/05/2026

-- ============================================================================
-- PHASE 1: VÉRIFICATION DE LA STRUCTURE
-- ============================================================================

-- 1. Vérifier que toutes les tables existent
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admins', 'teams', 'team_members', 'rooms', 'answers', 'attempt_log', 'team_hints', 'admin_teams')
ORDER BY table_name;

-- 2. Vérifier que les RPC functions existent
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('admin_login', 'create_team_with_members', 'validate_answer', 'get_team_progress', 'get_leaderboard', 'get_attempt_history')
ORDER BY routine_name;

-- ============================================================================
-- PHASE 2: VÉRIFICATION DES DONNÉES ADMINS
-- ============================================================================

-- 3. Compter les admins
SELECT COUNT(*) as nombre_admins FROM public.admins;

-- 4. Voir tous les admins (ATTENTION: contient les hash)
SELECT 
  id::text,
  username,
  name,
  password_hash,
  created_at
FROM public.admins
ORDER BY username;

-- 5. Vérifier les hash MD5 des mots de passe
SELECT 
  username,
  name,
  password_hash as stored_hash,
  CASE 
    WHEN username = 'admin1' THEN md5('cdhv-admin-2026-secure-1')
    WHEN username = 'admin2' THEN md5('cdhv-admin-2026-secure-2')
    WHEN username = 'admin3' THEN md5('cdhv-admin-2026-secure-3')
    WHEN username = 'admin4' THEN md5('cdhv-admin-2026-secure-4')
  END as expected_hash,
  CASE 
    WHEN username = 'admin1' THEN password_hash = md5('cdhv-admin-2026-secure-1')
    WHEN username = 'admin2' THEN password_hash = md5('cdhv-admin-2026-secure-2')
    WHEN username = 'admin3' THEN password_hash = md5('cdhv-admin-2026-secure-3')
    WHEN username = 'admin4' THEN password_hash = md5('cdhv-admin-2026-secure-4')
  END as hash_valid
FROM public.admins
ORDER BY username;

-- ============================================================================
-- PHASE 3: VÉRIFICATION DES DONNÉES ÉQUIPES ET SALLES
-- ============================================================================

-- 6. Compter les équipes
SELECT COUNT(*) as nombre_equipes FROM public.teams;

-- 7. Compter les salles
SELECT COUNT(*) as nombre_salles FROM public.rooms;

-- 8. Vérifier les salles
SELECT room_number, room_type, title, unlock_code FROM public.rooms ORDER BY room_number;

-- 9. Compter les réponses
SELECT COUNT(*) as nombre_reponses FROM public.answers;

-- ============================================================================
-- PHASE 4: TEST DES RPC FUNCTIONS
-- ============================================================================

-- 10. Tester admin_login avec admin1
-- Cette requête doit retourner une ligne, sinon le mot de passe est invalide
SELECT * FROM public.admin_login('admin1', 'cdhv-admin-2026-secure-1');

-- 11. Tester admin_login avec admin2
SELECT * FROM public.admin_login('admin2', 'cdhv-admin-2026-secure-2');

-- 12. Tester admin_login avec admin3
SELECT * FROM public.admin_login('admin3', 'cdhv-admin-2026-secure-3');

-- 13. Tester admin_login avec admin4
SELECT * FROM public.admin_login('admin4', 'cdhv-admin-2026-secure-4');

-- 14. Tester admin_login avec mauvais mot de passe (doit retourner erreur)
SELECT * FROM public.admin_login('admin1', 'mauvais_mot_de_passe');

-- 15. Tester get_leaderboard
SELECT * FROM public.get_leaderboard();

-- ============================================================================
-- PHASE 5: RÉSUMÉ DES RÉSULTATS
-- ============================================================================

-- 16. Résumé global
SELECT 
  (SELECT COUNT(*) FROM public.admins) as total_admins,
  (SELECT COUNT(*) FROM public.teams) as total_teams,
  (SELECT COUNT(*) FROM public.rooms) as total_rooms,
  (SELECT COUNT(*) FROM public.answers) as total_answers,
  (SELECT COUNT(*) FROM public.team_members) as total_members,
  (SELECT COUNT(*) FROM public.attempt_log) as total_attempts;

-- ============================================================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================================================
/*
RÉSULTATS ATTENDUS:

Requête 1-2: Toutes les tables et RPC functions doivent exister
- 8 tables: admins, teams, team_members, rooms, answers, attempt_log, team_hints, admin_teams
- 6 functions: admin_login, create_team_with_members, validate_answer, get_team_progress, get_leaderboard, get_attempt_history

Requête 3: Nombre d'admins = 4

Requête 4: 4 lignes avec admins 1-4 et leurs hash

Requête 5: Tous les hash_valid doivent être TRUE
- Si FALSE: Le mot de passe stocké en BDD est différent du mot de passe entré

Requête 8: 12 salles (9 QUESTION + 3 EVENT)

Requête 10-13: Chaque requête doit retourner une ligne avec (admin_id, username, name)
- Si erreur: "Invalid credentials" = le mot de passe est incorrect

Requête 14: Doit retourner une erreur "Invalid credentials"

Requête 16: 
- 4 admins
- 4 teams (ou plus si créées)
- 12 rooms
- 12 answers
*/
