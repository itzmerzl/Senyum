import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/apiClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      // Login
      login: async (username, password) => {
        try {
          const response = await api.post('auth/login', { username, password });

          if (response.success) {
            localStorage.setItem('authToken', response.token); // Save token
            set({
              user: response.user,
              isAuthenticated: true
            });
            return { success: true, user: response.user };
          } else {
            throw new Error(response.error || 'Login gagal');
          }
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
            await api.post('activityLogs', {
              userId: currentUser.id,
              action: 'logout',
              module: 'auth',
              description: 'User logged out via API',
              createdAt: new Date().toISOString()
            });
          } catch (error) {
            console.error('Error logging logout:', error);
          }
        }

        localStorage.removeItem('authToken'); // Clear token
        set({ user: null, isAuthenticated: false });
      },

      // Check permission
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions?.includes(permission) || false;
      },

      // Check role
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return user.role === role;
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
