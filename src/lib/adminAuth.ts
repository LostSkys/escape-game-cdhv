// Mot de passe admin hardcodé (à modifier selon les besoins de la CDHV)
// Pour une vraie sécurité en prod, déplacer vers une edge function avec un secret.
export const ADMIN_PASSWORD = "cdhv-admin-2026";

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
