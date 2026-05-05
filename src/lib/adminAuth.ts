// Mot de passe admin hardcodé — CDHV
export const ADMIN_PASSWORD = "cdhv-admin-2026-secure";

const KEY = "cdhv_admin_ok";

export const adminAuth = {
  isAuthed(): boolean {
    return sessionStorage.getItem(KEY) === "1";
  },
  login(password: string): boolean {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(KEY, "1");
      return true;
    }
    return false;
  },
  logout() {
    sessionStorage.removeItem(KEY);
  },
};
