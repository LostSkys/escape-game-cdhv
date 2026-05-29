-- ============================================================================
-- VERIFICATION QUERIES FOR ADMIN ESCAPE GAME
-- Run these to verify everything is working correctly
-- ============================================================================

-- 1. Check all admins are created
SELECT id, username, name FROM public.admins;

-- 2. Check all 12 rooms are created
SELECT room_number, room_type, title, unlock_code FROM public.rooms ORDER BY room_number;

-- 3. Check answers/hints for each room
SELECT 
  r.room_number,
  r.title,
  a.expected_answers,
  a.hint_piece,
  a.includes_history,
  a.history_piece
FROM public.answers a
JOIN public.rooms r ON a.room_id = r.id
ORDER BY r.room_number;

-- 4. Test admin_login RPC for admin1
SELECT * FROM public.admin_login('admin1', 'cdhv-admin-2026-secure-1');

-- 5. Test admin_login RPC for admin2
SELECT * FROM public.admin_login('admin2', 'cdhv-admin-2026-secure-2');

-- 6. Test admin_login RPC for admin3
SELECT * FROM public.admin_login('admin3', 'cdhv-admin-2026-secure-3');

-- 7. Test admin_login RPC for admin4
SELECT * FROM public.admin_login('admin4', 'cdhv-admin-2026-secure-4');

-- 8. Check RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'admin_login',
    'create_team_with_members',
    'validate_answer',
    'get_team_progress',
    'get_leaderboard',
    'get_admin_team',
    'get_attempt_history'
  )
ORDER BY routine_name;

-- 9. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 10. Table row counts
SELECT 
  (SELECT COUNT(*) FROM public.admins) as admin_count,
  (SELECT COUNT(*) FROM public.rooms) as room_count,
  (SELECT COUNT(*) FROM public.answers) as answer_count,
  (SELECT COUNT(*) FROM public.teams) as team_count,
  (SELECT COUNT(*) FROM public.team_members) as team_member_count,
  (SELECT COUNT(*) FROM public.attempt_log) as attempt_count,
  (SELECT COUNT(*) FROM public.team_hints) as hint_count;

-- ============================================================================
-- END VERIFICATION
-- ============================================================================
