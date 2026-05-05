import { useEffect, useState } from "react";
import { Lightbulb, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  hint: string;
  seconds?: number;
  storageKey: string; // pour persister le démarrage du timer par sous-étape
};

/** Affiche un compte à rebours (90s par défaut) puis révèle l'indice. */
const CountdownHint = ({ hint, seconds = 90, storageKey }: Props) => {
  const [remaining, setRemaining] = useState(seconds);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const startKey = `cdhv_timer_${storageKey}`;
    let start = Number(sessionStorage.getItem(startKey));
    if (!start) {
      start = Date.now();
      sessionStorage.setItem(startKey, String(start));
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);
      if (left === 0) setRevealed(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seconds, storageKey]);

  if (revealed) {
    return (
      <div className="text-sm border-l-2 border-primary/60 pl-3 bg-primary/5 py-2 rounded-r animate-fade-in-up">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Lightbulb className="h-4 w-4" /> Indice
        </div>
        <p className="text-foreground mt-1">{hint}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
      <span className="flex items-center gap-2">
        <Timer className="h-4 w-4" />
        Indice débloqué dans {remaining}s
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={() => setRevealed(true)}>
        Révéler l'indice
      </Button>
    </div>
  );
};

export default CountdownHint;
