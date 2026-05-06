import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

type Player = { id: string; first_name: string; last_name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: { id: string; name: string } | null;
  players: Player[];
  onSaved: () => void;
};

const EditTeamDialog = ({ open, onOpenChange, team, players, onSaved }: Props) => {
  const [name, setName] = useState("");
  const [editedPlayers, setEditedPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (team) setName(team.name);
    setEditedPlayers(players.map((p) => ({ ...p })));
  }, [team, players]);

  if (!team) return null;

  const updatePlayer = (id: string, field: "first_name" | "last_name", value: string) => {
    setEditedPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom de l'équipe est obligatoire");
      return;
    }
    setSaving(true);
    const { error: teamErr } = await supabase
      .from("teams")
      .update({ name: name.trim() })
      .eq("id", team.id);
    if (teamErr) {
      toast.error("Erreur sauvegarde équipe");
      setSaving(false);
      return;
    }
    for (const p of editedPlayers) {
      const original = players.find((x) => x.id === p.id);
      if (!original) continue;
      if (original.first_name !== p.first_name || original.last_name !== p.last_name) {
        const { error } = await supabase
          .from("players")
          .update({ first_name: p.first_name.trim(), last_name: p.last_name.trim() })
          .eq("id", p.id);
        if (error) {
          toast.error(`Erreur sur ${original.first_name}`);
          setSaving(false);
          return;
        }
      }
    }
    setSaving(false);
    toast.success("Équipe mise à jour");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" /> Modifier l'équipe
          </DialogTitle>
          <DialogDescription>Corrigez le nom de l'équipe ou des joueurs.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="team-name">Nom de l'équipe</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label>Joueurs ({editedPlayers.length})</Label>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {editedPlayers.map((p) => (
                <div key={p.id} className="grid grid-cols-2 gap-2">
                  <Input
                    value={p.first_name}
                    onChange={(e) => updatePlayer(p.id, "first_name", e.target.value)}
                    placeholder="Prénom"
                    maxLength={50}
                  />
                  <Input
                    value={p.last_name}
                    onChange={(e) => updatePlayer(p.id, "last_name", e.target.value)}
                    placeholder="Nom"
                    maxLength={50}
                  />
                </div>
              ))}
              {editedPlayers.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun joueur</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;
