import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Lock, Unlock, AlertCircle } from "lucide-react";
import QuestionView from "./QuestionView";

interface RoomData {
  id: string;
  room_number: number;
  title: string;
  room_type: "QUESTION" | "EVENT";
  event_story_chapter: string | null;
}

interface RoomViewProps {
  roomCode: string;
  teamId: string;
  teamToken: string;
  onCompleted: () => void;
  onCancel: () => void;
}

export default function RoomView({
  roomCode,
  teamId,
  teamToken,
  onCompleted,
  onCancel,
}: RoomViewProps) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeParts, setCodeParts] = useState<string[]>([]);
  const [viewingRoom, setViewingRoom] = useState(false);

  useEffect(() => {
    loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const loadRoom = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_room_by_code", {
        p_code: roomCode,
      });

      if (error || !data || data.length === 0) {
        toast.error("Salle introuvable");
        return;
      }

      const roomData = data[0] as RoomData;
      setRoom(roomData);

      // Si c'est une salle EVENT, valider le code directement
      if (roomData.room_type === "EVENT") {
        await submitEventCode(roomCode);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitEventCode = async (code: string) => {
    try {
      const { data: result, error } = await supabase.rpc("submit_event_code", {
        p_team_id: teamId,
        p_code: code,
      });

      if (error) {
        toast.error("Erreur lors de la validation du code événement");
        return;
      }

      if (result.ok) {
        toast.success("✅ Événement validé ! Histoire déverrouillée.");
        onCompleted();
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const handleQuestionsCompleted = async (parts: string[]) => {
    setCodeParts(parts);

    // Concaténer les codes et déverrouiller la salle
    const concatenated = parts.join("");

    if (!room) return;

    try {
      const { data: result, error } = await supabase.rpc("unlock_room", {
        p_team_id: teamId,
        p_room_id: room.id,
        p_concatenated_codes: concatenated,
      });

      if (error) {
        toast.error("Erreur lors du déverrouillage");
        return;
      }

      if (result.ok) {
        toast.success("🎉 Salle déverrouillée !");
        onCompleted();
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  if (loading) {
    return (
      <div className="card-elegant rounded-xl p-8 text-center">
        <div className="animate-pulse">Chargement de la salle...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="card-elegant rounded-xl p-8 text-center space-y-4">
        <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
        <p className="text-destructive font-semibold">Salle introuvable</p>
        <p className="text-sm text-muted-foreground">Le code ne correspond à aucune salle.</p>
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  // Salle EVENT
  if (room.room_type === "EVENT") {
    return (
      <div className="card-elegant rounded-xl p-6 space-y-4 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{room.title}</h2>
          <p className="text-sm text-muted-foreground">Salle Événement</p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <p className="text-sm text-purple-800 font-semibold mb-2">✨ Événement déverrouillé !</p>
          {room.event_story_chapter && (
            <p className="text-sm leading-relaxed">{room.event_story_chapter}</p>
          )}
        </div>

        <Button onClick={onCompleted} className="w-full bg-success hover:bg-success/90">
          Continuer
        </Button>
      </div>
    );
  }

  // Salle QUESTION - Afficher les questions
  return (
    <QuestionView
      roomId={room.id}
      teamId={teamId}
      teamToken={teamToken}
      onCompleted={handleQuestionsCompleted}
      onCancel={onCancel}
    />
  );
}
