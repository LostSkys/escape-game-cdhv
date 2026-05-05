import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { teamStorage } from "@/lib/teamStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, KeyRound } from "lucide-react";

const Reprendre = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("find_team_by_name", { p_name: name });
    setLoading(false);
    if (error) { toast.error("Erreur de connexion"); return; }
    const team = (data as any[])?.[0];
    if (!team) { toast.error("Aucune équipe trouvée avec ce nom"); return; }
    teamStorage.set({ id: team.id, name: team.name, token: team.token });
    toast.success(`Reconnexion de l'équipe « ${team.name} »`);
    navigate("/jeu");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <form onSubmit={handleSubmit} className="card-elegant rounded-xl p-8 space-y-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold font-display">Reprendre la partie</h1>
            <p className="text-sm text-muted-foreground">Entrez le nom exact de votre équipe pour reprendre où vous en étiez.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'équipe</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Les Explorateurs..."
              className="h-12 text-base"
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full h-12" disabled={loading || !name.trim()}>
            <KeyRound className="mr-2 h-4 w-4" />
            {loading ? "Recherche..." : "Reprendre"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default Reprendre;
