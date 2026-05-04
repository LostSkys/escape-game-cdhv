const KEY = "cdhv_team";

export type StoredTeam = {
  id: string;
  name: string;
  token: string;
};

export const teamStorage = {
  get(): StoredTeam | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as StoredTeam) : null;
    } catch {
      return null;
    }
  },
  set(team: StoredTeam) {
    localStorage.setItem(KEY, JSON.stringify(team));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};
