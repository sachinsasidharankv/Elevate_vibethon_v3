import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'manager' | 'employee';
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // If we have a session, fetch the profile
        if (session?.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (!mounted) return;
            
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData as Profile);
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (!mounted) return;
            
            if (error) {
              console.error('Error fetching profile:', error);
              setProfile(null);
            } else {
              setProfile(profileData as Profile);
            }
          } catch (error) {
            console.error('Profile fetch error:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear all auth-related localStorage items
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt to sign out from Supabase (ignore errors)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (error) {
        // Ignore signout errors - we've already cleared local state
        console.log('Signout error ignored:', error);
      }
      
      // Force page refresh to ensure clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during logout process:', error);
      // Still redirect even if there's an error
      window.location.href = '/auth';
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isManager: profile?.role === 'manager',
    isEmployee: profile?.role === 'employee',
  };
};