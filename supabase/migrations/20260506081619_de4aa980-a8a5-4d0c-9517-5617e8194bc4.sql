-- Permettre la mise à jour des joueurs (édition nom/prénom)
CREATE POLICY "players_update_public" ON public.players
  FOR UPDATE USING (true) WITH CHECK (true);

-- Permettre la suppression
CREATE POLICY "teams_delete_public" ON public.teams
  FOR DELETE USING (true);

CREATE POLICY "players_delete_public" ON public.players
  FOR DELETE USING (true);

CREATE POLICY "progress_delete_public" ON public.team_progress
  FOR DELETE USING (true);

-- Fonction qui supprime une équipe et tout ce qui lui est rattaché
CREATE OR REPLACE FUNCTION public.delete_team(p_team_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.team_progress WHERE team_id = p_team_id;
  DELETE FROM public.players WHERE team_id = p_team_id;
  DELETE FROM public.teams WHERE id = p_team_id;
END;
$$;