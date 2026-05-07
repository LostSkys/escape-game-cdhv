import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { teamStorage } from "@/lib/teamStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";

const playerSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(50),
  last_name: z.string().trim().min(1, "Nom requis").max(50),
});

const teamSchema = z.object({
  name: z.string().trim().min(2, "Nom d'équipe trop court").max(60),
  players: z.array(playerSchema).min(1, "Au moins 1 joueur").max(10, "10 joueurs maximum"),
});

const Inscription = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState([{ first_name: "", last_name: "" }]);
  const [loading, setLoading] = useState(false);

  const updatePlayer = (i: number, field: "first_name" | "last_name", value: string) => {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };

  const addPlayer = () => {
    if (players.length >= 10) {
      toast.error("Maximum 10 joueurs par équipe");
      return;
    }
    setPlayers((prev) => [...prev, { first_name: "", last_name: "" }]);
  };

  const removePlayer = (i: number) => {
    if (players.length === 1) return;
    setPlayers((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = teamSchema.safeParse({ name: teamName, players });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("register_team", {
        p_name: parsed.data.name,
        p_players: parsed.data.players as any,
      });

      if (error) {
        if (error.message?.includes("duplicate_team")) toast.error("Ce nom d'équipe existe déjà");
        else toast.error("Erreur lors de la création de l'équipe");
        return;
      }

      const team = (data as any[])?.[0];
      if (!team) { toast.error("Erreur lors de la création de l'équipe"); return; }

      teamStorage.set({ id: team.id, name: team.name, token: team.token });
      toast.success(`Équipe « ${team.name} » créée !`);
      navigate("/jeu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <header className="mb-8 space-y-2">
          <h1 className="text-4xl font-extrabold">Inscription de l'équipe</h1>
          <p className="text-muted-foreground">Choisissez un nom et ajoutez jusqu'à 10 joueurs.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card-elegant rounded-xl p-6 space-y-2">
            <Label htmlFor="teamName" className="text-base">Nom de l'équipe</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ex: Les Explorateurs..."
              maxLength={60}
              className="h-12 text-lg"
              required
            />
          </div>

          <div className="card-elegant rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Joueurs ({players.length}/10)</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addPlayer}
                disabled={players.length >= 10}
              >
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </div>

            <div className="space-y-3">
              {players.map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder="Prénom du joueur..."
                    value={p.first_name}
                    onChange={(e) => updatePlayer(i, "first_name", e.target.value)}
                    maxLength={50}
                    required
                  />
                  <Input
                    placeholder="Nom du joueur..."
                    value={p.last_name}
                    onChange={(e) => updatePlayer(i, "last_name", e.target.value)}
                    maxLength={50}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(i)}
                    disabled={players.length === 1}
                    aria-label="Supprimer ce joueur"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-14 text-base" disabled={loading}>
            <UserPlus className="mr-2 h-5 w-5" />
            {loading ? "Création..." : "Démarrer l'aventure"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default Inscription;
