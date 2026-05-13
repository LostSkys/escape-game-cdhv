# 🎮 ESCAPE GAME - Système Complet Implémenté

## ✅ RÉSUMÉ DE L'IMPLÉMENTATION (A→E)

Vous avez demandé un système complet d'escape game avec indices, salles, événements et progression. Voilà ce qui a été créé !

---

## 📋 PHASE A - Migrations BDD

### Fichier: `20260513_escape_game_new_system.sql`

**Nouvelles tables créées:**
- `rooms` (12 salles : 9 QUESTION + 3 EVENT)
- `question_progress` (track par question)
- `room_progress` (track par salle)
- `team_story` (accumulation histoire)

**Colonnes ajoutées à `steps`:**
- `room_id` - La salle auquelle appartient la question
- `question_order` - 1, 2, ou 3 (ordre dans la salle)
- `code_part` - Portion du code de la salle suivante
- `is_active` - false pour les questions inutilisées
- `hint_text` - Indice déverrouillé après 2 erreurs
- `next_question_hint` - Indice pour la prochaine question

**8 RPC créées dans cette migration:**

| RPC | Fonction |
|-----|----------|
| `get_room_questions()` | Récupère les 2-3 questions d'une salle |
| `get_question_by_code()` | Trouve une question par son code |
| `get_room_by_code()` | Trouve une salle par son code |
| `validate_question_answer()` | Valide une réponse, retourne indice + code_part |
| `unlock_room()` | Déverrouille une salle quand codes concaténés sont bons |
| `get_team_hints()` | Retourne les 3 colonnes d'indices |
| `submit_event_code()` | Soumet un code événement + révèle l'histoire |
| `finish_game_v2()` | Finit le jeu et calcule points finaux |

---

## 📊 PHASE B - RPC Backend Supplémentaires

### Fichier: `20260513_rpc_supplementaires.sql`

**10 RPC créées pour l'admin et le gameplay:**

1. **`get_team_progress_detailed()`** - Progression complète par question
2. **`get_team_rooms_progress()`** - Progression par salle
3. **`get_team_status_v2()`** - Statut général de l'équipe
4. **`check_hint_eligibility()`** - Vérifie si indice peut s'afficher (après 2 erreurs)
5. **`get_room_code_parts()`** - Récupère les code_parts d'une salle
6. **`calculate_team_points()`** - Calcule points: `(salles * 100) - (fautes * 10)`
7. **`reset_team_progress()`** - Réinitialise une équipe (pour admin)
8. **`get_team_accumulated_story()`** - Récupère l'histoire accumulée par chapitres
9. **`mark_question_attempted()`** - Marque une question comme tentée
10. **Triggers `update_timestamp()`** - Met à jour les timestamps automatiquement

---

## 🎨 PHASE C - Components React

### 1. **HintsTab.tsx**

Affiche les **3 colonnes d'indices**:

```
┌─────────────────┬──────────────────┬────────────────┐
│  Prochaine Q    │  Prochaine Salle │    Histoire    │
│  (Indice après  │  (Indice pour    │  (Accumulée   │
│   2 erreurs)    │   débloquer)      │   par chap.)    │
└─────────────────┴──────────────────┴────────────────┘
```

**Fonctionnalités:**
- ✅ Auto-refresh **toutes les 5 min**
- ✅ Bouton **"Forcer l'actualisation"**
- ✅ Affiche timestamp dernière actualisation
- ✅ Affiche timestamp prochaine auto-actualisation
- ✅ Récupère les données via `get_team_hints()` + `get_team_accumulated_story()`

### 2. **QuestionView.tsx**

Affiche les **questions d'une salle**:

**Mécanique:**
- Barre de progression question par question
- Affiche titre + contenu de la question
- Formulaire saisie réponse
- Indice se déverrouille **après 2 erreurs** (-1 pt/erreur)
- Affiche indice pour **la prochaine question** si celle-ci est complétée
- Accumule les `code_parts` de chaque question
- Affiche le code salle suivante si **toutes les questions sont résolues**

**Retour:**
- Retourne les `code_parts` concaténés à RoomView

### 3. **RoomView.tsx**

Router vers le bon type de salle:

**Si salle QUESTION:**
- Affiche QuestionView
- Accumule les codes
- Déverrouille la salle suivante via `unlock_room()`

