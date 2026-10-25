import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Emergency() {
  const { user, authFetch } = useAuth();
  const [elders, setElders] = useState([]);
  const [selectedElder, setSelectedElder] = useState('');
  const [emergencyType, setEmergencyType] = useState('soc');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadElders();
    loadHistory();
  }, []);

  const loadElders = async () => {
    try {
      const res = await authFetch('/api/dashboard/elders');
      if (res.ok) {
        const data = await res.json();
        setElders(data.elders || []);
        if (data.elders && data.elders.length > 0) {
          setSelectedElder(data.elders[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load elders:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await authFetch('/api/emergency/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.emergencies || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const triggerEmergency = async () => {
    if (!selectedElder) {
      setResult({ type: 'error', message: 'Please select an elder first' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await authFetch('/api/emergency/trigger', {
        method: 'POST',
        body: JSON.stringify({
          elder_id: selectedElder,
          type: emergencyType,
          description: description || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          type: 'success',
          message: `🚨 Emergency triggered for ${data.elder_name}!`,
          notifications: data.notifications
        });
        setDescription('');
        loadHistory();
      } else {
        setResult({ type: 'error', message: data.detail || 'Failed to trigger emergency' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resolveEmergency = async (emergencyId) => {
    try {
      const res = await authFetch(`/api/emergency/resolve/${emergencyId}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        loadHistory();
      }
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="emergency-hero">
          <h1>🚨 SOC Emergency Response</h1>
          <p>Instantly alert caregivers and family members in case of an emergency</p>
        </div>

        {/* Emergency Trigger Section */}
        <div className="emergency-trigger-section">
          <div className="emergency-trigger-card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Trigger Emergency Alert</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Press the button to send immediate notifications via email
            </p>

            {/* Emergency Button */}
            <button
              id="emergency-trigger-btn"
              className="emergency-btn"
              onClick={triggerEmergency}
              disabled={loading || !selectedElder}
              title="Trigger Emergency"
            >
              {loading ? '⏳' : '🚨'}
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              {loading ? 'Sending alerts...' : 'Press to trigger emergency'}
            </p>

            {/* Emergency Form */}
            <div className="emergency-form">
              <div className="form-group">
                <label className="form-label">Select Elder</label>
                <select
                  id="emergency-elder-select"
                  className="form-select"
                  value={selectedElder}
                  onChange={(e) => setSelectedElder(e.target.value)}
                >
                  <option value="">-- Select an Elder --</option>
                  {elders.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} (Age: {e.age})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Type</label>
                <select
                  id="emergency-type-select"
                  className="form-select"
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                >
                  <option value="soc">🚨 SOC (Standard of Care)</option>
                  <option value="medical">🏥 Medical Emergency</option>
                  <option value="fall">⚠️ Fall Detected</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  id="emergency-description"
                  type="text"
                  className="form-input"
                  placeholder="Brief description of the emergency..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '12px',
                background: result.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${result.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: result.type === 'success' ? 'var(--success)' : 'var(--danger)'
              }}>
                <p style={{ fontWeight: '600', marginBottom: '8px' }}>{result.message}</p>
                {result.notifications && result.notifications.length > 0 && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <p>Notifications sent to:</p>
                    {result.notifications.map((n, i) => (
                      <p key={i}>• {n.role}: {n.email} — {n.sent ? '✅ Sent' : '❌ Failed'}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Emergency History */}
        <div className="emergency-history">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>📋 Emergency History</h2>

          {historyLoading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : history.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '2rem', marginBottom: '12px' }}>✅</p>
              <p style={{ color: 'var(--text-secondary)' }}>No emergencies recorded. Stay safe!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="emergency-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Elder</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Date</th>
                    {(user?.role === 'admin' || user?.role === 'caregiver') && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {history.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontWeight: '600', fontSize: '0.85rem' }}>
                          {e.type === 'soc' ? '🚨' : e.type === 'medical' ? '🏥' : e.type === 'fall' ? '⚠️' : '📋'} {e.type}
                        </span>
                      </td>
                      <td>{e.elders?.full_name || '—'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.description || '—'}
                      </td>
                      <td>
                        <span className={`status-badge ${e.status}`}>{e.status}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      {(user?.role === 'admin' || user?.role === 'caregiver') && (
                        <td>
                          {e.status === 'active' && (
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => resolveEmergency(e.id)}
                            >
                              ✅ Resolve
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
