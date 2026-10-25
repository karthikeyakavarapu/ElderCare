import { useAuth } from '../context/AuthContext';

export default function CaregiverInfo({ elder }) {
  if (!elder || !elder.assigned_caregiver_id) {
    return (
      <div className="card">
        <h2 className="card-title">👨‍⚕️ Caregiver Information</h2>
        <p className="text-muted" style={{ marginTop: '10px' }}>No caregiver has been assigned to this patient yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">👨‍⚕️ Assigned Caregiver</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
          {elder.caregiver_email?.charAt(0).toUpperCase() || 'C'}
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>Assigned Professional</h3>
          <p style={{ margin: '0', color: 'var(--text-muted)' }}>✉️ {elder.caregiver_email}</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--brand-primary)' }}>Status: Active</p>
        </div>
      </div>
    </div>
  );
}
