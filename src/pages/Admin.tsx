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
  answer: string;
}

interface RoomGuide {
  room_number: number;
  title: string;
  mj: string;
  mini_game: {
    rules: string;
    attention: string;
    answer: string;
  };
  questions: RoomGuideQuestion[];
  mini_game_end: {
    title: string;
    hints: string;
    answer: string;
  };
}

const roomGuides: RoomGuide[] = [
  {
    room_number: 1,
    title: "Salle 1 - Accueil",
    mj: "Accueillez l'équipe et expliquez le contexte : ils doivent trouver le chiffre de départ pour lancer l'aventure.",
    mini_game: {
      rules: "Aucun mini-jeu dans cette salle.",
      attention: "Restez clair sur le premier indice.",
      answer: "rien à trouver dans cette salle, le chiffre de départ est donné dès l'accueil",
    },
    questions: [
      {
        prompt: "Question 1 : En quelle année a été créée la confiserie ? ",
        hint: "Dirigez-les vers l'entrée principale.",
        answer: "1986",
      },
    ],
    mini_game_end: {
      title: "Pas de mini-jeu (fin) pour cette salle",
      hints: "La salle de démarrage est simple : concentrez-vous sur l'accueil.",
      answer: "aucun chiffre a trouver dans cette salle, le chiffre de départ est donné dès l'accueil",
    },
  },
  {
    room_number: 2,
    title: "Salle 2 - Massif",
    mj: "Animateur de terrain. Il divise le groupe en deux sous-équipes : les \"pisteurs\" et les \"orienteurs\".",
    mini_game: {
      rules: "Mini-jeu : Le Pistage du Lynx : Identifier les traces au sol. Chaque trace mène à une lettre. L'ensemble forme le nom d'un sommet vosgien.",
      attention: "Attention à l'ordre, une seule combinaison est correcte.",
      answer: "Tanet",
    },
    questions: [
      {
        prompt: "Question 1 : Quel animal emblématique des Vosges est représenté sur la table devant vous ? ",
        hint: "on en croise dans les forêts de conifères",
        answer: "grand tétras",
      },
      {
        prompt: "Question 2 : Citez la plante utilisée dans nos bonbons les plus vendus",
        hint: "Son goût provient d'un grand connifère !",
        answer: "pin",
      },
      {
        prompt: "Question 3 : À quelle altitude moyenne se situe la confiserie ?",
        hint: "Regardez la carte des Vosges et trouvez notre emplacement.",
        answer: "700",
      },
      {
        prompt: "Question 4 : quel est le plus haut sommet de la chaîne des Vosges ?",
        hint: "Faites-les regarder la carte.",
        answer: "Le grand ballon",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 2 : Utiliser une boussole pour pointer vers le Nord et trouver un indice visuel sur le mur.",
      hints: "Cherchez le composant de base des bonbons.",
      answer: "SUCRE",
    },
  },
  {
    room_number: 3,
    title: "Salle 3 - 5 Sens",
    mj: "Décrivez la salle comme un lieu de grande découverte!",
    mini_game: {
      rules: "Mini-jeu : Dégustation de 6 brisures à l'aveugle. L'équipe doit voter pour identifier les saveurs.",
      attention: "JSP",
      answer: "SAVEURS",
    },
    questions: [
      {
        prompt: "Question 1 : demandez d'identifier la saveur mystère n°3. (Options : Anis, Sapin ou Coquelicot)",
        hint: "On m'associe souvent à une étoile en cuisine",
        answer: "Anis",
      },
      {
        prompt: "Question 2 : Quel sens est le plus sollicité lors de la cuisson du sucre ?",
        hint: "Une histoire de cordes sensibles et de bouillonnements.",
        answer: "ouïe",
      },
      {
        prompt: "Question 3 : Quel ingrédient naturel donne la couleur rouge à nos bonbons ?",
        hint: "Quand on la prépare ça peut tacher nos vêtements en rouge !",
        answer: "betterave",
      },
      {
        prompt: "Question 4 : Trouvez ce qui cloche dans ce paquet de bonbons.",
        hint: "Cherchez le bonbons différent !",
        answer: "Cerise",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 3 : Un test de reconnaissance d'odeurs via des flacons numérotés.",
      hints: "JSP",
      answer: "ODEURS",
    },
  },
  {
    room_number: 4,
    title: "Salle 4 - Labo",
    mj: "Présentez la salle comme le futur laboratoire. ( à complété/remplacé )",
    mini_game: {
      rules: "Mini-jeu : Classez 5 échantillons de sucres du moins sucrant au plus sucrant (Glucose,Fructose, Lactose, Saccharose et Maltose ).",
      attention: "le bon ordre est : (Fructose, Glucose, Saccharose, lactose et Maltose ), donner les deux premiers si nécessaire.",
      answer: "SUCRANT",
    },
    questions: [
      {
        prompt: "Question 1 : Si je vous dis que le Saccharose est un mur de brique, qu'est-ce que le glucose ?",
        hint: "Si le mur est l'assemblage final, je suis l'élément de base que tu tiens dans la main.",
        answer: "BRIQUE",
      },
      {
        prompt: "Question 2 : À quel pourcentage d'humidité le sucre commence-t-il à cristalliser ?",
        hint: "je suis entre 80 et 85",
        answer: "84",
      },
      {
        prompt: "Question 3 : Quel acide naturel est utilisé pour fixer les arômes ?",
        hint: "C'est un mélange entre le mot citron et électrique",
        answer: "Citrique",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 4 :  Peser exactement 152 g de sucre sur une balance de précision sans voir l'écran.",
      hints: "aucun",
      answer: "GRAMMES",
    },
  },
  {
    room_number: 5,
    title: "Salle 5 - Jardin",
    mj: "Expliquez que le jardin est un lieu d'expérimentation où les plantes et les formules se rencontrent.",
    mini_game: {
      rules: "Mini-jeu : Résoudre l'énigme de l'herbier Perdu en associant les plantes réelles (anis, menthe, coquelicot, violette, eucalyptus) aux bonbons correspondants.",
      attention: "Donner des indices sur les plantes si necessaire.",
      answer: "PLANTES",
    },
    questions: [
      {
        prompt: "Question 1 : La Gentiane : est-ce une fleur, une racine ou une feuille ?",
        hint: "pensez au gingembre.",
        answer: "racine",
      },
      {
        prompt: "Question 2 : Quelle plante exotique a des vertus apaisantes pour la gorge ?",
        hint: " c’est le repas préféré du koala.",
        answer: "eucalyptus",
      },
      {
        prompt: "Question 3 : Quel bonbon a des effets apaisants sur la toux ?",
        hint: "C'est l'alliance parfaite entre le travail des abeilles et l'arbre roi de notre forêt vosgienne.",
        answer: "Miel de sapin",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 5 : Trouver la fleur qui n'appartient pas à la flore vosgienne parmi une liste. (L'arnica des montagnes,La digitale pourpre,La pensée des Vosges,Le bougainvillier,Le droséra à feuilles rondes,La gentiane jaune,L'anémone des sylves,la violette)",
      hints: "racourcicez la liste a 4 plantes.",
      answer: "Bougainvillier",
    },
  },
  {
    room_number: 6,
    title: "Salle 6 - Cinéma (à compléter)",
    mj: "Présentez le cinéma comme un lieu où les films se déroulent.",
    mini_game: {
      rules: "Mini-jeu : triez les livres par thème.",
      attention: "Attention à classer chaque livre correctement.",
      answer: "THÈME",
    },
    questions: [
      {
        prompt: "Question 1 : mot dans le catalogue",
        hint: "Invitez-les à regarder le catalogue des livres.",
        answer: "catalogue",
      },
      {
        prompt: "Question 2 : mot sur la première page",
        hint: "Concentrez-les sur la première page du bon livre.",
        answer: "première page",
      },
      {
        prompt: "Question 3 : mot de la note de lecture",
        hint: "Cherchez la conclusion de la note.",
        answer: "note de lecture",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 6 : mot de la couverture",
      hints: "Le mot est caché dans la couverture imprimée.",
      answer: "THÈME",
    },
  },
  {
    room_number: 7,
    title: "Salle 7 - Atelier Fab",
    mj: "Expliquez que l'atelier Fab est un lieu de création et d'innovation.",
    mini_game: {
      rules: "Mini-jeu : L'équipe doit synchroniser ses mouvements pour mimer un confiseur. Chaque membre incarne une étape du processus de fabrication (mélange, cuisson, moulage, emballage).",
      attention: "Attention, une erreur change tout.",
      answer: "CONFISEUR",
    },
    questions: [
      {
        prompt: "Question 1 : À quelle température (°C) le sucre entre-t-il en ébullition ?",
        hint: "C'est bien plus chaud que l'eau qui bout dans une casserole, ajoutez-y la moitié d'une ébullition supplémentaire !",
        answer: "150",
      },
      {
        prompt: "Question 2 : mot sur le câble rouge (à changer)",
        hint: "Concentrez-les sur les câbles colorés.",
        answer: "câble rouge",
      },
      {
        prompt: "Question 3 : Quel matériau est privilégié pour les chaudrons ?",
        hint: "Ce métal a la couleur d'une pièce de 1, 2 ou 5 centimes d'euro.",
        answer: "cuivre",
      },
      {
        prompt: "Question 4 : Me dire quel outils est manquant sur l'établi de travail",
        hint: "Observez les outils et identifiez celui qui est absent.",
        answer: "cuillère",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 7 : Le Guidage Aveugle : Un équipier a les yeux bandés. Les autres lui dictent les gestes précis pour mimer l'étirage du ruban de sucre.",
      hints: "La communication est la clé, chaque mot compte.",
      answer: "COOPÉRATION",
    },
  },
  {
    room_number: 8,
    title: "Salle 8 - Atelier d'antan",
    mj: "Présentez l'atelier d'antan comme un voyage dans le temps pour découvrir les méthodes traditionnelles de fabrication.",
    mini_game: {
      rules: "Mini-jeu : Faire traverser un parcours d'obstacles à l'équipier aveugle pour l'amener à mimer précisément les gestes historiques de fabrication (satinage et étirage).",
      attention: "Attention à la coordination et à la précision des gestes, chaque étape doit être respectée pour réussir.",
      answer: "GESTES HISTORIQUES",
    },
    questions: [
      {
        prompt: "Quel est le geste technique pour incorporer de l'air dans la pâte à sucre ?",
        hint: "On le fait tous après une bonne sieste!",
        answer: "étirage/satinage",
      },
      {
        prompt: "Question 2 : Combien de temps de repos faut-il à la pâte avant le découpage ?",
        hint: "Si vous vous asseyez pour boire un café, c'est foutu. C'est une course contre la montre !",
        answer: "AUCUN",
      },
      {
        prompt: "Question 3 : Quelle est la fonction principale du cylindre dans la forme du bonbon ?",
        hint: "C'est le synonyme parfait de mise en forme ou de façonnage.",
        answer: "Modelage",
      },
      {
        prompt: "Question 4 : A combien de degrès est la pate a bonbon lorsqu'elle sort du chaudront ? (à changer)",
        hint: "C'est plus chaud que l'eau bouillante, mais pas encore à la température de l'étirage.",
        answer: "130",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 8 : ?",
      hints: "Reliez la chronologie des indices.",
      answer: "RÉVÉLATION",
    },
  },
  {
    room_number: 9,
    title: "Salle 9 - Magasin éphémère",
    mj: "Expliquez que les archives contiennent des indices anciens à déchiffrer.",
    mini_game: {
      rules: "Mini-jeu : Repérer l'anomalie dans les affichages des bonbons et de leur prix.",
      attention: "Attention, une seule anomalie est pertinente.",
      answer: "ANOMALIE",
    },
    questions: [
      {
        prompt: "Question 1 : Quel est le mot disparu de la recette secrète historique affichée au mur ?",
        hint: "C'est l'état d'un aliment après un passage sur le feu, mais c'est aussi un mot familier pour dire qu'on a un peu trop bu ou qu'on est fatigué.",
        answer: "Cuit",
      },
      {
        prompt: "Question 2 : Quel est le produit le plus vendu historiquement à la CDHV ? ",
        hint: "on en a parlé dans le massif.",
        answer: "Bourgeon de sapin",
      },
      {
        prompt: "Question 3 : Combien de sachets de 250g faut-il pour faire un kilo de bonheur ?",
        hint: "Question piège.",
        answer: "4 en math /1 emotionnellement",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 9 :  Composer un panier harmonieux avec 5 couleurs de bonbons différents pour en estimer le Juste Prix de tête.",
      hints: "JSP",
      answer: "PRIX",
    },
  },
  {
    room_number: 10,
    title: "Salle 10 - Repos (à compléter)",
    mj: "Présentez le rooftop comme le point culminant où le vent souffle des indices.",
    mini_game: {
      rules: "Mini-jeu : Analyser le plan officiel pour tracer l'itinéraire le plus court d'un colis.",
      attention: "Attention, chaque détour peut coûter des points précieux.",
      answer: "MAP",
    },
    questions: [
      {
        prompt: "Question 1 : mot du panneau du rooftop",
        hint: "Regardez le panneau extérieur.",
        answer: "panneau du rooftop",
      },
      {
        prompt: "Question 2 : mot gravé sur la rampe",
        hint: "Suivez la rampe jusqu'au mot.",
        answer: "gravure sur la rampe",
      },
      {
        prompt: "Question 3 : mot associé à la lune",
        hint: "Cherchez la lune sur les décorations.",
        answer: "lune",
      },
      {
        prompt: "Question 4 : mot de la clé du toit",
        hint: "Inspectez la zone sous le toit.",
        answer: "clé du toit",
      },
    ],
    mini_game_end: {
      title: "Mini-jeu (fin) 10 : mot de l'aventure sur le toit",
      hints: "Assemblez la carte et les indices météo.",
      answer: "COMBINAISON",
    },
  },
  {
    room_number: 11,
    title: "Salle 11 - Trésor/FIN",
    mj: "Décrivez la salle du trésor comme la dernière étape.",
    mini_game: {
      rules: "Aucun mini-jeu dans cette salle.",
      attention: "Restez attentif à la phrase-clé.",
      answer: "aucun mot a trouver dans cette salle, le mot final est révélé dans la phrase-clé",
    },
    questions: [
      {
        prompt: "Question 1 : Pas de question ici, il vous suffit juste de recoller tous vos indices pour finir l'escape game!",
        hint: "Cette salle est dédiée à la révélation finale.",
        answer: "tresor",
      },
    ],
    mini_game_end: {
      title: "Pas de mini-jeu (fin) pour cette salle",
      hints: "Cette salle est purement décorative.",
      answer: "aucun mot a trouver dans cette salle, le mot final est révélé dans la phrase-clé",
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
                            <p className="text-slate-400 text-xs mt-1">Réponse : {room.mini_game.answer}</p>
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
                                  <p className="text-slate-400 text-xs mt-1">Réponse : {question.answer}</p>
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
                            <p className="text-slate-400 text-xs mt-1">Réponse : {room.mini_game_end.answer}</p>
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
