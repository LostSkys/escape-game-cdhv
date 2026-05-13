import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";

interface Question {
  id: string;
  title: string;
  content: Record<string, any>;
  hint_text: string | null;
  next_question_hint: string | null;
  room_id: string | null;
  question_order: number | null;
}

interface QuestionViewProps {
  roomId: string;
  teamId: string;
  teamToken: string;
  onCompleted: (codeParts: string[]) => void;
  onCancel: () => void;
}

interface QuestionProgress {
  faults: number;
  hint_unlocked: boolean;
  completed: boolean;
}

export default function QuestionView({
  roomId,
  teamId,
  teamToken,
  onCompleted,
  onCancel,
}: QuestionViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [progress, setProgress] = useState<Record<string, QuestionProgress>>({});
  const [codeParts, setCodeParts] = useState<string[]>([]);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data: questionsData, error: questionsError } = await supabase.rpc(
        "get_room_questions",
        { p_room_id: roomId }
      );

      if (questionsError) {
        toast.error("Erreur lors du chargement des questions");
        return;
      }

      setQuestions(questionsData as Question[]);

      // Charger la progression
      const { data: progressData, error: progressError } = await supabase.rpc(
        "get_team_progress_detailed",
        { p_team_id: teamId, p_token: teamToken }
      );

      if (progressError) {
        console.error("Erreur progression:", progressError);
        return;
      }

      if (progressData) {
        const progressMap: Record<string, QuestionProgress> = {};
        (progressData as any[]).forEach((p) => {
          progressMap[p.question_id] = {
            faults: p.faults,
            hint_unlocked: p.hint_unlocked,
            completed: p.completed,
          };
        });
        setProgress(progressMap);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentProgress = currentQuestion ? progress[currentQuestion.id] : null;
  const allCompleted = questions.every((q) => progress[q.id]?.completed);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !answer.trim()) return;

    setAnswering(true);
    try {
      const { data: result, error } = await supabase.rpc(
        "validate_question_answer",
        {
          p_team_id: teamId,
          p_question_id: currentQuestion.id,
          p_answer: answer,
        }
      );

      if (error) {
        toast.error("Erreur de validation");
        return;
      }

      if (result.correct) {
        toast.success("✅ Bonne réponse !");
        setAnswer("");

        // Ajouter le code_part
        if (result.code_part) {
          setCodeParts([...codeParts, result.code_part]);
        }

        // Mettre à jour la progression
        await loadQuestions();

        // Passer à la prochaine question
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      } else {
        const newFaults = (currentProgress?.faults || 0) + 1;
        let message = `❌ Mauvaise réponse (-1 pt). Tentative ${newFaults}/2`;

        if (newFaults === 2) {
          message += "\n💡 Indice maintenant disponible !";
        }

        toast.error(message);

        // Recharger la progression pour voir si l'indice s'est déverrouillé
        await loadQuestions();
      }
    } finally {
      setAnswering(false);
    }
  };

  const handleUnlockHint = async () => {
    if (!currentQuestion) return;
    // Les indices se déverrouillent automatiquement après 2 erreurs,
    // on recharge juste la progression
    await loadQuestions();
  };

  if (loading) {
    return (
      <div className="card-elegant rounded-xl p-8 text-center">
        <div className="animate-pulse">Chargement des questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card-elegant rounded-xl p-8 text-center space-y-4">
        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Aucune question dans cette salle.</p>
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const progressPct = (currentQuestionIndex / questions.length) * 100;

  return (
    <div className="card-elegant rounded-xl p-6 space-y-6">
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</span>
          <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {currentQuestion && (
        <>
          {/* Titre de la question */}
          <div>
            <h2 className="text-2xl font-bold">{currentQuestion.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tentatives : {currentProgress?.faults || 0}/2
            </p>
          </div>

          {/* Contenu de la question */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            {currentQuestion.content?.question && (
              <p className="text-base font-semibold">{currentQuestion.content.question}</p>
            )}
            {currentQuestion.content?.riddle && (
              <p className="text-base italic">{currentQuestion.content.riddle}</p>
            )}
            {currentQuestion.content?.description && (
              <p className="text-sm text-muted-foreground">{currentQuestion.content.description}</p>
            )}
          </div>

          {/* Indice - s'affiche après 2 erreurs */}
          {currentProgress?.hint_unlocked && currentQuestion.hint_text && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">💡 Indice déverrouillé</p>
                <p className="text-sm text-amber-700">{currentQuestion.hint_text}</p>
              </div>
            </div>
          )}

          {/* Indice prochain - montrer si complétée */}
          {currentProgress?.completed && currentQuestion.next_question_hint && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">✓ Réponse correcte</p>
                <p className="text-sm text-blue-700 italic">
                  Indice pour la question suivante : {currentQuestion.next_question_hint}
                </p>
              </div>
            </div>
          )}

          {/* Formulaire réponse */}
          {!currentProgress?.completed ? (
            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              <div>
                <Label htmlFor="answer" className="text-base font-semibold">
                  Votre réponse
                </Label>
                <Input
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                  placeholder="Entrez votre réponse..."
                  className="h-12 text-lg font-mono mt-2"
                  disabled={answering}
                  autoFocus
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={answering || !answer.trim()}>
                {answering ? "Vérification..." : "Valider"}
              </Button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-green-800">✅ Question résolue !</p>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {allCompleted && (
          <Button
            onClick={() => onCompleted(codeParts)}
            className="flex-1 bg-success hover:bg-success/90"
          >
            Continuer vers la salle suivante
          </Button>
        )}
      </div>

      {/* Info codes */}
      {allCompleted && codeParts.length > 0 && (
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Code de la salle suivante :</p>
          <p className="font-mono font-bold text-center tracking-widest">{codeParts.join("")}</p>
        </div>
      )}
    </div>
  );
}