**Si salle EVENT:**
- Valide le code directement
- Affiche l'histoire révélée
- Complète la salle automatiquement

---

## 🎮 PHASE D - Refactor Jeu.tsx

### Structure de la page:

```
Jeu.tsx
├── Onglet "Questions actives" (défaut)
│   ├── Formulaire saisie code
│   ├── Détecte si c'est une salle ou une question
│   └── Affiche RoomView
│
└── Onglet "Indices & Histoire"
    └── Affiche HintsTab (3 colonnes)
```

### Stats affichées:
- ⭐ **Points totaux** (formule: `(salles * 100) - (fautes * 10)`)
- ✅ **Questions validées**
- 🏛️ **Salles complétées**
- ❌ **Fautes** (chaque erreur = -1 pt)

### Mécanique:
- Formulaire code détecte si c'est une **salle** ou une **question**
- RPC `get_team_status_v2()` récupère les stats
- RPC `finish_game_v2()` calcule points finaux
- Auto-refresh des stats à chaque réussite

---

## 📚 PHASE E - 27 Questions Test

### Fichier: `20260513_seed_questions_27.sql`

**Distribution:**

| Salle | Type | Questions | Code Final |
|-------|------|-----------|-----------|
| 1 - Accueil | QUESTION | 3 Q | SALLE02 |
| 2 - Bureau | QUESTION | 2 Q | SALLE03 |
| 3 - Réunion | QUESTION | 3 Q | EVENT01 |
| **4 - Cérémonie** | **EVENT** | **-** | **-** |
| 5 - Labo | QUESTION | 2 Q | SALLE06 |
| 6 - Bibliothèque | QUESTION | 3 Q | SALLE07 |
| 7 - Serveurs | QUESTION | 2 Q | SALLE09 |
| **8 - Révélation** | **EVENT** | **-** | **-** |
| 9 - Archives | QUESTION | 3 Q | SALLE10 |
| 10 - Rooftop | QUESTION | 2 Q | SALLE11 |
| 11 - Trésor | QUESTION | 3 Q | EVENT03 |
| **12 - Finale** | **EVENT** | **-** | **-** |

**Total: 23 questions utilisées + 4 de réserve = 27 questions**

**Contenu narratif des EVENTs:**
- **EVENT 1 (Salle 4)**: Cérémonie révèle premier fragment d'histoire
- **EVENT 2 (Salle 8)**: Révélation du secret du cofondateur
- **EVENT 3 (Salle 12)**: Conclusion - "Le vrai trésor c'est le voyage"

---

## 🔧 MÉCANIQUE COMPLÈTE

### Flux de jeu complet:

```
1. Participant rentre code (ex: SALLE01)
   ↓
2. get_room_by_code() retrouve la salle
   ↓
3. RoomView → QuestionView charge les 2-3 questions
   ↓
4. Participant résout Q1:
   ├─ Réponse correcte → Indice pour Q2 + code_part pour salle suivante
   ├─ 1ère erreur → Message d'erreur
   ├─ 2ème erreur → Indice se déverrouille (-1 pt)
   └─ N-ème erreur → -1 pt par erreur
   ↓
5. Participant résout Q2 et Q3 (même mécanique)
   ↓
6. Tous les code_parts concaténés → Code salle suivante
   ↓
7. unlock_room() valide le code
   ↓
8. Onglet "Indices" s'actualise automatiquement (ou manuellement)
   ├─ Col 1: Prochaine question (de la prochaine salle)
   ├─ Col 2: Indice pour la salle d'après
   └─ Col 3: Nouvelle histoire révélée
   ↓
9. Salle EVENT:
   ├─ Participants trouvent code IRL
   ├─ Rentre le code
   ├─ Histoire s'affiche
   └─ Salle marquée complétée
   ↓
10. Après 12 salles complétées:
    ├─ Bouton "J'ai fini l'escape game"
    ├─ finish_game_v2() calcule points finaux
    └─ Affiche "Partie terminée" + score final
```

### Système de points:

```
Points = (Nombre de salles complétées × 100) - (Nombre de fautes × 10)

Exemple:
- 12 salles complétées = 1200 pts
- 15 fautes = -150 pts
- Score final = 1050 pts

Minimum: 0 pts (pas d'ajustement négatif)
Maximum: 1200 pts (12 salles × 100, 0 faute)
```

