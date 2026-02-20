import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, UserRole } from '../types/auth';
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

// Helper to fetch role from user_profiles table
const fetchRoleFromProfile = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    const role = (data as Record<string, unknown>)['role'] as string | null;
    return role ? (role as UserRole) : null;
  } catch {
    return null;
  }
};

// Helper to build a User object from a Supabase session user (initial, may update role later)
const buildUserFromSession = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, any>; created_at: string }): User => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  name: sessionUser.user_metadata?.name || sessionUser.email || '',
  role: (sessionUser.user_metadata?.role as UserRole) || 'operator', // Restrictive default; overwritten by user_profiles role
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
    // 1. Detect invite/recovery hash before Supabase clears it
    const initialHash = window.location.hash;
    if (initialHash.includes('type=invite') || initialHash.includes('type=recovery')) {
      setMustSetPassword(true);

      if (initialHash.includes('type=invite') && !window.location.pathname.includes('/intro')) {
        window.location.href = `${window.location.origin}/intro`;
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

          // Fetch role from user_profiles in background, then update
          fetchRoleFromProfile(session.user.id).then(profileRole => {
            if (profileRole && profileRole !== userData.role) {
              setAuthState(prev => prev.user ? {
                ...prev,
                user: { ...prev.user, role: profileRole }
              } : prev);
            }
          });

          // Detect invite or recovery flow
          const hash = window.location.hash;
          const isInvite = hash.includes('type=invite') || hash.includes('access_token=') && event === 'SIGNED_IN';
          const isRecovery = hash.includes('type=recovery');

          if (isInvite || isRecovery) {
            setMustSetPassword(true);

            if (isInvite && !window.location.pathname.includes('/intro')) {
              setTimeout(() => {
                window.location.href = `${window.location.origin}/intro`;
              }, 100);
            }
          }
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

        // Fetch role from user_profiles in background, then update
        fetchRoleFromProfile(session.user.id).then(profileRole => {
          if (profileRole && profileRole !== userData.role) {
            setAuthState(prev => prev.user ? {
              ...prev,
              user: { ...prev.user, role: profileRole }
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
      // Attempt direct login with Supabase Auth
      // Supabase returns generic 'Invalid login credentials' for both
      // non-existent users and wrong passwords, preventing enumeration.
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          // Check if profile exists but user hasn't activated — offer activation
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (userProfile) {
            // Profile exists but login failed — could need activation
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

  const register = async (email: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean; needsActivation?: boolean }> => {
    try {
      // 1. Check if user profile exists in the system (invited users have profiles)
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        return {
          success: false,
          error: 'Error verificando el email. Inténtalo de nuevo.'
        };
      }

      if (!existingProfile) {
        return {
          success: false,
          error: 'Este email no está preconfigurado en el sistema. Contacta al administrador.'
        };
      }

      // 3. If profile exists, attempt normal login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Email o contraseña incorrectos. Verifica tus credenciales.'
          };
        }
        if (signInError.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Email no confirmado. Contacta al administrador.'
          };
        }
        return {
          success: false,
          error: `Error de autenticación: ${signInError.message}`
        };
      }

      if (!signInData.user) {
        return {
          success: false,
          error: 'No se pudo autenticar al usuario.'
        };
      }

      const authUserId = signInData.user.id;

      // 4. Update existing profile
      await supabase
        .from('user_profiles')
        .update({
          name,
          department: role === 'ceo' ? 'Dirección' : 'Sin departamento',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authUserId);

      // 5. Update auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            name,
            role,
            department: role === 'ceo' ? 'Dirección' : 'Sin departamento'
          }
        });
      } catch {
        // Non-critical metadata update failure
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: 'Error inesperado. Por favor, inténtalo de nuevo.'
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
