import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import logo from "@/assets/cdhv-logo.jpg";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-3xl w-full text-center space-y-10 animate-fade-in-up">
        <header className="space-y-6">
          <img src={logo} alt="Logo Confiserie des Hautes Vosges" className="h-24 mx-auto object-contain" />
          <p className="text-sm uppercase tracking-[0.3em] text-blue-400 font-semibold">
            CDHV · Escape Game
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100">
            Découvrez le <span className="text-blue-400">nouveau bâtiment</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Les organisateurs gèrent le jeu. Les joueurs rejoignent leur équipe pour résoudre les énigmes.
          </p>
        </header>

        <div className="pt-12">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-base h-14 px-8">
            <Link to="/admin">
              <Trophy className="mr-2 h-5 w-5" />
              Accès Organisateur
            </Link>
          </Button>
          
          <div className="pt-8 text-sm text-slate-400">
            <Link to="/inscription" className="text-blue-400 hover:text-blue-300 transition-colors">
              Rejoindre mon équipe →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;