### Indices (mécanique):

```
Pour chaque question:

Tentative 1: Mauvaise réponse
├─ Message d'erreur
├─ -1 pt (total_faults++)
└─ Indice: NON

Tentative 2: Mauvaise réponse
├─ Message d'erreur
├─ -1 pt (total_faults++)
├─ Indice: OUI ✅ (hint_unlocked_at = now())
└─ Onglet "Indices" l'affiche dans Col 1

Tentative 3+: Mauvaise réponse
├─ Message d'erreur
├─ -1 pt par erreur
└─ Indice: Toujours visible

Réponse correcte:
├─ Message de succès
├─ +1 code_part pour salle suivante
├─ Affiche indice pour prochaine question
└─ Progresse à la question suivante
```

---

## 📁 Fichiers créés/modifiés

### Migrations (à appliquer à Supabase):
```
supabase/migrations/
├── 20260513_escape_game_new_system.sql          (1 file)
├── 20260513_rpc_supplementaires.sql             (1 file)
└── 20260513_seed_questions_27.sql               (1 file)
```

### Components créés:
```
src/components/
├── HintsTab.tsx                 (Onglet indices + histoire)
├── QuestionView.tsx             (Affichage questions salle)
└── RoomView.tsx                 (Router salle QUESTION/EVENT)
```

### Page modifiée:
```
src/pages/
└── Jeu.tsx                      (Complètement refactorisée)
    ├── Onglets Questions/Indices
    ├── Intègre RoomView + HintsTab
    ├── Nouveau système stats
    └── Formule code détecteur
```

---

## 🚀 PROCHAINES ÉTAPES

### 1. **Appliquer les migrations:**
```bash
supabase migration up
```

### 2. **Tester le système:**
- [ ] Créer une équipe de test
- [ ] Essayer les 12 salles
- [ ] Vérifier les codes concaténés
- [ ] Vérifier les indices (après 2 erreurs)
- [ ] Vérifier auto-refresh 5 min
- [ ] Vérifier points finaux

### 3. **Adapter les contenus:**
- Remplacer les questions par votre contenu réel
- Adapter les indices
- Adapter les histoires des EVENTs
- Adapter les codes si besoin

### 4. **Ajouter validations (optionnel):**
- Validation format codes
- Animation transitions
- Sons/notifications
- Translations

### 5. **Admin panel (optionnel):**
- RPC pour créer/modifier questions
- RPC pour créer/modifier salles
- RPC pour réinitialiser équipes

---

## 🎯 FEATURES COMPLÈTES

✅ **Système de questions par salle (2-3 max)**
✅ **Codes concaténés automatiquement**
✅ **Indices après 2 erreurs (-1 pt/erreur)**
✅ **Onglet indices avec 3 colonnes**
✅ **Auto-refresh indices 5 min + bouton manuel**
✅ **Accumulation histoire par chapitres**
✅ **Salles EVENT avec contenu narratif**
✅ **Système de points (100/salle - 10/faute)**
✅ **27 questions (23 utilisées + 4 réserve)**
✅ **Tous les groupes mêmes questions**
✅ **Mobile responsive (Admin + Jeu)**

---

## 💡 Architecture Vue d'ensemble

```
Escape Game System
│
├─ BDD (Supabase)
│  ├── rooms (12 salles)
│  ├── steps (27 questions)
│  ├── question_progress (track par Q)
│  ├── room_progress (track par salle)
│  ├── team_story (histoire)
│  └── 18 RPC (validation, progression, hints)
│
├─ Frontend (React)
│  ├── Jeu.tsx (page principale + onglets)
│  ├── RoomView.tsx (salle questions/events)
│  ├── QuestionView.tsx (questions)
│  └── HintsTab.tsx (indices + histoire)
│
└── Mécanique
   ├── Progression: Q1 → Q2 → Q3 → Salle suivante
   ├── Codes: code_part1 + part2 + part3 = code salle
   ├── Indices: Après 2 erreurs, auto-refresh 5 min
   ├── Histoire: Accumulée par chapitres
   └── Points: 100/salle - 10/faute
```

---

**Bonne chance pour votre escape game! 🎮✨**
