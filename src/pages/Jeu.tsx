import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { teamStorage } from "@/lib/teamStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, LogOut, Trophy, Lightbulb, HelpCircle } from "lucide-react";
import RoomView from "@/components/RoomView";
import HintsTab from "@/components/HintsTab";

type Tab = "questions" | "hints";

const Jeu = () => {
  const navigate = useNavigate();
  const team = teamStorage.get();
  const [code, setCode] = useState("");
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_points: 0,
    total_faults: 0,
    completed_questions: 0,
    completed_rooms: 0,
  });
  const [finished, setFinished] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("questions");

  useEffect(() => {
    if (!team) {
      navigate("/inscription");
      return;
    }
    loadStats();
    checkFinished();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    if (!team) return;
    const { data } = await (supabase.rpc("get_team_status_v2", {
      p_team_id: team.id,
      p_token: team.token,
    }) as any);
    if (data && Array.isArray(data) && data.length > 0) {
      const row = data[0];
      setStats({
        total_points: row.total_points || 0,
        total_faults: row.total_faults || 0,
        completed_questions: row.completed_questions || 0,
        completed_rooms: row.completed_rooms || 0,
      });
    }
  };

  const checkFinished = async () => {
    if (!team) return;
    const { data } = await (supabase.rpc("get_team_status_v2", {
      p_team_id: team.id,
      p_token: team.token,
    }) as any);
    if (data && Array.isArray(data) && data.length > 0 && data[0].finished_at) {
      setFinished(true);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      // Chercher d'abord si c'est une salle
      const { data: roomData, error: roomError } = await (supabase.rpc(
        "get_room_by_code",
        { p_code: code }
      ) as any);

      if (!roomError && roomData && roomData.length > 0) {
        // C'est une salle
        setCurrentRoomCode(code);
        setCode("");
        setActiveTab("questions");
        return;
      }

      // Sinon chercher si c'est une question (anciennement steps)
      const { data: questionData, error: questionError } = await (supabase.rpc(
        "get_question_by_code",
        { p_code: code }
      ) as any);

      if (questionError) {
        toast.error("Erreur de connexion");
        return;
      }

      if (!questionData || !Array.isArray(questionData) || questionData.length === 0) {
        toast.error("Code invalide - Salle ou question introuvable");
        return;
      }

      // Si c'est une question seule, on affiche la salle
      const question = questionData[0];
      if (question.room_id) {
        // Chercher la salle et utiliser son code
        const { data: roomByIdData } = await (supabase
          .from("rooms" as any)
          .select("unlock_code")
          .eq("id", question.room_id)
          .single() as any);

        if (roomByIdData) {
          setCurrentRoomCode(roomByIdData.unlock_code);
          setCode("");
          setActiveTab("questions");
          return;
        }
      }

      toast.error("Question trouvée mais pas de salle associée");
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCompleted = async () => {
    await loadStats();
    setCurrentRoomCode(null);
    toast.success("Salle complétée !");
  };

  const handleFinish = async () => {
    if (!team) return;
    const { data, error } = await (supabase.rpc("finish_game_v2", {
      p_team_id: team.id,
      p_token: team.token,
    }) as any);

    if (error) {
      toast.error("Erreur lors de la finalisation");
      return;
    }

    if (data && Array.isArray(data) && data[0]?.ok) {
      setFinished(true);
      toast.success(`Partie terminée ! 🎉 Score final : ${data[0].final_points} pts`);
    } else if (data && !Array.isArray(data) && data.ok) {
      setFinished(true);
      toast.success(`Partie terminée ! 🎉 Score final : ${data.final_points} pts`);
    }
  };

  const logout = () => {
    teamStorage.clear();
    navigate("/");
  };

  if (!team) return null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" /> Quitter
          </Button>
        </div>

        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Équipe</p>
          <h1 className="text-4xl font-extrabold">{team.name}</h1>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
            <span className="text-primary font-bold">
              ⭐ {stats.total_points} point{stats.total_points > 1 ? "s" : ""}
            </span>
            <span>
              ✅ {stats.completed_questions} question{stats.completed_questions > 1 ? "s" : ""} validée
              {stats.completed_questions > 1 ? "s" : ""}
            </span>
            <span>
              🏛️ {stats.completed_rooms} salle{stats.completed_rooms > 1 ? "s" : ""} complétée
              {stats.completed_rooms > 1 ? "s" : ""}
            </span>
            <span>❌ {stats.total_faults} faute{stats.total_faults > 1 ? "s" : ""}</span>
          </div>
        </header>

        {finished ? (
          <div className="card-elegant rounded-xl p-10 text-center space-y-4 animate-fade-in-up">
            <Trophy className="h-16 w-16 text-gold mx-auto" />
            <h2 className="text-3xl font-bold">Partie terminée !</h2>
            <p className="text-muted-foreground">
              Rendez-vous sur le podium pour découvrir le classement final.
            </p>
          </div>
        ) : currentRoomCode ? (
          <RoomView
            roomCode={currentRoomCode}
            teamId={team.id}
            teamToken={team.token}
            onCompleted={handleRoomCompleted}
            onCancel={() => setCurrentRoomCode(null)}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              <button
                onClick={() => setActiveTab("questions")}
                className={`pb-3 px-4 font-semibold text-sm transition-colors ${
                  activeTab === "questions"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HelpCircle className="h-4 w-4 inline mr-2" />
                Questions actives
              </button>
              <button
                onClick={() => setActiveTab("hints")}
                className={`pb-3 px-4 font-semibold text-sm transition-colors ${
                  activeTab === "hints"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lightbulb className="h-4 w-4 inline mr-2" />
                Indices & Histoire
              </button>
            </div>

            {/* Contenu des tabs */}
            {activeTab === "questions" ? (
              <>
                <form onSubmit={handleUnlock} className="card-elegant rounded-xl p-6 space-y-4">
                  <Label htmlFor="code" className="text-base flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Entrez un code pour débloquer une salle ou question
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: SALLE01, EVENT01, QUESTION-ABC..."
                    maxLength={30}
                    className="h-14 text-xl font-mono tracking-widest text-center"
                    autoComplete="off"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12"
                    disabled={loading || !code.trim()}
                  >
                    {loading ? "Vérification..." : "Débloquer"}
                  </Button>
                </form>

                {stats.completed_rooms > 0 && (
                  <div className="mt-8 text-center">
                    <Button variant="secondary" onClick={handleFinish}>
                      <Trophy className="h-4 w-4 mr-2" />
                      J'ai fini l'escape game
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <HintsTab teamId={team.id} teamToken={team.token} />
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Jeu;
