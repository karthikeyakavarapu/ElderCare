import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Fallback demo user used when the backend is unreachable
const DEMO_FALLBACK_USER = {
  id: 'demo-local',
  email: 'demo@eldercare.app',
  full_name: 'Demo Admin',
  role: 'admin',
  permissions: ['view_all', 'manage_elders', 'manage_users', 'manage_caregivers'],
  phone: '+1-555-0100',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('eldercare_token'));
  const [loading, setLoading] = useState(true);

  // Auto-login as demo admin on every fresh load
  useEffect(() => {
    autoLoginDemo();
  }, []);

  const autoLoginDemo = async () => {
    // If we already have a stored token, verify it first
    const storedToken = localStorage.getItem('eldercare_token');
    if (storedToken) {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setToken(storedToken);
          setLoading(false);
          return;
        }
      } catch (_) {}
    }

    // Try to seed and obtain a real demo token
    try {
      const seedRes = await fetch(`${API_URL}/api/auth/seed-demo`, { method: 'POST' });
      if (seedRes.ok) {
        const seedData = await seedRes.json();
        localStorage.setItem('eldercare_token', seedData.token);
        setToken(seedData.token);
        setUser(seedData.user);
        setLoading(false);
        return;
      }
    } catch (_) {}

    // Backend not reachable — use local fallback so UI still works
    console.warn('ElderCare: backend unreachable, using local demo mode');
    setUser(DEMO_FALLBACK_USER);
    setToken('demo-local-token');
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('eldercare_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const loginDemo = async () => {
    // Seed the demo account (idempotent — safe to call every time)
    const seedRes = await fetch(`${API_URL}/api/auth/seed-demo`, { method: 'POST' });
    const seedData = await seedRes.json();
    if (!seedRes.ok) throw new Error(seedData.detail || 'Demo account unavailable');
    // Seed endpoint returns a ready token — use it directly
    localStorage.setItem('eldercare_token', seedData.token);
    setToken(seedData.token);
    setUser(seedData.user);
    return seedData;
  };

  const signup = async (email, fullName, password, role, phone) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName, password, role, phone })
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
    setToken(null);
    setUser(null);
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
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, loginDemo, signup, logout,
      hasPermission, hasRole, authFetch, isAuthenticated: !!user
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
