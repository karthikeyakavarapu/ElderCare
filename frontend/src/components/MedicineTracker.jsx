import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MedicineTracker({ selectedElderId }) {
  const { authFetch, hasRole } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // New Medicine Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '', dosage: '', frequency: 'Daily', time: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, [selectedElderId]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const url = selectedElderId ? `/api/dashboard/medicines?elder_id=${selectedElderId}` : '/api/dashboard/medicines';
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!selectedElderId && !hasRole('admin')) {
      showMessage('error', 'Select a patient first to add medicine.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/dashboard/medicines', {
        method: 'POST',
        body: JSON.stringify({
          ...newMed,
          elder_id: selectedElderId // Admin/Caregiver must have selected someone
        })
      });

      if (res.ok) {
        showMessage('success', 'Medicine added successfully');
        setShowAddForm(false);
        setNewMed({ name: '', dosage: '', frequency: 'Daily', time: '' });
        loadMedicines();
      } else {
        showMessage('error', 'Failed to add medicine');
      }
    } catch (err) {
      showMessage('error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await authFetch(`/api/dashboard/medicines/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadMedicines();
      }
    } catch (err) {
      showMessage('error', 'Failed to update status');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Medicine Tracker</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor prescribed schedules and adherence.</p>
        </div>
        
        {(hasRole('admin') || hasRole('caregiver')) && selectedElderId && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Medicine'}
          </button>
        )}
      </div>

      {message.text && (
        <div style={{ 
          padding: '12px', borderRadius: '8px', marginBottom: '20px',
          background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddMedicine} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Medicine Name</label>
            <input required type="text" className="form-input" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} placeholder="e.g. Lisinopril" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dosage</label>
            <input required type="text" className="form-input" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} placeholder="e.g. 10mg" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Frequency</label>
            <select className="form-select" value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})}>
              <option>Daily</option>
              <option>Twice Daily</option>
              <option>Weekly</option>
              <option>As needed</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Time instructions</label>
            <input required type="text" className="form-input" value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})} placeholder="e.g. 08:00 AM after meals" />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Save Schedule</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <table className="medicine-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>MEDICINE</th>
              <th>DOSAGE</th>
              <th>SCHEDULE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map(med => (
              <tr key={med.id}>
                <td style={{ fontWeight: '600' }}>{med.name}</td>
                <td>{med.dosage}</td>
                <td>
                  <div style={{ fontSize: '0.9rem' }}>{med.frequency}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{med.time}</div>
                </td>
                <td>
                  <span className={`nav-role-badge`} style={{ 
                    background: med.status === 'taken' ? 'var(--success-bg)' : med.status === 'missed' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    color: med.status === 'taken' ? 'var(--success)' : med.status === 'missed' ? 'var(--danger)' : 'var(--warning)',
                    border: '1px solid currentColor'
                  }}>
                    {med.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {(hasRole('admin') || hasRole('caregiver')) ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleStatusUpdate(med.id, 'taken')}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'var(--success-bg)', color: 'var(--success)', cursor: 'pointer' }}
                        title="Mark Taken"
                      >✓</button>
                      <button 
                        onClick={() => handleStatusUpdate(med.id, 'missed')}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'var(--danger-bg)', color: 'var(--danger)', cursor: 'pointer' }}
                        title="Mark Missed"
                      >✗</button>
                      <button 
                        onClick={() => handleStatusUpdate(med.id, 'pending')}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'var(--warning-bg)', color: 'var(--warning)', cursor: 'pointer' }}
                        title="Reset"
                      >↺</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View Only</span>
                  )}
                </td>
              </tr>
            ))}
            {medicines.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No medicines found. 
                  {(!selectedElderId && (hasRole('admin') || hasRole('caregiver'))) && ' Please select a patient to view or add medicines.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
