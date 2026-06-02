import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { teamStorage } from "@/lib/teamStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Trophy, History, Play, Sparkles, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomView from "@/components/RoomView";
import HintsTab from "@/components/HintsTab";
import { Input } from "@/components/ui/input";

const Jeu = () => {
  const navigate = useNavigate();
  const team = teamStorage.get();
  
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);

  useEffect(() => {
    // Si pas de session, on dégage pour éviter la boucle
    if (!team || !team.team_id) {
      navigate("/inscription", { replace: true });
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    if (!team?.team_id) return;
    setLoading(true);
    try {
      // 1. Infos équipe
      const { data: tData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", team.team_id)
        .single();
      
      if (tData) setTeamData(tData);

      // 2. Historique
      const { data: hData } = await supabase
        .from("attempt_log")
        .select("*, rooms(room_number, title), admins(name)")
        .eq("team_id", team.team_id)
        .order("created_at", { ascending: false });
      
      if (hData) setHistory(hData);

      // 3. Leaderboard
      const { data: lData } = await supabase
        .from("teams")
        .select("id, name, points")
        .order("points", { ascending: false });
      
      if (lData) setLeaderboard(lData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    teamStorage.clear();
    navigate("/inscription", { replace: true });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Chargement...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-12">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-400" />
            <span className="font-display font-bold text-xl tracking-tight">ESCAPE GAME</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut className="h-4 w-4 mr-2" /> Quitter
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-blue-400 font-medium mb-1 uppercase tracking-widest text-xs">Session active</p>
            <h1 className="text-4xl font-extrabold text-white">{teamData?.name}</h1>
          </div>
          <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-900/20 flex flex-col items-center">
            <span className="text-blue-100 text-xs uppercase font-bold">Points</span>
            <span className="text-3xl font-black text-white">{teamData?.points || 0}</span>
          </div>
        </header>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 p-1 h-12">
            <TabsTrigger value="game"><Play className="h-4 w-4 mr-2" /> Explorer</TabsTrigger>
            <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-2" /> Classement</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" /> Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="mt-6">
            {!isInRoom ? (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Entrer dans une salle</CardTitle>
                  <CardDescription>Saisissez le code trouvé pour débloquer les énigmes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="Code de la salle..." 
                    value={roomCode} 
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="h-14 text-2xl text-center font-mono bg-slate-950 border-slate-700"
                  />
                  <Button className="w-full h-12 text-lg" onClick={() => setIsInRoom(true)} disabled={!roomCode}>
                    Débloquer la salle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RoomView 
                roomCode={roomCode} 
                teamId={team.team_id} 
                onCompleted={() => { setIsInRoom(false); setRoomCode(""); loadData(); }} 
                onCancel={() => setIsInRoom(false)} 
              />
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle>Top Équipes</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {leaderboard.map((t, i) => (
                    <div key={t.id} className={`flex items-center justify-between p-4 rounded-lg ${t.id === team.team_id ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-950'}`}>
                      <span className="font-bold text-slate-400">#{i+1} {t.name}</span>
                      <span className="font-bold text-blue-400">{t.points} pts</span>
                    </div>
                  ))}
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle>Dernières actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {history.map((h, i) => (
                    <div key={i} className="border-l-2 border-slate-700 pl-4 py-1">
                      <p className="text-sm font-bold">{h.rooms?.title} : {h.is_correct ? '✅ Réussi' : '❌ Échec'}</p>
                      <p className="text-xs text-slate-500">{new Date(h.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Jeu;