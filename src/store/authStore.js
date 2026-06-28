import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabaseClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      // Login
      login: async (username, password) => {
        try {
          let email = username;

          // 1. If username is not an email, resolve synthetic email via RPC helper
          if (!username.includes('@')) {
            const { data: resolvedEmail, error: rpcError } = await supabase
              .rpc('get_email_by_login_identifier', { p_identifier: username });

            if (rpcError) throw rpcError;
            if (!resolvedEmail) throw new Error('Pengguna tidak ditemukan atau dinonaktifkan');
            email = resolvedEmail;
          }

          // 2. Sign in via Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) throw authError;

          // 3. Fetch detailed profile from public.profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

          const loggedInUser = {
            id: authData.user.id,
            email: authData.user.email,
            fullName: profile.full_name,
            phone: profile.phone,
            role: profile.role, // 'developer', 'admin', 'staff', 'pengasuh', 'wali', 'murid'
            studentId: profile.student_id,
            loginIdentifier: profile.login_identifier,
            photoUrl: profile.photo_url
          };

          // Save token for legacy API client compatibility (just in case)
          localStorage.setItem('authToken', authData.session?.access_token || '');

          set({
            user: loggedInUser,
            isAuthenticated: true
          });
          return { success: true, user: loggedInUser };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: error.message };
        }
      },

      // Logout
      logout: async () => {
        const currentUser = get().user;

        if (currentUser) {
          try {
            // Log logout to activity_logs
            await supabase.from('activity_logs').insert({
              user_id: currentUser.id,
              user_name: currentUser.fullName,
              action: 'logout',
              module: 'auth',
              description: 'User logged out',
              severity: 'info'
            });
          } catch (error) {
            console.error('Error logging logout:', error);
          }
        }

        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error during signOut:', error);
        }

        localStorage.removeItem('authToken'); // Clear token
        set({ user: null, isAuthenticated: false });
      },

      // Check permission
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        // Staff and above have general dashboard access
        return ['developer', 'admin', 'staff'].includes(user.role);
      },

      // Check role
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        // Case-insensitive check to support old casing if any
        return user.role?.toLowerCase() === role?.toLowerCase();
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;

