import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import MedicineTracker from '../components/MedicineTracker';
import AlertFeed from '../components/AlertFeed';
import CaregiverInfo from '../components/CaregiverInfo';
import ChatModule from '../components/ChatModule';
import CareTaskChecklist from '../components/CareTaskChecklist';
import AdminCharts from '../components/AdminCharts';
import CaregiverCharts from '../components/CaregiverCharts';
import FamilyCharts from '../components/FamilyCharts';
import Datasets from '../components/Datasets';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 15, 46, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '8px',
        padding: '12px 16px',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ color: '#a5b4fc', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontSize: '0.9rem', margin: '2px 0' }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, authFetch, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // Data States
  const [elders, setElders] = useState([]);
  const [selectedElder, setSelectedElder] = useState(null);
  const [stats, setStats] = useState(null);
  const [healthData, setHealthData] = useState([]);
  const [emergencyData, setEmergencyData] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [caregiversList, setCaregiversList] = useState([]);
  const [familyMembersList, setFamilyMembersList] = useState([]);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [newMetric, setNewMetric] = useState({
    heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
    temperature: '', oxygen_level: '', activity_level: 'light', notes: ''
  });

  const [newElder, setNewElder] = useState({
    full_name: '', age: '', gender: 'male', blood_group: '',
    medical_conditions: '', allergies: ''
  });

  // Assignment States
  const [assignment, setAssignment] = useState({ caregiverId: '', familyId: '' });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedElder) {
      loadElderSpecificData(selectedElder.id);
      setAssignment({
        caregiverId: selectedElder.assigned_caregiver_id || '',
        familyId: selectedElder.family_contact_id || ''
      });
    } else {
      loadAggregateHealth();
    }
  }, [selectedElder]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const eldersRes = await authFetch('/api/dashboard/elders');
      if (eldersRes.ok) {
        const data = await eldersRes.json();
        setElders(data.elders || []);
        // Auto-select if only one (Family/Caregiver role case)
        if (data.elders && data.elders.length === 1) {
          setSelectedElder(data.elders[0]);
        }
      }

      const statsRes = await authFetch('/api/dashboard/stats');
      if (statsRes.ok) setStats(await statsRes.json());

      const emerRes = await authFetch('/api/dashboard/emergency-summary');
      if (emerRes.ok) {
        const eData = await emerRes.json();
        setEmergencyData(eData.by_type || []);
      }

      if (hasRole('admin')) {
        const usersRes = await authFetch('/api/dashboard/users');
        if (usersRes.ok) {
          const uData = await usersRes.json();
          setUsersList(uData.users || []);
        }
        
        const caregiversRes = await authFetch('/api/dashboard/caregivers');
        if (caregiversRes.ok) {
          const cData = await caregiversRes.json();
          setCaregiversList(cData.caregivers || []);
        }

        const familyRes = await authFetch('/api/dashboard/family-members');
        if (familyRes.ok) {
          const fData = await familyRes.json();
          setFamilyMembersList(fData.family_members || []);
        }
      }
      
      await loadAggregateHealth();
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAggregateHealth = async () => {
    try {
      const healthRes = await authFetch('/api/dashboard/health-metrics?days=7');
      if (healthRes.ok) {
        const hData = await healthRes.json();
        formatHealthData(hData.metrics || []);
      }
    } catch (err) {}
  };

  const loadElderSpecificData = async (elderId) => {
    try {
      const healthRes = await authFetch(`/api/dashboard/health-metrics?elder_id=${elderId}&days=7`);
      if (healthRes.ok) {
        const hData = await healthRes.json();
        formatHealthData(hData.metrics || []);
      }
    } catch (err) {}
  };

  const formatHealthData = (metrics) => {
    const formatted = metrics.map(m => ({
      day: new Date(m.recorded_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
      heart_rate: m.heart_rate,
      oxygen_level: m.oxygen_level,
      temperature: m.temperature,
      bp_systolic: m.blood_pressure_systolic,
      bp_diastolic: m.blood_pressure_diastolic
    }));
    setHealthData(formatted);
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (!selectedElder) {
      setMessage({ type: 'error', text: 'Please select a patient first' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        elder_id: selectedElder.id,
        heart_rate: newMetric.heart_rate ? parseInt(newMetric.heart_rate) : null,
        blood_pressure_systolic: newMetric.blood_pressure_systolic ? parseInt(newMetric.blood_pressure_systolic) : null,
        blood_pressure_diastolic: newMetric.blood_pressure_diastolic ? parseInt(newMetric.blood_pressure_diastolic) : null,
        temperature: newMetric.temperature ? parseFloat(newMetric.temperature) : null,
        oxygen_level: newMetric.oxygen_level ? parseInt(newMetric.oxygen_level) : null,
        activity_level: newMetric.activity_level,
        notes: newMetric.notes || null,
      };

      const res = await authFetch('/api/dashboard/health-metrics', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Metrics saved!' });
        setNewMetric({
          heart_rate: '', blood_pressure_systolic: '', blood_pressure_diastolic: '',
          temperature: '', oxygen_level: '', activity_level: 'light', notes: ''
        });
        loadElderSpecificData(selectedElder.id);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.detail || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleAddElder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/dashboard/elders', {
        method: 'POST',
        body: JSON.stringify({
          ...newElder,
          age: parseInt(newElder.age)
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Elder profile created!' });
        setNewElder({ full_name: '', age: '', gender: 'male', blood_group: '', medical_conditions: '', allergies: '' });
        loadInitialData(); // Refresh list
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.detail || 'Failed to create' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleAssign = async (type) => {
    setAssigning(true);
    const endpoint = type === 'caregiver' ? '/api/dashboard/assign-caregiver' : '/api/dashboard/assign-family';
    const payload = type === 'caregiver' 
      ? { elder_id: selectedElder.id, caregiver_id: assignment.caregiverId }
      : { elder_id: selectedElder.id, family_id: assignment.familyId };

    try {
      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedElder(data.elder);
        setMessage({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} assigned!` });
        loadInitialData();
      }
    } catch (err) {} finally {
      setAssigning(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const filteredElders = elders.filter(e => 
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsCards = stats && (
    <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
      <div className="stat-widget">
        <div className="stat-widget-icon">👴</div>
        <div className="stat-widget-value">{stats.total_elders}</div>
        <div className="stat-widget-label">Total Patients</div>
      </div>
      {hasRole('admin') && (
        <div className="stat-widget">
          <div className="stat-widget-icon">🩺</div>
          <div className="stat-widget-value">{stats.total_caregivers}</div>
          <div className="stat-widget-label">Caregivers</div>
        </div>
      )}
      <div className="stat-widget">
        <div className="stat-widget-icon">🚨</div>
        <div className="stat-widget-value" style={{ color: stats.active_emergencies > 0 ? '#ef4444' : undefined }}>{stats.active_emergencies}</div>
        <div className="stat-widget-label">Active Alerts</div>
      </div>
      <div className="stat-widget">
        <div className="stat-widget-icon">✉️</div>
        <div className="stat-widget-value">{stats.messages_sent}</div>
        <div className="stat-widget-label">Care Comms</div>
      </div>
    </div>
  );

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} selectedElder={selectedElder}>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {message.text && (
            <div style={{ 
              padding: '12px 20px', borderRadius: '8px', marginBottom: '24px', animation: 'slideDown 0.3s ease',
              background: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
            }}>
              {message.text}
            </div>
          )}

          {/* TAB CONTENT: ANALYTICS */}
          {activeTab === 'analytics' && (
            <section>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                  {hasRole('admin') ? 'System Intelligence' : hasRole('caregiver') ? 'Shift Analytics' : 'Family Wellness Report'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {hasRole('admin') ? 'Facility-wide health trends, operations, and clinical statistics' : hasRole('caregiver') ? 'Real-time overview of your assigned residents' : 'Easy-to-understand health and wellness updates'}
                </p>
              </div>
              {hasRole('admin') && statsCards}
              {hasRole('admin') && <AdminCharts />}
              {hasRole('caregiver') && <CaregiverCharts />}
              {hasRole('family') && <FamilyCharts />}
            </section>
          )}

          {/* TAB CONTENT: PATIENTS */}
          {activeTab === 'patients' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Patients Directory</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>Clinical records and personnel management</p>
                </div>
                {!hasRole('family') && (
                  <div style={{ position: 'relative', width: '300px' }}>
                    <input 
                      type="text" placeholder="Search patients..." className="form-input" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '11px', opacity: 0.5 }}>🔍</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedElder ? '350px 1fr' : '1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredElders.map(elder => (
                    <div 
                      key={elder.id}
                      onClick={() => setSelectedElder(elder)}
                      style={{
                        padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s ease',
                        background: selectedElder?.id === elder.id ? 'var(--accent-gradient)' : 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        boxShadow: selectedElder?.id === elder.id ? '0 10px 20px rgba(99,102,241,0.2)' : 'none',
                        transform: selectedElder?.id === elder.id ? 'translateY(-2px)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem', color: selectedElder?.id === elder.id ? 'white' : 'var(--text-primary)' }}>{elder.full_name}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Age: {elder.age}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`nav-role-badge ${elder.caregiver_email ? 'caregiver' : 'family'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          {elder.caregiver_email ? 'Assigned' : 'Unassigned'}
                        </span>
                        {elder.blood_group && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)' }}>Type {elder.blood_group}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredElders.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No patients found.</p>}
                </div>

                {selectedElder && (
                  <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedElder.full_name}'s Profile</h2>
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('vitals')}>Update Vitals</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                      <div>
                        <h4 style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '12px' }}>Medical Context</h4>
                        <p style={{ marginBottom: '8px' }}><strong>Conditions:</strong> {selectedElder.medical_conditions || 'None'}</p>
                        <p><strong>Allergies:</strong> {selectedElder.allergies || 'None'}</p>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--accent-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '12px' }}>Care Team</h4>
                        <p style={{ marginBottom: '8px' }}><strong>Caregiver:</strong> {selectedElder.caregiver_email || 'Unassigned'}</p>
                        <p><strong>Family Link:</strong> {selectedElder.family_contact_email || 'Unassigned'}</p>
                      </div>
                    </div>

                    {hasRole('admin') && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '20px' }}>🛠️ Assignment Management</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div className="form-group">
                            <label className="form-label">Assign Caregiver</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select className="form-select" value={assignment.caregiverId} onChange={(e) => setAssignment({...assignment, caregiverId: e.target.value})}>
                                <option value="">Select Caregiver</option>
                                {caregiversList.map(cg => <option key={cg.id} value={cg.id}>{cg.full_name}</option>)}
                              </select>
                              <button className="btn btn-primary" onClick={() => handleAssign('caregiver')} disabled={assigning}>✓</button>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Assign Family</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select className="form-select" value={assignment.familyId} onChange={(e) => setAssignment({...assignment, familyId: e.target.value})}>
                                <option value="">Select Family</option>
                                {familyMembersList.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                              </select>
                              <button className="btn btn-primary" onClick={() => handleAssign('family')} disabled={assigning}>✓</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB CONTENT: VITALS */}
          {activeTab === 'vitals' && (
            <section className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Clinical Metric Entry</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Currently recording for: <strong>{selectedElder?.full_name || 'No Patient Selected'}</strong></p>
              </div>

              {!selectedElder ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Please select a patient from the Directory first.</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('patients')}>Go to Directory</button>
                </div>
              ) : (
                <form onSubmit={handleMetricSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Heart Rate (BPM)</label>
                    <input type="number" className="form-input" value={newMetric.heart_rate} onChange={(e) => setNewMetric({...newMetric, heart_rate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Oxygen Level (%)</label>
                    <input type="number" className="form-input" value={newMetric.oxygen_level} onChange={(e) => setNewMetric({...newMetric, oxygen_level: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">BP Systolic</label>
                    <input type="number" className="form-input" value={newMetric.blood_pressure_systolic} onChange={(e) => setNewMetric({...newMetric, blood_pressure_systolic: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">BP Diastolic</label>
                    <input type="number" className="form-input" value={newMetric.blood_pressure_diastolic} onChange={(e) => setNewMetric({...newMetric, blood_pressure_diastolic: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Temperature (°C)</label>
                    <input type="number" step="0.1" className="form-input" value={newMetric.temperature} onChange={(e) => setNewMetric({...newMetric, temperature: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Activity Context</label>
                    <select className="form-select" value={newMetric.activity_level} onChange={(e) => setNewMetric({...newMetric, activity_level: e.target.value})}>
                      <option value="sedentary">Resting</option>
                      <option value="light">Light Activity</option>
                      <option value="moderate">Moderate Activity</option>
                      <option value="active">High Activity</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Clinical Observations</label>
                    <textarea className="form-input" rows="3" value={newMetric.notes} onChange={(e) => setNewMetric({...newMetric, notes: e.target.value})} placeholder="Any specific symptoms or mood changes..."></textarea>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                      {isSubmitting ? 'Syncing Data...' : 'Commit Health Records'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* TAB CONTENT: ADD PATIENT */}
          {activeTab === 'add-patient' && (
            <section className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>New Patient Admission</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Register a new clinical profile in the master directory</p>
              </div>
              <form onSubmit={handleAddElder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Full Legal Name</label>
                  <input type="text" className="form-input" required value={newElder.full_name} onChange={(e) => setNewElder({...newElder, full_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-input" required value={newElder.age} onChange={(e) => setNewElder({...newElder, age: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Biological Gender</label>
                  <select className="form-select" value={newElder.gender} onChange={(e) => setNewElder({...newElder, gender: e.target.value})}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <input type="text" className="form-input" placeholder="e.g. O+" value={newElder.blood_group} onChange={(e) => setNewElder({...newElder, blood_group: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Known Medical Conditions</label>
                  <input type="text" className="form-input" value={newElder.medical_conditions} onChange={(e) => setNewElder({...newElder, medical_conditions: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Verified Allergies</label>
                  <input type="text" className="form-input" value={newElder.allergies} onChange={(e) => setNewElder({...newElder, allergies: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Profile...' : 'Create Clinical Record'}
                </button>
              </form>
            </section>
          )}

          {/* TAB CONTENT: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <section>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Platform Personnel</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage accounts for Admins, Caregivers, and Family Link users</p>
              </div>
              <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '16px' }}>NAME</th>
                      <th style={{ padding: '16px' }}>EMAIL</th>
                      <th style={{ padding: '16px' }}>ROLE</th>
                      <th style={{ padding: '16px' }}>PHONE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{u.full_name}</td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '16px' }}><span className={`nav-role-badge ${u.role}`}>{u.role}</span></td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB CONTENT: DATASETS (Admin only) */}
          {activeTab === 'datasets' && hasRole('admin') && (
            <section>
              <Datasets />
            </section>
          )}

          {/* TAB CONTENT: MEDICINES */}
          {activeTab === 'medicines' && (
            <section style={{ maxWidth: '800px', margin: '0 auto' }}>
               <MedicineTracker selectedElderId={selectedElder?.id} />
            </section>
          )}

          {/* TAB CONTENT: ALERTS */}
          {activeTab === 'alerts' && (
            <section style={{ maxWidth: '800px', margin: '0 auto' }}>
              <AlertFeed />
            </section>
          )}

          {/* TAB CONTENT: CARE TASKS */}
          {activeTab === 'tasks' && (
            <section style={{ maxWidth: '800px', margin: '0 auto' }}>
              {selectedElder ? (
                <CareTaskChecklist elder={selectedElder} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }} className="glass-card">
                  <h2>No Patient Selected</h2>
                  <p className="text-muted">Please select a patient from the Directory / My Patients tab first to view tasks.</p>
                </div>
              )}
            </section>
          )}

          {/* TAB CONTENT: CHAT MODULE */}
          {activeTab === 'chat' && (
            <section style={{ maxWidth: '800px', margin: '0 auto' }}>
              {selectedElder ? (
                <ChatModule elder={selectedElder} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }} className="glass-card">
                  <h2>No Patient Selected</h2>
                  <p className="text-muted">Please select a patient from the Directory / My Patients tab first to view messages.</p>
                </div>
              )}
            </section>
          )}

          {/* TAB CONTENT: CAREGIVER INFO (FAMILY ONLY) */}
          {activeTab === 'caregiver' && (
            <section style={{ maxWidth: '800px', margin: '0 auto' }}>
               {selectedElder && <CaregiverInfo elder={selectedElder} />}
            </section>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
