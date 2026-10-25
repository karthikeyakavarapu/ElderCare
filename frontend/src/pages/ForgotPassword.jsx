import { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send reset link');
      }
      setMessage(data.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">🔐</span>
            <h2>Forgot Password</h2>
            <p>Enter your email to receive a reset link.</p>
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}
          {message && <div style={{background: 'rgba(167, 243, 208, 0.2)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.3)'}}>✅ {message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%' }}
              disabled={loading || !!message}
            >
              {loading ? '⏳ Sending...' : '✉️ Send Recovery Link'}
            </button>
          </form>

          <div className="auth-footer">
            Remember your password? <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
