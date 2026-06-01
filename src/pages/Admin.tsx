import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminAuth } from "@/lib/adminAuth";
import {
  ArrowLeft,
  LogOut,
  Trophy,
  Users,
  CheckCircle,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminSession {
  admin_id: string;
  username: string;
  name: string;
}

interface AdminOption {
  id: string;
  username: string;
  name: string;
}

interface TeamProgress {
  team_id: string;
  team_name: string;
  points: number;
  total_attempts: number;
  correct_answers: number;
  incorrect_answers: number;
  rooms_completed: number;
  total_rooms: number;
  members: string;
  created_by_admin: string;
}

interface LeaderboardEntry {
  rank: number;
  team_name: string;
  points: number;
  members: string;
}

interface AttemptHistory {
  room_order: number;
  room_title: string;
  answer_submitted: string;
  is_correct: boolean;
  points_change: number;
  admin_name: string;
  created_at: string;
}

interface HintProgression {
  room_order: number;
  room_title: string;
  room_type: string;
  unlocked: boolean;
  hint_pieces: string[];
  history_pieces: string[];
  accumulated_clue: string;
}

interface RoomGuideQuestion {
  prompt: string;
  hint: string;
}

interface RoomGuide {
  room_number: number;
  title: string;
  mj: string;
  mini_game: {
    rules: string;
    attention: string;
  };
  questions: RoomGuideQuestion[];
  mini_game_end: {
    title: string;
    hints: string;
  };
}

const roomGuides: RoomGuide[] = [
  {
    room_number: 1,
    title: "Salle 1 - Accueil",
    mj: "Accueillez l'équipe et expliquez le contexte : ils doivent trouver le mot de départ pour lancer l'aventure.",
    mini_game: {
      rules: "Aucun mini-jeu dans cette salle.",
      attention: "Restez clair sur le premier indice.",
    },
    questions: [
      {
        prompt: "Question 1 : En quelle année a été créée la confiserie ? ",
        hint: "Dirigez-les vers l'entrée principale.",
      },
    ],
    mini_game_end: {
      title: "Pas de mini-jeu (fin) pour cette salle",
      hints: "La salle de démarrage est simple : concentrez-vous sur l'accueil.",
    },
  },
  {
    room_number: 2,
    title: "Salle 2 - Massif",
    mj: "Animateur de terrain. Il divise le groupe en deux sous-équipes : les \"pisteurs\" et les \"orienteurs\". Si le groupe piétine, il utilise la boussole pour les guider à haute voix vers le Nord.",
    mini_game: {
      rules: "Mini-jeu : organisez les objets du bureau dans le bon ordre.",
      attention: "Attention à l'ordre, une seule combinaison est correcte.",
    },
    questions: [
      {
        prompt: "Question 1 : Quel animal emblématique des Vosges est représenté sur la table devant vous ? ",
        hint: "on en croise dans les forêts de conifères",
      },
      {
        prompt: "Question 2 : Citez la plante utiliser dans nos bonbons les plus vendus",
        hint: "Son goût provient d'un grand connifère !",
      },
      {
        prompt: "Question 3 : À quelle altitude moyenne se situe la confiserie ?",
        hint: "Regardez la carte des Vosges et trouvez notre emplacement.",
      },
      {
        prompt: "Question 4 : quel est le plus haut sommet de la chaîne des Vosges ?",
        hint: "Faites-les regarder la carte.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 2 : mot final du bureau",
      hints: "Reliez les indices des quatre questions précédentes.",
    },
  },
  {
    room_number: 3,
    title: "Salle 3 - Réunion",
    mj: "Décrivez la salle comme un lieu de réunion où chaque indice est caché dans les documents.",
    mini_game: {
      rules: "Mini-jeu : alignez les documents dans le bon ordre.",
      attention: "Attention à l'ordre logique des éléments.",
    },
    questions: [
      {
        prompt: "Question 1 : mot clé dans l'agenda",
        hint: "Invitez-les à consulter l'agenda et les sujets.",
      },
      {
        prompt: "Question 2 : objet mentionné dans le procès-verbal",
        hint: "Montrez le procès-verbal et cherchez un objet spécifique.",
      },
      {
        prompt: "Question 3 : mot près de la prise",
        hint: "Encouragez-les à inspecter les prises et les câbles.",
      },
      {
        prompt: "Question 4 : terme technique sur la feuille",
        hint: "Cherchez les mots techniques sur les documents.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 3 : mot de la réunion",
      hints: "Les indices sont dans la salle et les documents.",
    },
  },
  {
    room_number: 4,
    title: "Salle 4 - Cérémonie",
    mj: "Présentez la cérémonie avec sérieux et guidez l'équipe vers les symboles.",
    mini_game: {
      rules: "Mini-jeu : ordonnez les éléments du rituel.",
      attention: "Attention à ne pas inverser l'ordre des étapes.",
    },
    questions: [
      {
        prompt: "Question 1 : mot du début de la cérémonie",
        hint: "Mettez-les en condition en parlant du rituel.",
      },
      {
        prompt: "Question 2 : mot sur l'offrande",
        hint: "Faites-les observer l'offrande et ses détails.",
      },
      {
        prompt: "Question 3 : mot sur la banderole",
        hint: "Indiquez la banderole comme élément clé.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 4 : mot de la cérémonie",
      hints: "Les paroles et la musique cachent la clé.",
    },
  },
  {
    room_number: 5,
    title: "Salle 5 - Laboratoire",
    mj: "Expliquez que le laboratoire contient des indices chimiques et des notes de recherche.",
    mini_game: {
      rules: "Mini-jeu : associez les formules et les symboles.",
      attention: "Attention à la bonne correspondance entre formules.",
    },
    questions: [
      {
        prompt: "Question 1 : mot du tableau blanc",
        hint: "Dirigez-les vers le tableau et les annotations.",
      },
      {
        prompt: "Question 2 : composé mentionné dans les notes",
        hint: "Faites-les chercher le bon nom de produit.",
      },
      {
        prompt: "Question 3 : mot du carnet du chercheur",
        hint: "Recherchez la note écrite à la lumière.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 5 : mot de la salle laboratoire",
      hints: "Combinez les indices scientifiques.",
    },
  },
  {
    room_number: 6,
    title: "Salle 6 - Bibliothèque",
    mj: "Présentez la bibliothèque comme un lieu où les mots se cachent dans les livres.",
    mini_game: {
      rules: "Mini-jeu : triez les livres par thème.",
      attention: "Attention à classer chaque livre correctement.",
    },
    questions: [
      {
        prompt: "Question 1 : mot dans le catalogue",
        hint: "Invitez-les à regarder le catalogue des livres.",
      },
      {
        prompt: "Question 2 : mot sur la première page",
        hint: "Concentrez-les sur la première page du bon livre.",
      },
      {
        prompt: "Question 3 : mot de la note de lecture",
        hint: "Cherchez la conclusion de la note.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 6 : mot de la couverture",
      hints: "Le mot est caché dans la couverture imprimée.",
    },
  },
  {
    room_number: 7,
    title: "Salle 7 - Serveurs",
    mj: "Expliquez que le data center cache des indices dans les câbles et les ports.",
    mini_game: {
      rules: "Mini-jeu : reconnectez les bons câbles.",
      attention: "Attention, un câble mal branché change tout.",
    },
    questions: [
      {
        prompt: "Question 1 : mot sur le serveur principal",
        hint: "Faites-les inspecter le serveur et les voyants.",
      },
      {
        prompt: "Question 2 : mot sur le câble rouge",
        hint: "Concentrez-les sur les câbles colorés.",
      },
      {
        prompt: "Question 3 : mot dans le manuel réseau",
        hint: "Cherchez le manuel et le terme réseau.",
      },
      {
        prompt: "Question 4 : mot près du port Ethernet",
        hint: "Observez les ports et leur étiquetage.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 7 : mot de la salle serveur",
      hints: "Cherchez près des racks et des étiquettes.",
    },
  },
  {
    room_number: 8,
    title: "Salle 8 - Révélation",
    mj: "Annoncez la révélation finale et guidez-les vers les symboles dans la salle.",
    mini_game: {
      rules: "Mini-jeu : recombinez les fragments révélés.",
      attention: "Attention à la cohérence des fragments.",
    },
    questions: [
      {
        prompt: "Question 1 : mot du reflet",
        hint: "Montrez le miroir et le reflet à analyser.",
      },
      {
        prompt: "Question 2 : mot de la petite clé",
        hint: "Faites-les examiner la clé et son gravure.",
      },
      {
        prompt: "Question 3 : mot des ombres",
        hint: "Observez les ombres et les formes projetées.",
      },
      {
        prompt: "Question 4 : mot du symbole au sol",
        hint: "Demandez-leur de suivre la trajectoire dessinée.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 8 : mot de la révélation",
      hints: "Reliez la chronologie des indices.",
    },
  },
  {
    room_number: 9,
    title: "Salle 9 - Archives",
    mj: "Expliquez que les archives contiennent des indices anciens à déchiffrer.",
    mini_game: {
      rules: "Mini-jeu : reconstituez le code de classement.",
      attention: "Attention aux codes similaires.",
    },
    questions: [
      {
        prompt: "Question 1 : mot dans les archives",
        hint: "Cherchez les vieux dossiers.",
      },
      {
        prompt: "Question 2 : mot sur la boîte de documents",
        hint: "Inspectez l'étiquette de la boîte.",
      },
      {
        prompt: "Question 3 : mot du panneau de silence",
        hint: "Ecoutez le silence et lisez le panneau.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 9 : mot du coffre des archives",
      hints: "Indexez les dates et trouvez la combinaison.",
    },
  },
  {
    room_number: 10,
    title: "Salle 10 - Rooftop",
    mj: "Présentez le rooftop comme le point culminant où le vent souffle des indices.",
    mini_game: {
      rules: "Mini-jeu : trouvez la bonne combinaison de panneaux.",
      attention: "Attention aux panneaux qui se ressemblent.",
    },
    questions: [
      {
        prompt: "Question 1 : mot du panneau du rooftop",
        hint: "Regardez le panneau extérieur.",
      },
      {
        prompt: "Question 2 : mot gravé sur la rampe",
        hint: "Suivez la rampe jusqu'au mot.",
      },
      {
        prompt: "Question 3 : mot associé à la lune",
        hint: "Cherchez la lune sur les décorations.",
      },
      {
        prompt: "Question 4 : mot de la clé du toit",
        hint: "Inspectez la zone sous le toit.",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 10 : mot de l'aventure sur le toit",
      hints: "Assemblez la carte et les indices météo.",
    },
  },
  {
    room_number: 11,
    title: "Salle 11 - Trésor",
    mj: "Décrivez la salle du trésor comme l'avant-dernière étape.",
    mini_game: {
      rules: "Aucun mini-jeu dans cette salle.",
      attention: "Restez attentif à la phrase-clé.",
    },
    questions: [
      {
        prompt: "Question 1 : mot du trésor",
        hint: "Concentrez-vous sur le coffre et les symboles.",
      },
    ],
    mini_game_end: {
      title: "Pas de mini-jeu (fin) pour cette salle",
      hints: "Cette salle est purement décorative.",
    },
  },
];

const Admin = () => {
  const navigate = useNavigate();
  
  // Login state
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [availableAdmins, setAvailableAdmins] = useState<AdminOption[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [admin, setAdmin] = useState<AdminSession | null>(null);

  // Data states
  const [teams, setTeams] = useState<TeamProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Validation states
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTeamData, setSelectedTeamData] = useState<TeamProgress | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [roomNumber, setRoomNumber] = useState("1");
  const [validating, setValidating] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([]);
  const [hintProgression, setHintProgression] = useState<HintProgression[]>([]);

  const validatedRoomProgress = attemptHistory.reduce<Record<number, number>>((acc, attempt) => {
    if (attempt.is_correct) {
      const roomOrder = attempt.room_order ?? (attempt as any).room_number;
      if (roomOrder != null) {
        acc[roomOrder] = (acc[roomOrder] ?? 0) + 1;
      }
    }
    return acc;
  }, {});

  const roomUnlockStatus = hintProgression.reduce<Record<number, boolean>>((acc, hint) => {
    acc[hint.room_order] = hint.unlocked;
    return acc;
  }, {});

  // Manual points adjustment
  const [pointsAdjustTeam, setPointsAdjustTeam] = useState<string | null>(null);
  const [pointsAdjustValue, setPointsAdjustValue] = useState(0);
  const [adjustingPoints, setAdjustingPoints] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

  // Team creation
  const [createTeamName, setCreateTeamName] = useState("");
  const [createMembers, setCreateMembers] = useState<Array<{ first_name: string; last_name: string }>>([
    { first_name: "", last_name: "" },
    { first_name: "", last_name: "" },
    { first_name: "", last_name: "" },
    { first_name: "", last_name: "" },
    { first_name: "", last_name: "" },
  ]);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Load admins
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, username, name")
        .order("username");

      if (error) {
        console.error("Error loading admins:", error);
        toast.error("Erreur lors du chargement des admins");
        return;
      }

      if (data) {
        const admins: AdminOption[] = data.map((admin: any) => ({
          id: admin.id,
          username: admin.username,
          name: admin.name,
        }));
        setAvailableAdmins(admins);
        if (admins.length > 0) {
          setSelectedAdminId(admins[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading admins:", err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId || !password) {
      toast.error("Sélectionnez un admin et entrez le mot de passe");
      return;
    }

    const selectedAdmin = availableAdmins.find((a) => a.id === selectedAdminId);
    if (!selectedAdmin) {
      toast.error("Admin non trouvé");
      return;
    }

    setLoggingIn(true);

    try {
      const { data, error } = await (supabase.rpc("admin_login", {
        p_username: selectedAdmin.username,
        p_password: password,
      }) as any);

      if (error || !data || !Array.isArray(data) || data.length === 0) {
        toast.error("Mot de passe incorrect");
        setLoggingIn(false);
        return;
      }

      const adminData = data[0];
      adminAuth.setPassword(password);
      setAdmin(adminData);
      toast.success(`Connecté en tant que ${adminData.name}`);
      await loadData(adminData);
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Erreur lors de la connexion");
    } finally {
      setLoggingIn(false);
    }
  };

  // Load all data
  const loadData = async (adminSession: AdminSession) => {
    setLoading(true);
    try {
      const [progressRes, leaderboardRes] = await Promise.all([
        supabase.rpc("get_team_progress", {
          p_team_id: null,
        }) as any,
        supabase.rpc("get_leaderboard") as any,
      ]);

      if (progressRes?.error) {
        console.error("Error loading team progress:", progressRes.error);
        toast.error(`Erreur chargement équipes: ${progressRes.error.message}`);
      } else if (progressRes?.data) {
        console.debug("get_team_progress data:", progressRes.data);
        setTeams(progressRes.data as TeamProgress[]);
      } else {
        console.debug("get_team_progress returned no data", progressRes);
        setTeams([]);
      }

      if (leaderboardRes?.error) {
        console.error("Error loading leaderboard:", leaderboardRes.error);
        toast.error(`Erreur chargement classement: ${leaderboardRes.error.message}`);
      } else if (leaderboardRes?.data) {
        console.debug("get_leaderboard data:", leaderboardRes.data);
        setLeaderboard(leaderboardRes.data as LeaderboardEntry[]);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Erreur interne lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    if (!admin) return;
    setRefreshing(true);
    try {
      await loadData(admin);
      toast.success("Données actualisées");
    } finally {
      setRefreshing(false);
    }
  };

  // Create team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !createTeamName.trim()) {
      toast.error("Nom d'équipe requis");
      return;
    }

    const validMembers = createMembers.filter(
      (m) => m.first_name.trim() || m.last_name.trim()
    );

    if (validMembers.length === 0) {
      toast.error("Au moins un membre requis");
      return;
    }

    setCreatingTeam(true);
    try {
      const { data, error } = await (supabase.rpc("create_team_with_members", {
        p_admin_id: admin.admin_id,
        p_team_name: createTeamName,
        p_members: validMembers,
      }) as any);

      if (error) {
        toast.error("Erreur de création d'équipe");
      } else if (data) {
        toast.success(`Équipe "${createTeamName}" créée`);
        setCreateTeamName("");
        setCreateMembers([
          { first_name: "", last_name: "" },
          { first_name: "", last_name: "" },
          { first_name: "", last_name: "" },
          { first_name: "", last_name: "" },
          { first_name: "", last_name: "" },
        ]);
        await handleRefresh();
      }
    } finally {
      setCreatingTeam(false);
    }
  };

  // Validate answer
  const handleValidateAnswer = async () => {
    if (!admin || !selectedTeam || !roomNumber) {
      toast.error("Équipe et salle requises");
      return;
    }

    setValidating(true);
    try {
      const { data, error } = await (supabase.rpc("validate_answer", {
        p_team_id: selectedTeam,
        p_admin_id: admin.admin_id,
        p_room_order: parseInt(roomNumber),
        p_answer: answerInput.toUpperCase().trim(),
      }) as any);

      if (error) {
        toast.error("Erreur de validation");
      } else if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        if (result.room_completed && !result.is_correct && result.points_change === 0) {
          toast.info("Salle déjà complétée ou toutes les questions sont déjà validées");
        } else if (result.is_correct) {
          toast.success("✅ Réponse correcte ! +1 point");
        } else {
          toast.error("❌ Réponse incorrecte -1 point");
        }
        setAnswerInput("");
        await handleRefresh();
        await loadTeamHistory(selectedTeam);
        await loadTeamHintsProgression(selectedTeam);
      }
    } finally {
      setValidating(false);
    }
  };

  // Load team history
  const loadTeamHistory = async (teamId: string) => {
    try {
      const { data, error } = await (supabase.rpc("get_attempt_history", {
        p_team_id: teamId,
        p_limit: 500,
      }) as any);

      if (data) {
        setAttemptHistory(data as AttemptHistory[]);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  // Load team hints and progression
  const loadTeamHintsProgression = async (teamId: string) => {
    try {
      const { data, error } = await (supabase.rpc("get_team_hints_progression", {
        p_team_id: teamId,
      }) as any);

      if (data) {
        setHintProgression(data as HintProgression[]);
      }
    } catch (err) {
      console.error("Error loading hints progression:", err);
    }
  };

  // Select team for validation
  const selectTeamForValidation = (teamId: string) => {
    setSelectedTeam(teamId);
    setPointsAdjustTeam(teamId);
    const teamData = teams.find((t) => t.team_id === teamId);
    if (teamData) {
      setSelectedTeamData(teamData);
    }
    loadTeamHistory(teamId);
    loadTeamHintsProgression(teamId);
  };

  useEffect(() => {
    if (!selectedTeam) return;
    loadTeamHistory(selectedTeam);
    loadTeamHintsProgression(selectedTeam);
  }, [selectedTeam]);

  // Adjust points
  const handleAdjustPoints = async () => {
    if (!pointsAdjustTeam || pointsAdjustValue === 0) {
      toast.error("Sélectionnez une équipe et une valeur");
      return;
    }

    setAdjustingPoints(true);
    try {
      const team = teams.find((t) => t.team_id === pointsAdjustTeam);
      if (!team) {
        toast.error("Équipe non trouvée");
        return;
      }

      const newPoints = Math.max(0, team.points + pointsAdjustValue);

      const { error } = await supabase
        .from("teams")
        .update({ points: newPoints })
        .eq("id", pointsAdjustTeam);

      if (error) {
        toast.error("Erreur d'ajustement");
      } else {
        const sign = pointsAdjustValue > 0 ? "+" : "";
        toast.success(`Points ajustés: ${sign}${pointsAdjustValue}`);
        setSelectedTeamData((prev) =>
          prev && prev.team_id === pointsAdjustTeam
            ? { ...prev, points: newPoints }
            : prev
        );
        setPointsAdjustValue(0);
        setPointsAdjustTeam(null);
        setShowAdjustDialog(false);
        await handleRefresh();
      }
    } finally {
      setAdjustingPoints(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setAdmin(null);
    setTeams([]);
    setLeaderboard([]);
    setSelectedAdminId("");
    setPassword("");
    setSelectedTeam(null);
    setSelectedTeamData(null);
    setAnswerInput("");
    setRoomNumber("1");
    setAttemptHistory([]);
    toast.success("Déconnecté");
  };


  // Login UI
  if (!admin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>

          <Card className="border-slate-800 bg-slate-950">
            <CardHeader>
              <CardTitle>Espace Organisateur</CardTitle>
              <CardDescription>Connectez-vous pour gérer le jeu</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <p className="text-slate-400 text-center py-8">Chargement des admins...</p>
              ) : availableAdmins.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Aucun admin trouvé</p>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin">Sélectionnez votre compte</Label>
                    <select
                      id="admin"
                      value={selectedAdminId}
                      onChange={(e) => setSelectedAdminId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableAdmins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name} ({admin.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe"
                        autoFocus
                        className="bg-slate-900 border-slate-700 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loggingIn}>
                    {loggingIn ? "Connexion..." : "Entrer"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Main admin dashboard
  return (
    <main className="min-h-screen px-4 py-6 bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Accueil
            </Link>
            <h1 className="text-4xl font-bold">Tableau de Bord</h1>
            <p className="text-sm text-slate-400 mt-2">
              Connecté en tant que: <span className="font-semibold text-slate-200">{admin.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          Dernière actualisation: {lastRefresh.toLocaleTimeString()}
        </p>

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-800">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Validation</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Équipes</span>
            </TabsTrigger>
            <TabsTrigger value="progression" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Indices</span>
            </TabsTrigger>
            <TabsTrigger value="mj-guide" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Guide MJ</span>
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Classement en Direct</CardTitle>
                <CardDescription>
                  {leaderboard.length} équipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Aucune équipe pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-slate-500 w-10 text-center">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{entry.team_name}</p>
                            <p className="text-xs text-slate-400">{entry.members}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">{entry.points} pts</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-6">
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Valider une Réponse</CardTitle>
                <CardDescription>
                  Entrez la réponse d'une équipe pour une salle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team selection */}
                <div className="space-y-2">
                  <Label>Sélectionner l'équipe</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {teams.map((team) => (
                      <button
                        key={team.team_id}
                        onClick={() => selectTeamForValidation(team.team_id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedTeam === team.team_id
                            ? "border-sky-500 bg-sky-950"
                            : "border-slate-800 bg-slate-900 hover:border-slate-700"
                        }`}
                      >
                        <p className="font-semibold text-slate-200">{team.team_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400">
                          <span>{team.points} pts</span>
                          <span>Créée par {team.created_by_admin || 'Inconnu'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTeamData && (
                  <>
                    {/* Room selection */}
                    <div className="space-y-2">
                      <Label>Numéro de la salle (1-12)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="bg-slate-900 border-slate-700"
                      />
                    </div>

                    {/* Answer input */}
                    <div className="space-y-2">
                      <Label>Réponse</Label>
                      <Input
                        type="text"
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="Entrez la réponse..."
                        className="bg-slate-900 border-slate-700"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleValidateAnswer();
                        }}
                      />
                    </div>

                    <Button
                      onClick={handleValidateAnswer}
                      disabled={validating || !answerInput.trim()}
                      className="w-full bg-green-600 hover:bg-green-700 no-accent"
                    >
                      {validating ? "Validation..." : "Valider"}
                    </Button>

                    {/* Attempt history */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <p className="font-semibold text-slate-200 mb-3">Historique des tentatives</p>
                      {attemptHistory.length === 0 ? (
                        <p className="text-slate-400 text-sm">Aucune tentative</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {attemptHistory.map((attempt, idx) => (
                                <div
                            key={idx}
                            className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="font-semibold text-slate-200">
                                  Salle {attempt.room_order}: {attempt.room_title}
                                </span>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                                  attempt.is_correct
                                    ? "border-sky-500 bg-sky-500/15 text-sky-100"
                                    : "border-slate-700 bg-slate-800 text-slate-400"
                                }`}
                              >
                                {attempt.is_correct ? "Validé" : "Incorrect"}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-2">
                              Réponse : {attempt.answer_submitted}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              par {attempt.admin_name} • {new Date(attempt.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manual points adjustment */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-slate-200">
                          Ajustement manuel: {selectedTeamData.points} pts
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAdjustDialog(true)}
                        >
                          Ajuster
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            {/* Create team */}
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Créer une Équipe</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamname">Nom de l'équipe</Label>
                    <Input
                      id="teamname"
                      value={createTeamName}
                      onChange={(e) => setCreateTeamName(e.target.value)}
                      placeholder="Ex: Les Champions"
                      className="bg-slate-900 border-slate-700"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-300">Membres (1 à 5)</p>
                    {createMembers.map((member, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={member.first_name}
                          onChange={(e) => {
                            const newMembers = [...createMembers];
                            newMembers[idx].first_name = e.target.value;
                            setCreateMembers(newMembers);
                          }}
                          placeholder="Prénom"
                          className="bg-slate-900 border-slate-700"
                        />
                        <Input
                          value={member.last_name}
                          onChange={(e) => {
                            const newMembers = [...createMembers];
                            newMembers[idx].last_name = e.target.value;
                            setCreateMembers(newMembers);
                          }}
                          placeholder="Nom"
                          className="bg-slate-900 border-slate-700"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={creatingTeam}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {creatingTeam ? "Création..." : "Créer l'équipe"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Teams list */}
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Toutes les Équipes</CardTitle>
                <CardDescription>{teams.length} équipes</CardDescription>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Aucune équipe</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                      <div
                        key={team.team_id}
                        className="p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-200">{team.team_name}</p>
                            <p className="text-xs text-slate-400 mt-1">{team.members}</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-400">{team.points} pts</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                          <div>
                            <p className="text-slate-500">Tentatives</p>
                            <p className="font-semibold text-slate-200">{team.total_attempts}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Correctes</p>
                            <p className="font-semibold text-green-400">{team.correct_answers}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Incorrectes</p>
                            <p className="font-semibold text-red-400">{team.incorrect_answers}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Salles</p>
                            <p className="font-semibold text-slate-200">
                              {team.rooms_completed}/{team.total_rooms}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progression Tab */}
          <TabsContent value="progression" className="space-y-6">
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Indices et Progression</CardTitle>
                <CardDescription>
                  Suivez la progression et les indices débloqués par l'équipe sélectionnée.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedTeam ? (
                  <p className="text-slate-400 text-sm">Sélectionnez une équipe dans l'onglet Validation pour voir sa progression.</p>
                ) : hintProgression.length === 0 ? (
                  <p className="text-slate-400 text-sm">Aucun indice débloqué pour cette équipe pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {hintProgression.map((hint) => (
                      <div key={hint.room_order} className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-200">Salle {hint.room_order} - {hint.room_title}</p>
                            <p className="text-xs text-slate-400">Type: {hint.room_type}</p>
                          </div>
                          <span className={hint.unlocked ? "text-green-400" : "text-yellow-400"}>
                            {hint.unlocked ? "Débloquée" : "Bloquée"}
                          </span>
                        </div>
                        <div className="grid gap-2 mt-3 text-sm text-slate-300">
                          <p><span className="font-semibold">Indices :</span> {hint.hint_pieces.join(' ') || 'Aucun'}</p>
                          <p><span className="font-semibold">Progression histoire :</span> {hint.history_pieces.join(' ') || 'Aucune'}</p>
                          <p><span className="font-semibold">Clé accumulée :</span> {hint.accumulated_clue || 'Aucune'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MJ Guide Tab */}
          <TabsContent value="mj-guide" className="space-y-6">
            <Card className="border-slate-800 bg-slate-950">
              <CardHeader>
                <CardTitle>Guide MJ</CardTitle>
                <CardDescription>
                  Un guide rapide pour le maître de jeu avec le rôle, les questions et les indices par salle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedTeam ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-300">
                    <p className="text-slate-200 font-semibold mb-2">Aucune équipe sélectionnée</p>
                    <p className="text-sm">
                      Sélectionnez une équipe dans l'onglet Validation pour voir le guide MJ mis à jour avec l'état des questions.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-300">
                    <p className="text-sm text-slate-400">Équipe sélectionnée :</p>
                    <p className="text-lg font-semibold text-slate-100">{selectedTeamData?.team_name || 'Equipe'}</p>
                  </div>
                )}
                {selectedTeam && roomGuides.map((room) => {
                  const correctCount = validatedRoomProgress[room.room_number] ?? 0;
                  const totalQuestions = room.questions.length;
                  const isRoomComplete = roomUnlockStatus[room.room_number] ?? false;
                  const roomStatus = isRoomComplete
                    ? "Validé ✓"
                    : correctCount > 0
                    ? `En cours (${correctCount}/${totalQuestions})`
                    : "En attente";
                  const roomStatusStyle = isRoomComplete
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : correctCount > 0
                    ? "border-sky-400/20 bg-sky-500/10 text-sky-100"
                    : "border-slate-800 bg-slate-900 text-slate-400";
                  const roomTitleStyle = isRoomComplete
                    ? "text-emerald-200"
                    : correctCount > 0
                    ? "text-sky-200"
                    : "text-slate-200";
                  const roomCardStyle = isRoomComplete
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : correctCount > 0
                    ? "border-sky-400/20 bg-sky-500/5"
                    : "border-slate-800 bg-slate-900";

                  return (
                    <div
                      key={room.room_number}
                      className={`p-4 rounded-lg border transition-colors ${roomCardStyle}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className={`text-lg font-semibold ${roomTitleStyle}`}>{room.title}</p>
                          <p className="text-sm text-slate-400">
                            Questions : {totalQuestions} / Mini-jeu (fin) : {room.mini_game_end.title.includes("Pas de") ? 0 : 1} / Mini-jeu : {room.mini_game.rules.includes("Aucun") ? 0 : 1}
                          </p>
                          {correctCount > 0 && !isRoomComplete ? (
                            <p className="text-xs text-sky-200 mt-1">
                              Progression : {correctCount}/{totalQuestions} questions validées
                            </p>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roomStatusStyle}`}>
                          {roomStatus}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 text-sm text-slate-300">
                        <div>
                          <p className="font-semibold text-slate-200">MJ</p>
                          <p>{room.mj}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-200">Mini-jeu</p>
                          <div className="rounded-md border border-slate-800 bg-slate-950 p-3 mt-2">
                            <p className="font-medium text-slate-100">Règles : {room.mini_game.rules}</p>
                            <p className="text-slate-400 text-xs mt-1">Attention : {room.mini_game.attention}</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-200">Questions</p>
                          <div className="space-y-2 mt-2">
                            {room.questions.map((question, idx) => {
                              const questionValidated = isRoomComplete || idx < correctCount;
                              return (
                                <div
                                  key={idx}
                                  className={`rounded-md border p-3 ${
                                    questionValidated
                                      ? "border-emerald-400 bg-emerald-500/10"
                                      : "border-slate-800 bg-slate-950"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium text-slate-100">{question.prompt}</p>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                      questionValidated
                                        ? "bg-emerald-500/20 text-emerald-200"
                                        : "bg-slate-800 text-slate-400"
                                    }`}>
                                      {questionValidated ? "Validé" : "À valider"}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-xs mt-1">Indice : {question.hint}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-200">Mini-jeu (fin)</p>
                          <div className="rounded-md border border-slate-800 bg-slate-950 p-3 mt-2">
                            <p className="font-medium text-slate-100">{room.mini_game_end.title}</p>
                            <p className="text-slate-400 text-xs mt-1">Indices : {room.mini_game_end.hints}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Manual points adjustment dialog */}
      <AlertDialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <AlertDialogContent className="border-slate-800 bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Ajuster les Points</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTeamData?.team_name} - Points actuel: {selectedTeamData?.points}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Équipe</Label>
              <select
                value={pointsAdjustTeam ?? ""}
                onChange={(e) => setPointsAdjustTeam(e.target.value || null)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-md"
              >
                <option value="">Sélectionnez une équipe</option>
                {teams.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_name} ({team.points} pts)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valeur d'ajustement</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPointsAdjustValue(pointsAdjustValue - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={pointsAdjustValue}
                  onChange={(e) => setPointsAdjustValue(parseInt(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-700 text-center"
                />
                <Button
                  variant="outline"
                  onClick={() => setPointsAdjustValue(pointsAdjustValue + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Nouveaux points: {Math.max(0, (teams.find((t) => t.team_id === pointsAdjustTeam)?.points || 0) + pointsAdjustValue)}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdjustPoints}
              disabled={adjustingPoints}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {adjustingPoints ? "Ajustement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Admin;
