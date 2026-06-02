import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminAuth } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, KeyRound, RefreshCw, Search, Sparkles } from "lucide-react";

interface MJQuestion {
  id: string;
  question_order: number | null;
  prompt: string;
  expected_answer: string;
  code_part: string | null;
  unlock_code: string | null;
  hint_text: string | null;
}

interface MJRoom {
  id: string;
  room_number: number;
  room_type: "QUESTION" | "EVENT";
  title: string;
  unlock_code: string;
  event_story_chapter: string | null;
  room_hint: string | null;
  questions: MJQuestion[];
}

export default function MJGuide() {
  const [rooms, setRooms] = useState<MJRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const pwd = adminAuth.getPassword();
    if (!pwd) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_get_mj_guide", { p_password: pwd });
    setLoading(false);
    if (error) {
      toast.error("Impossible de charger le guide MJ");
      return;
    }
    setRooms((data as unknown as MJRoom[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? rooms.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.unlock_code.toLowerCase().includes(q) ||
          String(r.room_number).includes(q) ||
          r.questions.some(
            (qu) =>
              qu.prompt.toLowerCase().includes(q) ||
              qu.expected_answer.toLowerCase().includes(q) ||
              (qu.unlock_code ?? "").toLowerCase().includes(q)
          )
      )
    : rooms;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Guide MJ — Réponses
          </h2>
          <p className="text-sm text-muted-foreground">
            Toutes les réponses attendues pour vérifier les équipes en direct.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher (salle, code, question, réponse...)"
          className="pl-9"
        />
      </div>

      {rooms.length === 0 && !loading && (
        <div className="card-elegant rounded-xl p-8 text-center text-muted-foreground">
          Aucune salle trouvée.
        </div>
      )}

      <Accordion type="multiple" className="space-y-2">
        {filtered.map((r) => (
          <AccordionItem
            key={r.id}
            value={r.id}
            className="card-elegant rounded-xl border-0 px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-3 pr-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs bg-secondary px-2 py-1 rounded shrink-0">
                    #{r.room_number}
                  </span>
                  <span className="font-semibold truncate">{r.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={r.room_type === "EVENT" ? "secondary" : "default"}>
                    {r.room_type === "EVENT" ? "Événement" : "Question"}
                  </Badge>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                    <KeyRound className="h-3 w-3" />
                    {r.unlock_code}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/40 rounded-lg p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Code de la salle
                  </p>
                  <p className="font-mono font-semibold">{r.unlock_code}</p>
                </div>
                {r.room_hint && (
                  <div className="bg-secondary/40 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Indice salle
                    </p>
                    <p>{r.room_hint}</p>
                  </div>
                )}
              </div>

              {r.room_type === "EVENT" ? (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Chapitre d'histoire (événement)
                  </p>
                  <p className="leading-relaxed">
                    {r.event_story_chapter || (
                      <span className="text-muted-foreground italic">Aucun chapitre défini.</span>
                    )}
                  </p>
                </div>
              ) : r.questions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Aucune question rattachée à cette salle.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {r.questions.length} question{r.questions.length > 1 ? "s" : ""} — code final salle :{" "}
                    <span className="font-mono text-foreground">{r.unlock_code}</span>
                  </p>
                  {r.questions.map((qu) => (
                    <div
                      key={qu.id}
                      className="rounded-lg border border-border p-3 space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          Question {qu.question_order ?? "—"}
                        </span>
                        {qu.code_part && (
                          <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Code part : {qu.code_part}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Énoncé
                        </p>
                        <p className="leading-relaxed">{qu.prompt}</p>
                      </div>
                      <div className="bg-success/10 border border-success/30 rounded p-2">
                        <p className="text-xs uppercase tracking-wider text-success mb-1">
                          Réponse attendue
                        </p>
                        <p className="font-mono font-semibold">{qu.expected_answer}</p>
                      </div>
                      {qu.hint_text && (
                        <div className="text-xs text-muted-foreground">
                          💡 Indice : {qu.hint_text}
                        </div>
                      )}
                      {qu.unlock_code && (
                        <div className="text-xs text-muted-foreground">
                          Code d'accès question :{" "}
                          <span className="font-mono">{qu.unlock_code}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
