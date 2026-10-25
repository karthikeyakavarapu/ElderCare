import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── password strength logic ──────────────────────────────────────────────────
function getStrength(pw) {
  const rules = [
    { label: 'At least 8 characters',          pass: pw.length >= 8 },
    { label: 'One uppercase letter (A–Z)',      pass: /[A-Z]/.test(pw) },
    { label: 'One number (0–9)',                pass: /[0-9]/.test(pw) },
    { label: 'One special character (!@#$…)',   pass: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = rules.filter(r => r.pass).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return { rules, score, label: labels[score], color: colors[score] };
}

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '', fullName: '', password: '', confirmPassword: '', role: 'family', phone: ''
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => getStrength(formData.password), [formData.password]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (strength.score < 4) {
      setError('Password is too weak — please meet all 4 requirements below.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(formData.email, formData.fullName, formData.password, formData.role, formData.phone);
      navigate('/dashboard');
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
            <span className="auth-icon">🏥</span>
            <h2>Join ElderCare</h2>
            <p>Create your account to get started</p>
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="signup-name" type="text" name="fullName" className="form-input"
                placeholder="John Doe" value={formData.fullName} onChange={handleChange} required />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input id="signup-email" type="email" name="email" className="form-input"
                placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number (optional)</label>
              <input id="signup-phone" type="tel" name="phone" className="form-input"
                placeholder="+91-XXXXXXXXXX" value={formData.phone} onChange={handleChange} />
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Role</label>
              <select id="signup-role" name="role" className="form-select" value={formData.role} onChange={handleChange}>
                <option value="family">👨‍👩‍👧 Family Member</option>
                <option value="caregiver">🩺 Caregiver</option>
                <option value="admin">🔧 Administrator</option>
              </select>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {formData.role === 'family'    && "• View your elder's health data and trigger emergency alerts"}
                {formData.role === 'caregiver' && '• Manage assigned elders, record health data, respond to emergencies'}
                {formData.role === 'admin'     && '• Full access to all features, users, and system analytics'}
              </p>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6
                  }}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Strength meter — only visible when typing */}
              {formData.password.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {/* coloured bar */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        transition: 'background 0.3s ease',
                        background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)'
                      }} />
                    ))}
                  </div>
                  {/* label */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                  {/* rule checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {strength.rules.map((r, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '0.8rem', transition: 'color 0.2s ease',
                        color: r.pass ? '#22c55e' : 'var(--text-muted)'
                      }}>
                        <span style={{ fontSize: '0.75rem' }}>{r.pass ? '✅' : '○'}</span>
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{
                  borderColor: formData.confirmPassword
                    ? (formData.confirmPassword !== formData.password ? '#ef4444' : '#22c55e')
                    : undefined
                }}
              />
              {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                  ⚠️ Passwords do not match
                </p>
              )}
            </div>

            <button
              id="signup-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || strength.score < 4}
            >
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
