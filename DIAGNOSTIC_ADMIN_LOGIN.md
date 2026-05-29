# 🔍 DIAGNOSTIC - Problème de Connexion Admin

## ⚠️ Problème Signalé
- Affichage des identifiants en brut (❌ CORRIGÉ - Chargement depuis BDD)
- Erreur de connexion avec le mot de passe (🔍 À DIAGNOSTIQUER)

---

## ✅ CORRECTIONS APPORTÉES

### 1. Admin.tsx - Interface de Login Redessinée
- ❌ AVANT: Placeholder avec `admin1, admin2, admin3 ou admin4`
- ❌ AVANT: Affichage en brut des identifiants et mots de passe
- ✅ APRÈS: Sélection d'admin via dropdown (chargé depuis BDD)
- ✅ APRÈS: Plus d'affichage d'identifiants en brut
- ✅ APRÈS: Message d'erreur plus explicite: "Mot de passe incorrect"

### 2. Index.tsx - Page d'Accueil Simplifiée
- ❌ AVANT: 2 boutons "Inscrire mon équipe" et "Reprendre la partie"
- ✅ APRÈS: Bouton unique "Accès Organisateur"
- ✅ APRÈS: Lien discret "Rejoindre mon équipe" pour les joueurs

---

## 🔧 DIAGNOSTIC POUR LE PROBLÈME DE CONNEXION

Si vous recevez "Mot de passe incorrect", vérifiez que:

### Étape 1: Vérifier les Admins en Base de Données

Allez sur **Supabase Dashboard** > **SQL Editor** et exécutez:

```sql
-- 1. Vérifier que la table admins existe et a du contenu
SELECT COUNT(*) as admin_count FROM public.admins;
```

**Résultat attendu**: `4` (4 admins)

```sql
-- 2. Voir tous les admins
SELECT id, username, name, password_hash FROM public.admins;
```

**Résultat attendu**: 
```
admin1 | Maître du Jeu 1 | <hash MD5>
admin2 | Maître du Jeu 2 | <hash MD5>
admin3 | Maître du Jeu 3 | <hash MD5>
admin4 | Maître du Jeu 4 | <hash MD5>
```

### Étape 2: Tester les Hash MD5

```sql
-- 3. Vérifier le hash MD5 du mot de passe admin1
SELECT 
  username,
  password_hash,
  md5('cdhv-admin-2026-secure-1') as expected_hash,
  password_hash = md5('cdhv-admin-2026-secure-1') as hash_matches
FROM public.admins
WHERE username = 'admin1';
```

**Résultat attendu**: `hash_matches = true`

### Étape 3: Tester la RPC admin_login

```sql
-- 4. Tester la RPC directement
SELECT * FROM public.admin_login('admin1', 'cdhv-admin-2026-secure-1');
```

**Résultat attendu**: Retourne la ligne admin avec admin_id, username, name

**Si erreur**: "Invalid credentials" = mot de passe incorrect

### Étape 4: Si Rien N'est en BDD

Si les tables/admins n'existent pas:

```bash
# Déployer la migration
npx supabase db push --linked
```

---

## 📋 CHECKLIST DE VÉRIFICATION

### Avant de Tester le Login
- [ ] Aller sur Supabase Dashboard
- [ ] SQL Editor > Exécuter les requêtes de diagnostic
- [ ] Confirmer que les 4 admins existent
- [ ] Confirmer que les hash MD5 correspondent
- [ ] Confirmer que la RPC admin_login retourne des résultats

### En cas de Problème
- [ ] Vérifier l'email/projet Supabase correct dans `.env`
- [ ] Vérifier que la migration `20260527_admin_escape_game_complete.sql` a été déployée
- [ ] Vérifier qu'aucune migration n'a échoué
- [ ] Vérifier les logs de Supabase (Dashboard > Logs)

---

## 🚀 PROCHAINES ÉTAPES

### Si les Admins Existent et Hash OK
1. Test de connexion Frontend:
   - Aller à `http://localhost:5173/admin`
   - Sélectionner un admin dans le dropdown
   - Entrer le mot de passe
   - Cliquer "Entrer"

### Si Erreur Persiste
1. Ouvrir la Console (F12)
2. Aller à l'onglet "Network"
3. Tenter la connexion
4. Vérifier la requête RPC et sa réponse
5. Reporter l'erreur exacte

---

## 💡 NOTES

- **Les admins sont maintenant chargés depuis la BDD** (plus d'affichage en brut)
- **Le select dropdown affiche**: `Nom (username)`
- **Les identifiants ne sont plus exposés** sur la page
- **Message d'erreur précis**: "Mot de passe incorrect" au lieu de "Erreur de connexion"

---

**Date**: 27/05/2026 | **Status**: 🟢 Corrections Appliquées - Attendant Diagnostic
