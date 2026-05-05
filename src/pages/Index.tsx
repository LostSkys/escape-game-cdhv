import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KeyRound, Trophy, Users } from "lucide-react";
import logo from "@/assets/cdhv-logo.jpg";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full text-center space-y-10 animate-fade-in-up">
        <header className="space-y-6">
          <img src={logo} alt="Logo Confiserie des Hautes Vosges" className="h-24 mx-auto object-contain" />
          <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
            CDHV · Escape Game
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold font-display">
            Découvrez le <span className="text-gradient">nouveau bâtiment</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Formez votre équipe, résolvez les énigmes, explorez les salles et grimpez sur le podium.
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base h-14 px-8 animate-pulse-glow">
            <Link to="/inscription"><Users className="mr-2 h-5 w-5" />Inscrire mon équipe</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="text-base h-14 px-8">
            <Link to="/reprendre"><KeyRound className="mr-2 h-5 w-5" />Reprendre la partie</Link>
          </Button>
        </div>

        <div className="pt-8">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-smooth inline-flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Accès organisateur
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Index;
