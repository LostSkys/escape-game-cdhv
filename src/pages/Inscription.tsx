import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";

interface TeamOption {
  id: string;
  team_name: string;
  members: string;
  points: number;
}

const Inscription = () => {
  const navigate = useNavigate();
  const [teamSearch, setTeamSearch] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const { data, error } = await (supabase.rpc("get_leaderboard") as any);

      if (error) {
        toast.error("Erreur lors du chargement des équipes");
        return;
      }

      if (data) {
        // Convert leaderboard data to team options
        const teamOptions: TeamOption[] = data.map((entry: any) => ({
          id: entry.team_name, // Using team_name as ID for now
          team_name: entry.team_name,
          members: entry.members,
          points: entry.points,
        }));
        setTeams(teamOptions);
      }
    } catch (err) {
      console.error("Error loading teams:", err);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (team: TeamOption) => {
    setSelecting(true);

    // Get full team data from database
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, points, team_members(first_name, last_name)")
        .eq("name", team.team_name)
        .single();

      if (error) {
        toast.error("Équipe non trouvée");
        setSelecting(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem(
        "team_data",
        JSON.stringify({
          team_id: data.id,
          team_name: data.name,
          points: data.points,
          members: team.members,
        })
      );

      toast.success(`Bienvenue ${data.name}!`);
      navigate("/jeu");
    } catch (err) {
      console.error("Error selecting team:", err);
      toast.error("Erreur lors de la sélection de l'équipe");
      setSelecting(false);
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.team_name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    <main className="min-h-screen px-4 py-6 bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <Card className="border-slate-800 bg-slate-950 mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Rejoindre une Équipe</CardTitle>
            <CardDescription>
              Sélectionnez votre équipe parmi celles créées par les organisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Chercher une équipe</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="search"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Tapez le nom de votre équipe..."
                    className="pl-10 bg-slate-900 border-slate-700 text-slate-200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center text-slate-400 py-8">
            <p>Chargement des équipes...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <Card className="border-slate-800 bg-slate-950">
            <CardContent className="py-8 text-center">
              <p className="text-slate-400">
                {teams.length === 0
                  ? "Aucune équipe créée pour le moment"
                  : "Aucune équipe trouvée avec ce nom"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className="border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => handleSelectTeam(team)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-200 text-lg">{team.team_name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{team.members}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-400">{team.points} pts</p>
                      <Button
                        disabled={selecting}
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                      >
                        {selecting ? "Chargement..." : "Rejoindre"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-slate-900 rounded-lg border border-slate-800">
          <p className="text-sm text-slate-400">
            💡 <span className="font-semibold">Info:</span> Les équipes sont créées par les organisateurs. Si vous ne voyez
            pas votre équipe, contactez-les pour vous faire ajouter.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Inscription;
