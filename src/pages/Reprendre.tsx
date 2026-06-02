import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { teamStorage } from "@/lib/teamStorage"; // Vérifie bien que le chemin est exact
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
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      // On cherche l'équipe dans la table 'teams' par son nom
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("name", name.trim())
        .maybeSingle();

      if (error) {
        console.error("Erreur Supabase:", error);
        toast.error("Erreur lors de la recherche de l'équipe");
        setLoading(false);
        return;
      }

      if (!data) {
        toast.error("Aucune équipe trouvée avec ce nom exact");
        setLoading(false);
        return;
      }

      // On enregistre les infos au format attendu par Jeu.tsx via le storage
      teamStorage.set({ 
        team_id: data.id, 
        team_name: data.name, 
        token: data.id // On utilise l'ID comme token par défaut
      });

      toast.success(`Bon retour, équipe ${data.name} !`);
      
      // On redirige vers le jeu en remplaçant l'historique pour éviter les boucles
      navigate("/jeu", { replace: true });
      
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue");
      setLoading(false);
    }
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
            <p className="text-sm text-muted-foreground">
              Entrez le nom exact de votre équipe pour reprendre où vous en étiez.
            </p>
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
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-12" 
            disabled={loading || !name.trim()}
          >
            {loading ? (
              "Chargement..."
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Rejoindre la partie
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default Reprendre;