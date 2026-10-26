import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Demo fallback user ────────────────────────────────────────────────────
// This is set SYNCHRONOUSLY as the initial state so the app NEVER shows a
// loading / unauthenticated state.  A background effect then upgrades to a
// real server session once the API responds.
const DEMO_FALLBACK_USER = {
  id: 'demo-local',
  email: 'demo@eldercare.app',
  full_name: 'Demo Admin',
  role: 'admin',
  permissions: [
    'dashboard:full', 'users:manage', 'elders:manage',
    'emergency:manage', 'messages:all', 'analytics:full',
  ],
  phone: '+1-555-0100',
};

const DEMO_FALLBACK_TOKEN = 'demo-local-token';

// ─── Helper: get the initial user/token synchronously from localStorage ────
function getInitialState() {
  const storedToken = localStorage.getItem('eldercare_token');
  // We don't know if the stored token is valid yet — but we still
  // start the app as "authenticated" with the fallback user so the
  // dashboard renders immediately.  The background effect will
  // replace this with real server data.
  return {
    user: DEMO_FALLBACK_USER,
    token: storedToken || DEMO_FALLBACK_TOKEN,
  };
}

export function AuthProvider({ children }) {
  const initial = getInitialState();
  const [user, setUser]   = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  // loading is always false — we're synchronously authenticated
  const [loading] = useState(false);

  // Background effect: try to get a real server session
  useEffect(() => {
    upgradeToRealSession();
  }, []);

  const upgradeToRealSession = async () => {
    const storedToken = localStorage.getItem('eldercare_token');

    // 1. If we have a stored token, try to verify it
    if (storedToken && storedToken !== DEMO_FALLBACK_TOKEN) {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ ...data, id: data.id || data.user_id });
          setToken(storedToken);
          return;
        }
      } catch (_) {}
    }

    // 2. Call seed-demo to get a real admin token
    try {
      const seedRes = await fetch(`${API_URL}/api/auth/seed-demo`, { method: 'POST' });
      if (seedRes.ok) {
        const seedData = await seedRes.json();
        localStorage.setItem('eldercare_token', seedData.token);
        setToken(seedData.token);
        setUser(seedData.user);
        return;
      }
    } catch (_) {}

    // 3. Backend unreachable — keep the fallback user (already set)
    console.warn('ElderCare: backend unreachable, using local demo mode');
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('eldercare_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const loginDemo = async () => {
    const seedRes = await fetch(`${API_URL}/api/auth/seed-demo`, { method: 'POST' });
    const seedData = await seedRes.json();
    if (!seedRes.ok) throw new Error(seedData.detail || 'Demo account unavailable');
    localStorage.setItem('eldercare_token', seedData.token);
    setToken(seedData.token);
    setUser(seedData.user);
    return seedData;
  };

  const signup = async (email, fullName, password, role, phone) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, password, role, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Signup failed');
    localStorage.setItem('eldercare_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('eldercare_token');
    setToken(DEMO_FALLBACK_TOKEN);
    setUser(DEMO_FALLBACK_USER);
    // Re-seed in background so they get fresh demo data
    upgradeToRealSession();
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const authFetch = async (url, options = {}) => {
    const currentToken = localStorage.getItem('eldercare_token') || token;
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken && currentToken !== DEMO_FALLBACK_TOKEN
        ? { 'Authorization': `Bearer ${currentToken}` }
        : {}),
      ...options.headers,
    };
    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (res.status === 401) {
      // Silently re-seed and ask caller to retry
      await upgradeToRealSession();
      throw new Error('Session refreshed. Please retry.');
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, loginDemo, signup, logout,
      hasPermission, hasRole, authFetch,
      isAuthenticated: true,   // always true — no login wall
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
