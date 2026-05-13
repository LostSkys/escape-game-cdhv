import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Lightbulb, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface HintsTabProps {
  teamId: string;
  teamToken: string;
}

interface HintsData {
  next_question_hint: string | null;
  next_room_hint: string | null;
  accumulated_story: string;
}

interface StoryChapter {
  chapter_order: number;
  story_chapter: string;
  room_number: number | null;
  revealed_at: string;
}

export default function HintsTab({ teamId, teamToken }: HintsTabProps) {
  const [hints, setHints] = useState<HintsData | null>(null);
  const [story, setStory] = useState<StoryChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [nextAutoRefresh, setNextAutoRefresh] = useState<Date | null>(null);

  // Auto-refresh toutes les 5 minutes
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

  const loadHints = async () => {
    setLoading(true);
    try {
      const { data: hintsData, error: hintsError } = await supabase.rpc(
        "get_team_hints",
        { p_team_id: teamId }
      );

      if (hintsError) {
        toast.error("Erreur de chargement des indices");
        return;
      }

      if (hintsData && hintsData.length > 0) {
        setHints(hintsData[0]);
      }

      const { data: storyData, error: storyError } = await supabase.rpc(
        "get_team_accumulated_story",
        { p_team_id: teamId, p_token: teamToken }
      );

      if (storyError) {
        console.error("Erreur story:", storyError);
      } else if (storyData) {
        setStory(storyData as StoryChapter[]);
      }

      setLastRefresh(new Date());
      const nextRefresh = new Date(Date.now() + REFRESH_INTERVAL_MS);
      setNextAutoRefresh(nextRefresh);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHints();

    // Configurer l'auto-refresh
    const interval = setInterval(loadHints, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teamToken]);

  const handleManualRefresh = async () => {
    await loadHints();
    toast.success("Indices actualisés");
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      {/* Contrôles */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Actualisation auto : {nextAutoRefresh ? `à ${formatTime(nextAutoRefresh)}` : "pas encore"}
          <br />
          Dernière : {formatTime(lastRefresh)}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualRefresh}
          disabled={loading}
          className="gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Forcer l'actualisation
        </Button>
      </div>

      {/* Grille 3 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Colonne 1: Indices pour la prochaine question */}
        <div className="card-elegant rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Lightbulb className="h-4 w-4" />
            Prochaine question
          </div>
          {hints?.next_question_hint ? (
            <p className="text-sm text-foreground leading-relaxed">
              {hints.next_question_hint}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Vous avez épuisé vos indices pour cette question ou vous l'avez déjà résolue.
            </p>
          )}
        </div>

        {/* Colonne 2: Indices pour la prochaine salle */}
        <div className="card-elegant rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Lightbulb className="h-4 w-4" />
            Prochaine salle
          </div>
          {hints?.next_room_hint ? (
            <p className="text-sm text-foreground leading-relaxed">
              {hints.next_room_hint}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Vous avez complété toutes les salles !
            </p>
          )}
        </div>

        {/* Colonne 3: Histoire accumulée */}
        <div className="card-elegant rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpen className="h-4 w-4" />
            Histoire
          </div>
          {story && story.length > 0 ? (
            <div className="space-y-2 text-sm">
              {story.map((chapter) => (
                <div key={chapter.chapter_order} className="pb-2 border-b border-border last:border-b-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    Chapitre {chapter.chapter_order} {chapter.room_number && `(Salle ${chapter.room_number})`}
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {chapter.story_chapter}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              L'histoire se révélera progressivement...
            </p>
          )}
        </div>
      </div>

      {/* Info supplémentaire */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
        💡 Les indices se déverrouillent automatiquement après 2 erreurs et se mettent à jour toutes les 5 minutes.
      </div>
    </div>
  );
}
