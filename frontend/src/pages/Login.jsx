import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_EMAIL = 'demo@eldercare.app';
const DEMO_PASSWORD = 'Demo@1234';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err) {
      setError('Demo account unavailable. Please try again shortly.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">🔑</span>
            <h2>Welcome Back</h2>
            <p>Sign in to your ElderCare account</p>
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
                onClick={() => setEmail('karthikakavarapuu@gmail.com')}
              >
                Fill my email address
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '15px', marginTop: '-10px' }}>
              <Link to="/forgot-password" style={{ color: '#8b5cf6', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Forgot Password?</Link>
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🔓 Sign In'}
            </button>
          </form>

          {/* Demo Login */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap' }}>or try without signing up</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button
            id="demo-login"
            type="button"
            className="btn btn-secondary btn-lg"
            style={{ width: '100%', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}
            onClick={handleDemo}
            disabled={demoLoading}
          >
            {demoLoading ? '⏳ Loading demo...' : '🚀 Continue as Demo (Admin)'}
          </button>

          <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', border: '1px dashed rgba(99,102,241,0.3)' }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, textAlign: 'center' }}>
              Demo gives full admin access · SOS alerts → <strong style={{color:'#a5b4fc'}}>karthikakavarapuu@gmail.com</strong>
            </p>
          </div>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
