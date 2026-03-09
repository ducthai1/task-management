"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Auth error:", error.message);
        }
        if (mounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to get user:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }, [supabase]);

  return { user, loading, signOut };
}
