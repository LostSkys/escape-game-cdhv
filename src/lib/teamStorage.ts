// teamStorage.ts
const KEY = "team_data";

export type StoredTeam = {
  team_id: string;
  team_name: string;
  token: string;
};

export const teamStorage = {
  /**
   * Récupère l'équipe stockée
   */
  get(): StoredTeam | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredTeam;
    } catch (error) {
      console.error("Erreur lecture storage:", error);
      return null;
    }
  },

  /**
   * Enregistre l'équipe en convertissant les clés pour Jeu.tsx
   */
  set(team: { team_id: string; team_name: string; token: string }) {
    localStorage.setItem(KEY, JSON.stringify(team));
  },

  /**
   * Supprime les données (Logout)
   */
  clear() {
    localStorage.removeItem(KEY);
  },
};