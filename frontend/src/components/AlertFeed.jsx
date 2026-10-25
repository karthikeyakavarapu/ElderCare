import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AlertFeed() {
  const { authFetch } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await authFetch('/api/emergency/history');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.emergencies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card">Loading alerts...</div>;

  return (
    <div className="card">
      <h2 className="card-title">🚨 Recent Alerts</h2>
      {alerts.length === 0 ? (
        <p className="text-muted">No recent alerts found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{ padding: '15px', borderRadius: '8px', background: alert.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: `1px solid ${alert.status === 'active' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <strong>{alert.elders?.full_name || 'Unknown Patient'}</strong>
                <span style={{ fontSize: '0.8rem', color: alert.status === 'active' ? '#ef4444' : '#22c55e' }}>{alert.status.toUpperCase()}</span>
              </div>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>{alert.description}</p>
              <small style={{ color: 'var(--text-muted)' }}>{new Date(alert.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
