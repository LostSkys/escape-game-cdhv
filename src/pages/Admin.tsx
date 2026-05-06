import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { adminAuth } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Medal, Pencil, RefreshCw, Trash2, Trophy, Users } from "lucide-react";
import EditTeamDialog from "@/components/EditTeamDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TeamRow = {
  id: string;
  name: string;
  current_step: number;
  total_faults: number;
  total_points: number;
  started_at: string;
  finished_at: string | null;
};
type PlayerRow = { team_id: string; first_name: string; last_name: string };

const TOTAL_STEPS = 20;
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

const Admin = () => {
  const [authed, setAuthed] = useState(adminAuth.isAuthed());
  const [password, setPassword] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [teamsRes, playersRes] = await Promise.all([
      supabase.from("teams").select("id, name, current_step, total_faults, total_points, started_at, finished_at"),
      supabase.from("players").select("team_id, first_name, last_name"),
    ]);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    if (!authed) return;
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuth.login(password)) { setAuthed(true); toast.success("Connecté"); }
    else toast.error("Mot de passe incorrect");
  };

  const logout = () => { adminAuth.logout(); setAuthed(false); };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="card-elegant rounded-xl p-8 w-full max-w-sm space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <h1 className="text-2xl font-bold">Espace organisateur</h1>
          <div className="space-y-2">
            <Label htmlFor="pwd">Mot de passe</Label>
            <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe organisateur..." autoFocus />
          </div>
          <Button type="submit" className="w-full">Entrer</Button>
        </form>
      </main>
    );
  }

  const sorted = [...teams].sort((a, b) => {
    // Tri principal : points (décroissant)
    if (a.total_points !== b.total_points) return b.total_points - a.total_points;
    // En cas d'égalité, le premier à avoir terminé l'emporte
    if (a.finished_at && b.finished_at) {
      return new Date(a.finished_at).getTime() - new Date(b.finished_at).getTime();
    }
    if (a.finished_at) return -1;
    if (b.finished_at) return 1;
    return b.current_step - a.current_step;
  });

  // Podium = top 3 du classement par points (parmi les équipes ayant terminé)
  const finishedTeams = sorted.filter((t) => t.finished_at);
  const playersByTeam = players.reduce<Record<string, PlayerRow[]>>((acc, p) => {
    (acc[p.team_id] ||= []).push(p); return acc;
  }, {});

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={load} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              Forcer l'actualisation
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>

        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Tableau de bord</p>
          <h1 className="text-4xl font-extrabold">Suivi des équipes</h1>
          <p className="text-sm text-muted-foreground">
            Actualisation automatique toutes les 5 min · Dernière : {lastRefresh.toLocaleTimeString()}
          </p>
        </header>

        {finishedTeams.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-gold" /> Podium
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {finishedTeams.slice(0, 3).map((t, i) => {
                const colors = ["text-gold", "text-silver", "text-bronze"];
                const labels = ["1ʳᵉ place", "2ᵉ place", "3ᵉ place"];
                return (
                  <div key={t.id} className="card-elegant rounded-xl p-6 text-center space-y-2">
                    <Medal className={`h-12 w-12 mx-auto ${colors[i]}`} />
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels[i]}</p>
                    <h3 className="text-xl font-bold">{t.name}</h3>
                    <p className="text-sm text-primary font-semibold">⭐ {t.total_points} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {t.total_faults} faute{t.total_faults > 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
            {finishedTeams.length > 3 && (
              <div className="mt-4 card-elegant rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Autres équipes terminées :</p>
                <ul className="space-y-1 text-sm">
                  {finishedTeams.slice(3).map((t, i) => (
                    <li key={t.id} className="flex justify-between">
                      <span>{i + 4}. {t.name}</span>
                      <span className="text-muted-foreground">⭐ {t.total_points} pts · {t.total_faults} faute{t.total_faults > 1 ? "s" : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Toutes les équipes ({teams.length})
          </h2>
          <div className="card-elegant rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left">
                <tr>
                  <th className="p-4">Équipe</th>
                  <th className="p-4">Joueurs</th>
                  <th className="p-4 w-64">Progression</th>
                  <th className="p-4 text-center">Points</th>
                  <th className="p-4 text-center">Fautes</th>
                  <th className="p-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const completed = Math.min(TOTAL_STEPS, Math.max(0, t.current_step - 1));
                  const pct = Math.round((completed / TOTAL_STEPS) * 100);
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-4 font-semibold">{t.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {(playersByTeam[t.id] ?? []).map((p) => `${p.first_name} ${p.last_name}`).join(", ") || "—"}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <Progress value={pct} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{completed}/{TOTAL_STEPS} étapes</span>
                            <span>{pct}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-primary">{t.total_points}</td>
                      <td className="p-4 text-center">{t.total_faults}</td>
                      <td className="p-4 text-center">
                        {t.finished_at
                          ? <span className="text-success">✅ Terminé</span>
                          : <span className="text-muted-foreground">⏳ En cours</span>}
                      </td>
                    </tr>
                  );
                })}
                {teams.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune équipe inscrite pour le moment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Admin;
