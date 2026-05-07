import { supabase } from "@/integrations/supabase/client";

const KEY = "cdhv_admin_pwd";

// Le mot de passe n'est plus stocké côté client : il est validé par le serveur
// à chaque appel. On garde juste le mot de passe en sessionStorage pour le
// renvoyer aux RPCs admin (pas de gain à le sortir du navigateur après login).
export const adminAuth = {
  getPassword(): string | null {
    return sessionStorage.getItem(KEY);
  },
  isAuthed(): boolean {
    return !!sessionStorage.getItem(KEY);
  },
  async login(password: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("admin_check", { p_password: password });
    if (error || !data) return false;
    sessionStorage.setItem(KEY, password);
    return true;
  },
  logout() {
    sessionStorage.removeItem(KEY);
  },
};
