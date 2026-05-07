import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2,
  DoorOpen,
  Footprints,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Puzzle,
  X,
} from "lucide-react";
import CountdownHint from "./CountdownHint";

export type Step = {
  id: string;
  step_order: number;
  type: "question" | "enigme" | "minijeu" | "salle" | "physique" | "composee";
  title: string;
  content: any;
  hint: string;
};

type Props = {
  step: Step;
  teamId: string;
  teamToken: string;
  onCompleted: () => void;
  onCancel: () => void;
  alreadyCompleted: boolean;
};

const typeMeta: Record<Step["type"], { icon: any; label: string; color: string }> = {
  question: { icon: HelpCircle, label: "Question", color: "text-accent" },
  enigme: { icon: Lightbulb, label: "Énigme", color: "text-primary" },
  minijeu: { icon: Puzzle, label: "Minijeu", color: "text-success" },
  salle: { icon: DoorOpen, label: "Accès salle", color: "text-gold" },
  physique: { icon: Footprints, label: "Action physique", color: "text-accent" },
  composee: { icon: ListChecks, label: "Étape composée", color: "text-primary" },
};

const placeholderFor = (type: Step["type"]) => {
  switch (type) {
    case "question": return "Entrez votre réponse ici...";
    case "enigme": return "Le mot que vous avez deviné...";
    case "physique": return "Réponse trouvée sur place...";
    default: return "Votre réponse...";
  }
};

const StepView = ({ step, teamId, teamToken, onCompleted, onCancel, alreadyCompleted }: Props) => {
  const meta = typeMeta[step.type];
  const Icon = meta.icon;

  return (
    <div className="card-elegant rounded-xl p-6 md:p-8 animate-fade-in-up space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className={`text-xs uppercase tracking-[0.25em] font-semibold flex items-center gap-2 ${meta.color}`}>
            <Icon className="h-4 w-4" />
            Étape {step.step_order} · {meta.label}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold">{step.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Fermer">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {alreadyCompleted && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Vous avez déjà validé cette étape.
        </div>
      )}

      {step.type === "salle" && <SalleView step={step} teamId={teamId} teamToken={teamToken} onCompleted={onCompleted} />}
      {step.type === "question" && <AnswerView step={step} teamId={teamId} teamToken={teamToken} onCompleted={onCompleted} />}
      {step.type === "enigme" && <AnswerView step={step} teamId={teamId} teamToken={teamToken} onCompleted={onCompleted} isRiddle />}
      {step.type === "physique" && <AnswerView step={step} teamId={teamId} teamToken={teamToken} onCompleted={onCompleted} isPhysical />}
      {step.type === "minijeu" && <MiniGameView step={step} teamId={teamId} teamToken={teamToken} onCompleted={onCompleted} />}
      {step.type === "composee" && <CompositeView step={step} teamId={teamId} teamToken={teamToken} onCompleted={onCompleted} />}
    </div>
  );
};

type GameProps = { step: Step; teamId: string; teamToken: string; onCompleted: () => void };

const SalleView = ({ step, teamId, teamToken, onCompleted }: GameProps) => {
  const [loading, setLoading] = useState(false);
  const message = step.content?.message ?? "Vous pouvez accéder à cette salle.";

  const handleConfirm = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("complete_room_step", { p_team_id: teamId, p_token: teamToken, p_step_id: step.id });
    setLoading(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Accès enregistré !");
    onCompleted();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-5 text-base">🚪 {message}</div>
      <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
        💡 Indice pour la suite : <span className="text-foreground">{step.hint}</span>
      </div>
      <Button onClick={handleConfirm} size="lg" className="w-full" disabled={loading}>
        J'ai accédé à la salle
      </Button>
    </div>
  );
};

