import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { ACCOUNT_STATUS } from '../data/constants.js';

const AuthContext = createContext(null);

function translateAuthError(error) {
  const message = error?.message ?? '';
  if (message.includes('Invalid login credentials')) return 'Identifiants incorrects.';
  if (message.includes('Email not confirmed')) {
    return 'Confirme ton compte via le lien recu par email avant de te connecter.';
  }
  if (message.includes('User already registered')) return 'Un compte existe deja avec cet email.';
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caracteres.';
  }
  return message || 'Une erreur est survenue.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadIsAdmin = useCallback(async (userId) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
    setIsAdmin(Boolean(data));
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      await loadIsAdmin(data.session?.user?.id);
      if (isMounted) setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      await loadIsAdmin(nextSession?.user?.id);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadIsAdmin]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error));

    const { data: statusRow } = await supabase
      .from('account_status')
      .select('status')
      .eq('user_id', data.user.id)
      .maybeSingle();
    const status = statusRow?.status ?? ACCOUNT_STATUS.ACTIVE;

    if (status === ACCOUNT_STATUS.BANNED) {
      await supabase.auth.signOut();
      throw new Error('Ce compte a ete banni.');
    }
    if (status === ACCOUNT_STATUS.SUSPENDED) {
      await supabase.auth.signOut();
      throw new Error('Ce compte est suspendu. Contacte un administrateur.');
    }

    return data.user;
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw new Error(translateAuthError(error));
    return { user: data.user, needsEmailConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const authUser = session?.user ?? null;
  const currentUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        username: authUser.user_metadata?.username || authUser.email.split('@')[0],
      }
    : null;

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isAdmin,
      isLoading,
      login,
      register,
      logout,
    }),
    [currentUser, isAdmin, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
