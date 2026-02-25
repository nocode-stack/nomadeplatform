import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './use-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean; needsActivation?: boolean }>;
  activateAccount: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (profileData: Partial<User>) => void;
  changePassword: (newPassword: string) => Promise<boolean>;
  mustSetPassword: boolean;
  setMustSetPassword: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password validation helper
const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' };
  }
  return { valid: true, message: '' };
};

// Helper to fetch department from user_profiles table
const fetchDepartmentFromProfile = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('department')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as Record<string, unknown>)['department'] as string | null;
  } catch {
    return null;
  }
};

// Helper to check if user is active in user_profiles
const checkUserActiveStatus = async (userId: string, email: string): Promise<boolean> => {
  try {
    // Try by user_id first, then by email
    const { data } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      return (data as Record<string, unknown>)['status'] !== 'inactive';
    }

    // Fallback: check by email (for users who haven't completed profile setup)
    const { data: emailData } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('email', email)
      .maybeSingle();

    if (emailData) {
      return (emailData as Record<string, unknown>)['status'] !== 'inactive';
    }

    // No profile found — allow login (profile will be created)
    return true;
  } catch {
    // On error, allow login to avoid blocking legitimate users
    return true;
  }
};

// Helper to build a User object from a Supabase session user
const buildUserFromSession = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, any>; created_at: string }): User => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  name: sessionUser.user_metadata?.name || sessionUser.email || '',
  department: sessionUser.user_metadata?.department,
  avatar: sessionUser.user_metadata?.avatar,
  createdAt: sessionUser.created_at
});

// Helper to ensure user profile exists
const ensureUserProfile = async (user: User): Promise<void> => {
  try {
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          name: user.name,
          email: user.email,
          department: user.department || 'Sin departamento'
        });
    }
  } catch (error) {
    // Non-critical — profile will be created on next login
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  const [mustSetPassword, setMustSetPasswordState] = useState(() => {
    return sessionStorage.getItem('nomade_must_set_password') === 'true';
  });

  const setMustSetPassword = (val: boolean) => {
    sessionStorage.setItem('nomade_must_set_password', val.toString());
    setMustSetPasswordState(val);
  };

  const { toast } = useToast();

  useEffect(() => {
    // 1. Detect invite/recovery from URL hash OR query params before Supabase clears it
    const initialHash = window.location.hash;
    const initialSearch = window.location.search;
    const isInviteUrl = initialHash.includes('type=invite') || initialSearch.includes('type=invite');
    const isRecoveryUrl = initialHash.includes('type=recovery') || initialSearch.includes('type=recovery');

    if (isInviteUrl || isRecoveryUrl) {
      setMustSetPassword(true);

      if (isInviteUrl && !window.location.pathname.includes('/intro')) {
        window.location.href = `${window.location.origin}/intro${window.location.hash}`;
        return;
      }
    }

    // 2. Configure auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData = buildUserFromSession(session.user);

          // Ensure profile exists (non-blocking)
          setTimeout(() => ensureUserProfile(userData), 0);

          // Set auth state immediately so app renders
          setAuthState({
            user: userData,
            isAuthenticated: true,
            isLoading: false
          });

          // Check if user is active in the background — kick out if inactive
          checkUserActiveStatus(session.user.id, session.user.email || '').then(isActive => {
            if (!isActive) {
              supabase.auth.signOut();
              setAuthState({ user: null, isAuthenticated: false, isLoading: false });
            }
          });

          // Fetch department from user_profiles in background, then update
          fetchDepartmentFromProfile(session.user.id).then(profileDept => {
            if (profileDept && profileDept !== userData.department) {
              setAuthState(prev => prev.user ? {
                ...prev,
                user: { ...prev.user, department: profileDept }
              } : prev);
            }
          });

          // Detect invite or recovery flow
          const hash = window.location.hash;
          const search = window.location.search;
          const isInvite = hash.includes('type=invite') || search.includes('type=invite') || (event === 'SIGNED_IN' && !sessionStorage.getItem('nomade_has_logged_in'));
          const isRecovery = hash.includes('type=recovery') || search.includes('type=recovery') || event === 'PASSWORD_RECOVERY';

          if (isInvite || isRecovery) {
            setMustSetPassword(true);

            if (isInvite && !window.location.pathname.includes('/intro')) {
              setTimeout(() => {
                window.location.href = `${window.location.origin}/intro`;
              }, 100);
            }
          }

          // Mark that this user has logged in before
          sessionStorage.setItem('nomade_has_logged_in', 'true');
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          setMustSetPassword(false);
        }
      }
    );

    // Verify existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userData = buildUserFromSession(session.user);

        // Set auth state immediately so app renders
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false
        });

        // Check if user is active in the background — kick out if inactive
        checkUserActiveStatus(session.user.id, session.user.email || '').then(isActive => {
          if (!isActive) {
            supabase.auth.signOut();
            setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          }
        });

        // Fetch department from user_profiles in background, then update
        fetchDepartmentFromProfile(session.user.id).then(profileDept => {
          if (profileDept && profileDept !== userData.department) {
            setAuthState(prev => prev.user ? {
              ...prev,
              user: { ...prev.user, department: profileDept }
            } : prev);
          }
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean; needsActivation?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (userProfile) {
            return {
              success: false,
              error: 'Email o contraseña incorrectos.'
            };
          }

          return {
            success: false,
            error: 'Email o contraseña incorrectos.'
          };
        } else if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            needsConfirmation: true
          };
        } else if (error.message.includes('Too many requests')) {
          return {
            success: false,
            error: 'Demasiados intentos de login. Espera unos minutos antes de intentarlo de nuevo.'
          };
        } else {
          return {
            success: false,
            error: 'Error de conexión. Verifica tu conexión a internet.'
          };
        }
      }

      // Check if the user is active after successful Supabase auth
      if (data?.user) {
        const isActive = await checkUserActiveStatus(data.user.id, email);
        if (!isActive) {
          // Sign out the inactive user immediately
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Tu cuenta ha sido desactivada. Contacta con el administrador.'
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Error inesperado. Inténtalo de nuevo.'
      };
    }
  };

  const activateAccount = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) {
        return {
          success: false,
          error: 'Error enviando el email de activación'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Error inesperado enviando email de activación'
      };
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!authState.user) {
      return false;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast({
        title: "Contraseña no válida",
        description: validation.message,
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast({
          title: "Error de sesión",
          description: "No se ha encontrado una sesión activa. Por favor, intenta cerrar sesión e iniciarla de nuevo.",
          variant: "destructive",
        });
        return false;
      }

      // Refresh session before password update
      await supabase.auth.refreshSession();

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Error al cambiar contraseña",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Hubo un problema al intentar cambiar la contraseña.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    if (!authState.user) return;

    try {
      await supabase.auth.updateUser({
        data: {
          name: profileData.name || authState.user.name,
          department: profileData.department || authState.user.department,
          avatar: profileData.avatar || authState.user.avatar
        }
      });
    } catch {
      // Profile update failure logged silently
    }
  };

  const logout = async () => {
    try {
      // Force local logout first
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });

      // Attempt Supabase logout (non-blocking)
      await supabase.auth.signOut();
    } catch {
      // Ensure local logout always works
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      activateAccount,
      logout,
      updateUserProfile,
      changePassword,
      mustSetPassword,
      setMustSetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