const AnswerView = ({
  step, teamId, teamToken, onCompleted, isRiddle, isPhysical,
}: GameProps & { isRiddle?: boolean; isPhysical?: boolean }) => {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; hint: string } | null>(null);
  const prompt = isRiddle ? step.content?.riddle : isPhysical ? step.content?.instruction : step.content?.question;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_step_answer", {
      p_team_id: teamId, p_token: teamToken, p_step_id: step.id, p_answer: answer,
    });
    setLoading(false);
    if (error) { toast.error("Erreur"); return; }
    const r = data as { correct: boolean; hint: string };
    setResult(r);
    if (r.correct) toast.success("Bonne réponse !");
    else toast.error("Mauvaise réponse — comptabilisée");
  };

  return (
    <div className="space-y-4">
      {isPhysical ? (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-base">
          <span className="font-semibold text-accent">📍 Mission terrain : </span>
          {prompt}
        </div>
      ) : (
        <p className="text-lg leading-relaxed">{prompt}</p>
      )}

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Label htmlFor="answer">Votre réponse</Label>
          <Input
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={placeholderFor(step.type)}
            className="h-12 text-base"
            autoComplete="off"
            disabled={loading}
          />
          <CountdownHint hint={step.hint} storageKey={`step-${step.id}`} />
          <Button type="submit" className="w-full" size="lg" disabled={loading || !answer.trim()}>
            {loading ? "Validation..." : "Valider"}
          </Button>
        </form>
      ) : null}

      {result && (
        <>
          <div className={`rounded-lg p-4 border ${
            result.correct ? "bg-success/10 border-success/30 text-success"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}>
            {result.correct ? "✅ Bonne réponse !" : "❌ Mauvaise réponse, mais voici l'indice pour avancer :"}
          </div>
          <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
            💡 Indice : <span className="text-foreground">{result.hint}</span>
          </div>
          <Button onClick={onCompleted} variant="secondary" className="w-full">Continuer</Button>
        </>
      )}
    </div>
  );
};

type Sub = {
  kind: "quiz" | "input" | "enigme";
  question: string;
  options?: string[];
  hint: string;
};

const CompositeView = ({ step, teamId, teamToken, onCompleted }: GameProps) => {
  const subs: Sub[] = step.content?.subs ?? [];
  const intro: string = step.content?.intro ?? "";
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; expected: string; hint: string } | null>(null);
  const [finalLoading, setFinalLoading] = useState(false);
  const [finalHint, setFinalHint] = useState<string | null>(null);

  const sub = subs[index];
  const isLast = index === subs.length - 1;

  const submit = async () => {
    const ans = sub.kind === "quiz" ? (picked ?? "") : input;
    if (!ans.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_substep", {
      p_team_id: teamId, p_token: teamToken, p_step_id: step.id, p_sub_index: index, p_answer: ans,
    });
    setLoading(false);
    if (error) { toast.error("Erreur"); return; }
    const r = data as { correct: boolean; expected: string; hint: string };
    setFeedback(r);
    if (r.correct) toast.success("Bonne réponse !");
    else toast.error("Faute comptabilisée");
  };

  const next = async () => {
    setFeedback(null);
    setInput("");
    setPicked(null);
    if (!isLast) {
      setIndex(index + 1);
    } else {
      setFinalLoading(true);
      const { data, error } = await supabase.rpc("complete_composite_step", {
        p_team_id: teamId, p_token: teamToken, p_step_id: step.id,
      });
      setFinalLoading(false);
      if (error) { toast.error("Erreur"); return; }
      setFinalHint((data as any)?.hint ?? step.hint);
    }
  };

  if (finalHint) {
    return (
      <div className="space-y-4">
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-success">
          🎉 Étape composée terminée !
        </div>
        <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
          💡 Indice menant à la salle suivante : <span className="text-foreground">{finalHint}</span>
        </div>
        <Button onClick={onCompleted} variant="secondary" className="w-full">Continuer</Button>
      </div>
    );
  }

  if (!sub) return null;

  return (
    <div className="space-y-4">
      {intro && <p className="text-sm text-muted-foreground italic">{intro}</p>}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-semibold">
        Sous-étape {index + 1} / {subs.length}
        <span className="text-muted-foreground normal-case font-normal">· {sub.kind}</span>
      </div>

      <p className="text-lg font-medium">{sub.question}</p>

      {!feedback && (
        <>
          {sub.kind === "quiz" ? (
            <div className="grid grid-cols-2 gap-2">
              {(sub.options ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPicked(opt)}
                  className={`px-4 py-3 rounded-lg border text-sm transition-smooth text-left ${
                    picked === opt ? "bg-primary/15 border-primary" : "bg-secondary border-border hover:border-primary/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sub.kind === "enigme" ? "Le mot que vous avez deviné..." : "Entrez votre réponse..."}
              className="h-12 text-base"
              autoComplete="off"
            />
          )}

          <CountdownHint hint={sub.hint} storageKey={`sub-${step.id}-${index}`} />

          <Button
            onClick={submit}
            className="w-full"
            size="lg"
            disabled={loading || (sub.kind === "quiz" ? !picked : !input.trim())}
          >
            {loading ? "Validation..." : "Valider"}
          </Button>
        </>
      )}

      {feedback && (
        <>
          <div className={`rounded-lg p-4 border ${
            feedback.correct ? "bg-success/10 border-success/30 text-success"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}>
            {feedback.correct
              ? "✅ Bonne réponse !"
              : <>❌ Mauvaise réponse — la bonne était : <strong>{feedback.expected}</strong></>}
          </div>
          {feedback.hint && (
            <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
              💡 {feedback.hint}
            </div>
          )}
          <Button onClick={next} variant="secondary" className="w-full" disabled={finalLoading}>
            {isLast ? (finalLoading ? "Finalisation..." : "Terminer cette étape") : "Sous-étape suivante"}
          </Button>
        </>
      )}
    </div>
  );
};

const MiniGameView = ({ step, teamId, teamToken, onCompleted }: GameProps) => {
  // Le contenu envoyé par le serveur ne contient PLUS les bonnes réponses.
  const questions: { q: string; options: string[] }[] = step.content?.questions ?? [];
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ correct: number; wrong: number; total: number; hint: string; results: { answer: string }[] } | null>(null);

  const allAnswered = questions.every((_, i) => answers[i]);

  const handleSubmit = async () => {
    setLoading(true);
    const payload: Record<number, string> = {};
    questions.forEach((_, i) => { payload[i] = answers[i]; });
    const { data, error } = await supabase.rpc("validate_minijeu", {
      p_team_id: teamId, p_token: teamToken, p_step_id: step.id, p_answers: payload as any,
    });
    setLoading(false);
    if (error) { toast.error("Erreur"); return; }
    const r = data as any;
    setResult(r);
    if (r.wrong === 0) toast.success(`Parfait ! ${r.correct}/${r.total} (+${r.correct} pts)`);
    else toast.error(`${r.correct}/${r.total} — ${r.correct} pts gagnés, ${r.wrong} perdus`);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Répondez ensemble à toutes les questions, puis validez.</p>
      {questions.map((q, i) => (
        <div key={i} className="space-y-2">
          <p className="font-medium">{i + 1}. {q.q}</p>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const selected = answers[i] === opt;
              const correctAnswer = result?.results?.[i]?.answer;
              const isRight = result && opt === correctAnswer;
              const isWrongPicked = result && selected && opt !== correctAnswer;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => !result && setAnswers((p) => ({ ...p, [i]: opt }))}
                  disabled={!!result}
                  className={`px-4 py-3 rounded-lg border text-sm transition-smooth text-left ${
                    isRight ? "bg-success/20 border-success text-success"
                    : isWrongPicked ? "bg-destructive/20 border-destructive text-destructive"
                    : selected ? "bg-primary/20 border-primary"
                    : "bg-secondary border-border hover:border-primary/50"
                  }`}
                >{opt}</button>
              );
            })}
          </div>
        </div>
      ))}
      {!result ? (
        <Button onClick={handleSubmit} disabled={!allAnswered || loading} className="w-full" size="lg">
          {loading ? "Validation..." : "Valider mes réponses"}
        </Button>
      ) : (
        <>
          <div className={`rounded-lg p-4 border ${
            result.wrong === 0 ? "bg-success/10 border-success/30 text-success"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}>
            Score : {result.correct}/{result.total} {result.wrong === 0 ? "🎉" : `— ${result.wrong} faute${result.wrong > 1 ? "s" : ""}`}
          </div>
          <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
            💡 Indice : <span className="text-foreground">{result.hint}</span>
          </div>
          <Button onClick={onCompleted} className="w-full" variant="secondary">Continuer</Button>
        </>
      )}
    </div>
  );
};

export default StepView;
