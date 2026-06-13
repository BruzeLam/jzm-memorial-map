import { useEffect, useState, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabase';
import { isBootstrapAdmin } from '../lib/cloudConfig';
import {
  fetchCollaborators,
  canEditFromList,
  isSuperAdminFromList,
} from '../services/collaborators';

export function useAdminAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false);

  const reloadCollaborators = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setCollaborators([]);
      setCollaboratorsLoaded(true);
      return;
    }
    try {
      const list = await fetchCollaborators();
      setCollaborators(list);
    } catch {
      setCollaborators([]);
    } finally {
      setCollaboratorsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setCollaboratorsLoaded(true);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setCollaborators([]);
      setCollaboratorsLoaded(true);
      return;
    }
    setCollaboratorsLoaded(false);
    reloadCollaborators();
  }, [session?.user?.id, reloadCollaborators]);

  const user = session?.user ?? null;
  const userEmail = user?.email || '';

  const isEditor = useMemo(() => {
    if (!userEmail) return false;
    if (canEditFromList(collaborators, userEmail)) return true;
    // 迁移前 fallback：协作者表未建或拉取失败时，仍认 env 超管
    if (!collaboratorsLoaded || collaborators.length === 0) {
      return isBootstrapAdmin(user);
    }
    return false;
  }, [userEmail, collaborators, collaboratorsLoaded, user]);

  const isSuperAdmin = useMemo(() => {
    if (!userEmail || !isEditor) return false;
    if (isSuperAdminFromList(collaborators, userEmail)) return true;
    if ((!collaboratorsLoaded || collaborators.length === 0) && isBootstrapAdmin(user)) {
      return true;
    }
    return false;
  }, [userEmail, isEditor, collaborators, collaboratorsLoaded, user]);

  /** @deprecated 使用 isEditor */
  const isAdmin = isEditor;

  const signInWithEmail = useCallback(async (email, options = {}) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('未配置 Supabase');
    const redirectTo =
      options.redirectTo ||
      `${window.location.origin}${window.location.pathname.startsWith('/admin') ? '/admin' : '/'}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user,
    isEditor,
    isSuperAdmin,
    isAdmin,
    collaborators,
    collaboratorsLoaded,
    reloadCollaborators,
    loading,
    signInWithEmail,
    signOut,
  };
}
