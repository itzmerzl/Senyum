import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Lock, LogIn, KeyRound, Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const timerRef = useRef(null);
  const passwordInputRef = useRef(null);

  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 60; // seconds

  // Safe localStorage operations
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error('localStorage setItem error:', error);
        toast.error('Gagal menyimpan preferensi');
        return false;
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('localStorage removeItem error:', error);
        return false;
      }
    }
  };

  // Check if user is blocked on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const blockedUntil = safeLocalStorage.getItem('loginBlockedUntil');
      if (blockedUntil) {
        const remaining = Math.ceil((parseInt(blockedUntil) - Date.now()) / 1000);
        if (remaining > 0) {
          setIsBlocked(true);
          setBlockTimer(remaining);
        } else {
          safeLocalStorage.removeItem('loginBlockedUntil');
        }
      }

      // Load remembered username
      const savedUsername = safeLocalStorage.getItem('rememberedUsername');
      if (savedUsername) {
        setUsername(savedUsername);
        setRememberMe(true);
      }

      setInitialLoading(false);
    };

    initializeAuth();
  }, []);

  // Block timer countdown with cleanup
  useEffect(() => {
    if (blockTimer > 0) {
      timerRef.current = setTimeout(() => {
        setBlockTimer(blockTimer - 1);
      }, 1000);
    } else if (isBlocked && blockTimer === 0) {
      setIsBlocked(false);
      setAttempts(0);
      safeLocalStorage.removeItem('loginBlockedUntil');
      toast.success('Akun sudah bisa digunakan kembali');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [blockTimer, isBlocked]);

  // Detect Caps Lock
  const handleKeyPress = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const validateInput = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'Username wajib diisi';
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = 'Username minimal 3 karakter';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username hanya boleh huruf, angka, dan underscore';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNetworkError(false);

    // Check if blocked
    if (isBlocked) {
      toast.error(`Terlalu banyak percobaan gagal. Coba lagi dalam ${blockTimer} detik.`);
      return;
    }

    // Validate
    if (!validateInput()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(username.trim(), password);

      if (result.success) {
        // Save remember me preference
        if (rememberMe) {
          safeLocalStorage.setItem('rememberedUsername', username.trim());
        } else {
          safeLocalStorage.removeItem('rememberedUsername');
        }

        // Reset attempts
        setAttempts(0);
        setErrors({ username: '', password: '' });
        
        toast.success('Login berhasil!');
        navigate('/dashboard');
      } else {
        // Handle failed login
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          // Block user
          setIsBlocked(true);
          setBlockTimer(BLOCK_DURATION);
          safeLocalStorage.setItem('loginBlockedUntil', (Date.now() + BLOCK_DURATION * 1000).toString());
          toast.error(`Terlalu banyak percobaan gagal. Akun diblokir selama ${BLOCK_DURATION} detik.`);
        } else {
          const remainingAttempts = MAX_ATTEMPTS - newAttempts;
          toast.error(result.error || `Login gagal. ${remainingAttempts} percobaan tersisa.`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setNetworkError(true);
      toast.error('Terjadi kesalahan jaringan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('Atmin');
    setPassword('AtminGanteng');
    setErrors({ username: '', password: '' });
    toast.info('Demo credentials terisi');
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
    setNetworkError(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    setNetworkError(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading skeleton
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .spinner {
          border-color: rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>

      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8 fade-in">
          <div className="inline-block bg-white/10 backdrop-blur-sm p-4 rounded-2xl mb-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Koperasi Senyummu</h1>
          <p className="text-blue-100">Sistem Point of Sales</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <LogIn className="w-7 h-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Login</h2>
          </div>

          {/* Network Error */}
          {networkError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Kesalahan Koneksi</p>
                <p className="text-xs text-red-700 mt-1">
                  Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.
                </p>
              </div>
            </div>
          )}

          {/* Block Warning with Progress */}
          {isBlocked && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">Akun Terblokir</p>
                  <p className="text-xs text-red-700 mt-1">
                    Terlalu banyak percobaan login gagal. Coba lagi dalam {formatTime(blockTimer)}
                  </p>
                </div>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-1000"
                  style={{ width: `${(blockTimer / BLOCK_DURATION) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Failed Attempts Warning */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && !isBlocked && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Percobaan gagal: {attempts}/{MAX_ATTEMPTS} ({MAX_ATTEMPTS - attempts} percobaan tersisa)
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`w-full pl-10 pr-4 py-2.5 border ${
                    errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoFocus
                  disabled={isBlocked}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
              </div>
              {errors.username && (
                <p id="username-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyUp={handleKeyPress}
                  onKeyDown={handleKeyPress}
                  className={`w-full pl-10 pr-12 py-2.5 border ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200`}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={isBlocked}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex="-1"
                  disabled={isBlocked}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              
              {/* Caps Lock Warning */}
              {capsLockOn && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Caps Lock aktif
                </p>
              )}
              
              {errors.password && (
                <p id="password-error" className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  disabled={isBlocked}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer select-none">
                  Ingat saya
                </label>
              </div>
              
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1"
                onClick={() => toast.info('Hubungi administrator untuk reset password')}
              >
                <HelpCircle size={14} />
                Lupa Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username || !password || isBlocked}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              aria-label="Masuk ke sistem"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <KeyRound className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials:</p>
                <div className="text-sm text-blue-700 space-y-1 mb-3">
                  <p><span className="font-medium">Username:</span> Atmin</p>
                  <p><span className="font-medium">Password:</span> AtminGanteng</p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  disabled={isBlocked}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Isi Otomatis
                </button>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              🔒 Koneksi Anda diamankan dengan enkripsi end-to-end
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          © 2025 Koperasi Senyummu. All rights reserved.
        </p>
      </div>
    </div>
  );
}