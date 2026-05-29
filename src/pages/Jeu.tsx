import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Trophy, History, Play, Sparkles } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import RoomView from "@/components/RoomView";
import HintsTab from "@/components/HintsTab";

interface TeamData {
  team_id: string;
  team_name: string;
  points: number;
  members: string;
}

interface AttemptHistory {
  room_number: number;
  room_title: string;
  answer_submitted: string;
  is_correct: boolean;
  points_change: number;
  admin_name: string;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  team_name: string;
  points: number;
  members: string;
}

const Jeu = () => {
  const navigate = useNavigate();
  
  // Get team from localStorage (assuming you have teamStorage or similar)
  const teamData = localStorage.getItem("team_data");
  const team = teamData ? JSON.parse(teamData) : null;
  
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState<TeamData | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!team) {
      navigate("/inscription");
      return;
    }
    loadData();
  }, [team, navigate]);

  const loadData = async () => {
    if (!team) return;
    setLoading(true);

    try {
      // Load team progress
      const { data: progressData } = await (supabase.rpc("get_team_progress", {
        p_team_id: team.team_id,
      }) as any);

      if (progressData && Array.isArray(progressData) && progressData.length > 0) {
        setTeamInfo({
          team_id: progressData[0].team_id,
          team_name: progressData[0].team_name,
          points: progressData[0].points,
          members: progressData[0].members,
        });
      }

      // Nothing extra required here for the public game view.

      // Load attempt history for this team
      const { data: attemptsData } = await (supabase.rpc("get_attempt_history", {
        p_team_id: team.team_id,
        p_limit: 100,
      }) as any);

      if (attemptsData) {
        setAttempts(attemptsData as AttemptHistory[]);
      }

      // Load leaderboard
      const { data: leaderboardData } = await (supabase.rpc("get_leaderboard") as any);

      if (leaderboardData) {
        setLeaderboard(leaderboardData as LeaderboardEntry[]);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("team_data");
    navigate("/inscription");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <p className="text-slate-400">Chargement...</p>
      </main>
    );
  }

  if (!teamInfo) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Équipe non trouvée</p>
          <Button onClick={() => navigate("/inscription")}>Retour</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Accueil
            </Link>
            <h1 className="text-3xl font-bold">{teamInfo.team_name}</h1>
            <p className="text-sm text-slate-400 mt-2">{teamInfo.members}</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-400">Points</p>
              <p className="text-3xl font-bold text-blue-400">{teamInfo.points}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Quitter
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800">
            <TabsTrigger value="game" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Jeu</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          {/* Game Tab */}
          <TabsContent value="game" className="space-y-6">
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Votre aventure</CardTitle>
                <CardDescription>Entrez le code de votre salle pour continuer l&apos;escape game.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                      <div className="flex items-center justify-between gap-6">
                        <div>
                          <p className="text-sm text-slate-400">Équipe</p>
                          <h2 className="text-2xl font-bold text-slate-100">{teamInfo.team_name}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Points</p>
                          <p className="text-3xl font-bold text-sky-400">{teamInfo.points}</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-slate-950 p-4 border border-slate-800">
                        <p className="text-sm text-slate-400">Membres</p>
                        <p className="text-sm text-slate-200 mt-2">{teamInfo.members}</p>
                      </div>
                    </div>

                    {activeRoomCode ? (
                      <RoomView
                        roomCode={activeRoomCode}
                        teamId={teamInfo.team_id}
                        onCompleted={() => {
                          setActiveRoomCode(null);
                          loadData();
                        }}
                        onCancel={() => setActiveRoomCode(null)}
                      />
                    ) : (
                      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="room-code" className="text-sm text-slate-400">
                              Code de salle
                            </Label>
                            <Input
                              id="room-code"
                              value={roomCode}
                              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                              placeholder="Ex: SALLE01"
                              className="mt-3 bg-slate-950 border-slate-800"
                            />
                          </div>

                          <Button
                            className="w-full bg-slate-700 hover:bg-slate-600"
                            onClick={() => setActiveRoomCode(roomCode.trim().toUpperCase())}
                            disabled={!roomCode.trim()}
                          >
                            Entrer dans la salle
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                    <div className="flex items-center gap-3 text-slate-100 mb-4">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <p className="text-sm font-semibold">Indices et histoire</p>
                    </div>
                    <HintsTab teamId={teamInfo.team_id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Historique des Tentatives</CardTitle>
                <CardDescription>{attempts.length} tentatives enregistrées</CardDescription>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Aucune tentative pour le moment</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {attempts.map((attempt, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          attempt.is_correct
                            ? "bg-green-950 border-green-700"
                            : "bg-red-950 border-red-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-200">
                              Salle {attempt.room_number}: {attempt.room_title}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Réponse: <span className="font-mono">{attempt.answer_submitted}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg ${
                              attempt.is_correct
                                ? "text-green-400"
                                : "text-red-400"
                            }`}>
                              {attempt.is_correct ? "✅" : "❌"}
                            </p>
                            <p className={`text-sm font-semibold ${
                              attempt.points_change > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}>
                              {attempt.points_change > 0 ? "+" : ""}{attempt.points_change}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          par {attempt.admin_name} • {new Date(attempt.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refresh button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={loadData}
            className="text-slate-400 border-slate-700 hover:bg-slate-900"
          >
            Actualiser les données
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Jeu;
      