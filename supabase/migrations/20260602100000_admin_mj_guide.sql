-- ============================================================================
-- RPC: admin_get_mj_guide
-- Renvoie au MJ (organisateur) la liste de toutes les salles avec leurs
-- questions (énoncé + réponse attendue + code) et leurs événements,
-- afin qu'il puisse vérifier les réponses données par les équipes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_mj_guide(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rooms jsonb;
BEGIN
  PERFORM public._check_admin(p_password);

  SELECT jsonb_agg(room ORDER BY (room->>'room_number')::int)
  INTO v_rooms
  FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'room_number', r.room_number,
      'room_type', r.room_type,
      'title', r.title,
      'unlock_code', r.unlock_code,
      'event_story_chapter', r.event_story_chapter,
      'room_hint', r.room_hint,
      'questions', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', s.id,
          'question_order', s.question_order,
          'prompt', s.prompt,
          'expected_answer', s.expected_answer,
          'code_part', s.code_part,
          'unlock_code', s.unlock_code,
          'hint_text', s.hint_text
        ) ORDER BY s.question_order)
        FROM public.steps s
        WHERE s.room_id = r.id AND s.is_active = true
      ), '[]'::jsonb)
    ) AS room
    FROM public.rooms r
    WHERE r.is_active = true
  ) sub;

  RETURN COALESCE(v_rooms, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_mj_guide(text) TO anon, authenticated, service_role;
