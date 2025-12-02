import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import db from '../config/database';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      // Login
      login: async (username, password) => {
        try {
          const user = await db.users
            .where('username')
            .equals(username)
            .first();
          
          if (!user) {
            throw new Error('Username tidak ditemukan');
          }
          
          if (user.passwordHash !== password) {
            throw new Error('Password salah');
          }
          
          if (!user.isActive) {
            throw new Error('Akun tidak aktif');
          }
          
          // Update last login
          await db.users.update(user.id, {
            lastLogin: new Date()
          });
          
          // Log activity
          await db.activityLogs.add({
            userId: user.id,
            userName: user.fullName,
            action: 'login',
            module: 'auth',
            description: 'User logged in',
            ipAddress: 'localhost',
            createdAt: new Date()
          });
          
          set({ 
            user: { ...user, passwordHash: undefined }, 
            isAuthenticated: true 
          });
          
          return { success: true, user };
        } catch (error) {
          console.error('Login error:', error);
          return { success: false, error: error.message };
        }
      },
      
      // Logout
      logout: async () => {
        const currentUser = get().user;
        
        if (currentUser) {
          await db.activityLogs.add({
            userId: currentUser.id,
            userName: currentUser.fullName,
            action: 'logout',
            module: 'auth',
            description: 'User logged out',
            createdAt: new Date()
          });
        }
        
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