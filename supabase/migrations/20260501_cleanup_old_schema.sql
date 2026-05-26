-- ============================================================================
-- CLEANUP OLD SCHEMA
-- Date: 2026-05-26
-- Drop all old tables to prepare for new admin escape game architecture
-- MUST RUN FIRST (timestamp 20260501 ensures it runs before other migrations)
-- ============================================================================

DROP TABLE IF EXISTS public.team_story CASCADE;
DROP TABLE IF EXISTS public.room_progress CASCADE;
DROP TABLE IF EXISTS public.question_progress CASCADE;
DROP TABLE IF EXISTS public.team_progress CASCADE;
DROP TABLE IF EXISTS public.steps CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS public.get_team_status(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_team_status_v2(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_room_by_code(text);
DROP FUNCTION IF EXISTS public.get_question_by_code(text);
DROP FUNCTION IF EXISTS public.get_room_questions(uuid);
DROP FUNCTION IF EXISTS public.validate_question_answer(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.unlock_room(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_team_hints(uuid);
DROP FUNCTION IF EXISTS public.get_team_accumulated_story(uuid, uuid);
DROP FUNCTION IF EXISTS public.submit_event_code(text, uuid);
DROP FUNCTION IF EXISTS public.finish_game_v2(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_team_progress_detailed(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_team_rooms_progress(uuid, uuid);
DROP FUNCTION IF EXISTS public.check_hint_eligibility(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_room_code_parts(uuid, uuid);
DROP FUNCTION IF EXISTS public.calculate_team_points(uuid);
DROP FUNCTION IF EXISTS public.reset_team_progress(uuid, text);
DROP FUNCTION IF EXISTS public.mark_question_attempted(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.complete_composite_step(uuid, uuid);
DROP FUNCTION IF EXISTS public.complete_room_step(uuid, uuid);
DROP FUNCTION IF EXISTS public.validate_minijeu(uuid, uuid, jsonb, uuid);
DROP FUNCTION IF EXISTS public.validate_step_answer(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.validate_step_answer(uuid, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.validate_substep(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.validate_substep(uuid, uuid, integer, text, uuid);
DROP FUNCTION IF EXISTS public.find_team_by_name(text);
DROP FUNCTION IF EXISTS public.finish_game(uuid);
DROP FUNCTION IF EXISTS public.finish_game(uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_list_teams(text);
DROP FUNCTION IF EXISTS public.admin_list_players(text);
DROP FUNCTION IF EXISTS public.admin_delete_team(text, uuid);
DROP FUNCTION IF EXISTS public.admin_update_team(text, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.admin_check(text);
DROP FUNCTION IF EXISTS public._check_admin(text);
DROP FUNCTION IF EXISTS public._check_team_token(uuid, uuid);

-- Drop old enums
DROP TYPE IF EXISTS public.room_type CASCADE;
DROP TYPE IF EXISTS public.step_type CASCADE;

-- All clean! Ready for new schema.
