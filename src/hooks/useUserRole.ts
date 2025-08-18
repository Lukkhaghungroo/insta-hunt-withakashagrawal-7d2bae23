import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .rpc('get_user_roles', { _user_id: session.user.id });

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default to user role
        } else if (data && data.length > 0) {
          // If user has multiple roles, prioritize admin > moderator > user
          const roles = data.map(r => r.role);
          if (roles.includes('admin')) {
            setUserRole('admin');
          } else if (roles.includes('moderator')) {
            setUserRole('moderator');
          } else {
            setUserRole('user');
          }
        } else {
          setUserRole('user'); // Default to user role if no roles found
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || userRole === 'admin';
  const hasRole = (role: UserRole) => userRole === role;

  return {
    userRole,
    loading,
    isAdmin,
    isModerator,
    hasRole
  };
};