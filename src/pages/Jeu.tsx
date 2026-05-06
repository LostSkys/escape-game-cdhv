import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { teamStorage } from "@/lib/teamStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, LogOut, Trophy } from "lucide-react";
import StepView, { type Step } from "@/components/StepView";

const Jeu = () => {
  const navigate = useNavigate();
  const team = teamStorage.get();
  const [code, setCode] = useState("");
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, { faults: number; completed: boolean }>>({});
  const [points, setPoints] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!team) {
      navigate("/inscription");
      return;
    }
    loadProgress();
    checkFinished();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkFinished = async () => {
    if (!team) return;
    const { data } = await supabase.from("teams").select("finished_at, total_points").eq("id", team.id).maybeSingle();
    if (data?.finished_at) setFinished(true);
    if (data?.total_points !== undefined && data?.total_points !== null) setPoints(data.total_points);
  };

  const loadProgress = async () => {
    if (!team) return;
    const { data } = await supabase
      .from("team_progress")
      .select("step_id, faults, completed_at")
      .eq("team_id", team.id);
    if (data) {
      const map: Record<string, { faults: number; completed: boolean }> = {};
      data.forEach((p) => {
        map[p.step_id] = { faults: p.faults, completed: !!p.completed_at };
      });
      setProgressMap(map);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_step_by_code", { p_code: code });
      if (error) {
        toast.error("Erreur de connexion");
        return;
      }
      if (!data || data.length === 0) {
        toast.error("Code invalide");
        return;
      }
      setCurrentStep(data[0] as Step);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleStepCompleted = async () => {
    await loadProgress();
    await checkFinished();
    setCurrentStep(null);
  };

  const handleFinish = async () => {
    if (!team) return;
    await supabase.rpc("finish_game", { p_team_id: team.id });
    setFinished(true);
    toast.success("Partie terminée ! Bravo 🎉");
  };

  const logout = () => {
    teamStorage.clear();
    navigate("/");
  };

  if (!team) return null;

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const totalFaults = Object.values(progressMap).reduce((sum, p) => sum + p.faults, 0);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
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
            <span className="text-primary font-bold">⭐ {points} point{Math.abs(points) > 1 ? "s" : ""}</span>
            <span>✅ {completedCount} étape{completedCount > 1 ? "s" : ""} validée{completedCount > 1 ? "s" : ""}</span>
            <span>❌ {totalFaults} faute{totalFaults > 1 ? "s" : ""}</span>
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
        ) : currentStep ? (
          <StepView
            step={currentStep}
            teamId={team.id}
            onCompleted={handleStepCompleted}
            onCancel={() => setCurrentStep(null)}
            alreadyCompleted={!!progressMap[currentStep.id]?.completed}
          />
        ) : (
          <>
            <form onSubmit={handleUnlock} className="card-elegant rounded-xl p-6 space-y-4">
              <Label htmlFor="code" className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Entrez un code pour débloquer une étape
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: CDHV01..."
                maxLength={20}
                className="h-14 text-xl font-mono tracking-widest text-center"
                autoComplete="off"
              />
              <Button type="submit" size="lg" className="w-full h-12" disabled={loading || !code.trim()}>
                {loading ? "Vérification..." : "Débloquer"}
              </Button>
            </form>

            {completedCount > 0 && (
              <div className="mt-8 text-center">
                <Button variant="secondary" onClick={handleFinish}>
                  <Trophy className="h-4 w-4 mr-2" />
                  J'ai fini l'escape game
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Jeu;
