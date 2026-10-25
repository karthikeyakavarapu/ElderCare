import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TABLE_STYLE = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' };
const TH_STYLE = {
  padding: '14px 16px',
  color: 'var(--text-secondary)',
  fontSize: '0.78rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom: '1px solid var(--border-color)',
  whiteSpace: 'nowrap',
};
const TD_STYLE = { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };

function Badge({ label, color = '#6366f1' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: `${color}22`,
      color,
      border: `1px solid ${color}55`,
    }}>
      {label}
    </span>
  );
}

function SectionHeader({ icon, title, subtitle, count }) {
  return (
    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{icon} {title}</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
      {count !== undefined && (
        <span style={{
          padding: '6px 16px', borderRadius: '20px',
          background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: '700'
        }}>
          {count} records
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', opacity: 0.6 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

function fmtDate(val) {
  if (!val || val === '—') return '—';
  try { return new Date(val).toLocaleDateString(); } catch { return val; }
}

// ─── TABLE: Patients ─────────────────────────────────────────────────────────
function PatientsTable({ data }) {
  if (!data.length) return <EmptyState message="No patient records found. Run seed_data.py to populate." />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            {['Name','Age','Gender','Blood Grp','Conditions','Allergies','Caregiver','Family Contact','Family Phone'].map(h => (
              <th key={h} style={TH_STYLE}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ ...TD_STYLE, fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>{p.full_name}</td>
              <td style={TD_STYLE}>{p.age ?? '—'}</td>
              <td style={TD_STYLE}>
                <Badge label={p.gender || '—'} color={p.gender === 'female' ? '#ec4899' : p.gender === 'male' ? '#3b82f6' : '#8b5cf6'} />
              </td>
              <td style={TD_STYLE}>{p.blood_group && p.blood_group !== '—' ? <Badge label={p.blood_group} color="#f59e0b" /> : '—'}</td>
              <td style={{ ...TD_STYLE, maxWidth: '180px', whiteSpace: 'normal' }}>{p.medical_conditions || 'None'}</td>
              <td style={{ ...TD_STYLE, maxWidth: '140px', whiteSpace: 'normal' }}>{p.allergies || 'None'}</td>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>{p.caregiver_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.caregiver_email !== '—' ? p.caregiver_email : ''}</div>
              </td>
              <td style={TD_STYLE}>
                <div style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>{p.family_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.family_email !== '—' ? p.family_email : ''}</div>
              </td>
              <td style={{ ...TD_STYLE, whiteSpace: 'nowrap' }}>{p.family_phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TABLE: Family Members ────────────────────────────────────────────────────
function FamilyTable({ data }) {
  if (!data.length) return <EmptyState message="No family member accounts found." />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            {['Name','Email','Phone','Linked Patients','Patient Count','Account Created'].map(h => (
              <th key={h} style={TH_STYLE}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((f, i) => (
            <tr key={f.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ ...TD_STYLE, fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>{f.full_name}</td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)' }}>{f.email}</td>
              <td style={{ ...TD_STYLE, whiteSpace: 'nowrap' }}>{f.phone}</td>
              <td style={{ ...TD_STYLE, maxWidth: '200px', whiteSpace: 'normal' }}>{f.linked_patients}</td>
              <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                <Badge label={f.patient_count} color={f.patient_count > 0 ? '#22c55e' : '#6b7280'} />
              </td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(f.joined)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TABLE: Caregiver Assignments ─────────────────────────────────────────────
function AssignmentsTable({ data }) {
  if (!data.length) return <EmptyState message="No caregiver accounts found." />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            {['Caregiver','Email','Phone','Assigned Patients','Load','Patient Conditions','Joined'].map(h => (
              <th key={h} style={TH_STYLE}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cg, i) => (
            <tr key={cg.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ ...TD_STYLE, fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                    {cg.full_name.charAt(0)}
                  </div>
                  {cg.full_name}
                </div>
              </td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)' }}>{cg.email}</td>
              <td style={{ ...TD_STYLE, whiteSpace: 'nowrap' }}>{cg.phone}</td>
              <td style={{ ...TD_STYLE, maxWidth: '180px', whiteSpace: 'normal' }}>{cg.patient_names}</td>
              <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                <Badge label={`${cg.assigned_count} pts`} color={cg.assigned_count >= 3 ? '#ef4444' : cg.assigned_count >= 2 ? '#f59e0b' : '#22c55e'} />
              </td>
              <td style={{ ...TD_STYLE, maxWidth: '200px', whiteSpace: 'normal', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{cg.patient_conditions}</td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(cg.joined)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TABLE: Care Tasks ────────────────────────────────────────────────────────
function CareTasksTable({ data }) {
  if (!data.length) return <EmptyState message="No care tasks found. Add tasks via the Care Tasks tab." />;
  const statusColor = (s) => s === 'completed' ? '#22c55e' : s === 'in_progress' ? '#f59e0b' : '#6366f1';
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            {['Patient','Task','Status','Created','Last Updated'].map(h => (
              <th key={h} style={TH_STYLE}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((t, i) => (
            <tr key={t.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ ...TD_STYLE, fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>{t.patient_name}</td>
              <td style={{ ...TD_STYLE, maxWidth: '240px', whiteSpace: 'normal' }}>{t.task_name}</td>
              <td style={TD_STYLE}>
                <Badge label={t.status.replace('_', ' ').toUpperCase()} color={statusColor(t.status)} />
              </td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(t.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TABLE: Medicines ─────────────────────────────────────────────────────────
function MedicinesTable({ data }) {
  if (!data.length) return <EmptyState message="No medicines found. Add medicines via the Medicine Tracker tab." />;
  const statusColor = (s) => s === 'taken' ? '#22c55e' : s === 'missed' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            {['Patient','Medicine','Dosage','Frequency','Time / Instructions','Status','Added'].map(h => (
              <th key={h} style={TH_STYLE}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => (
            <tr key={m.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ ...TD_STYLE, fontWeight: '700', color: 'white', whiteSpace: 'nowrap' }}>{m.patient_name}</td>
              <td style={{ ...TD_STYLE, fontWeight: '600', whiteSpace: 'nowrap' }}>💊 {m.name}</td>
              <td style={TD_STYLE}>{m.dosage}</td>
              <td style={TD_STYLE}>{m.frequency}</td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', maxWidth: '160px', whiteSpace: 'normal', fontSize: '0.85rem' }}>{m.time}</td>
              <td style={TD_STYLE}>
                <Badge label={m.status.toUpperCase()} color={statusColor(m.status)} />
              </td>
              <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(m.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Datasets() {
  const { authFetch } = useAuth();
  const [activeSection, setActiveSection] = useState('patients');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [careTasks, setCareTasks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [pRes, fRes, cRes, tRes, mRes] = await Promise.all([
          authFetch('/api/dashboard/patients-dataset'),
          authFetch('/api/dashboard/family-dataset'),
          authFetch('/api/dashboard/caregiver-assignments'),
          authFetch('/api/dashboard/care-tasks-dataset'),
          authFetch('/api/dashboard/medicines-dataset'),
        ]);
        if (pRes.ok) setPatients((await pRes.json()).patients || []);
        if (fRes.ok) setFamilyMembers((await fRes.json()).family_members || []);
        if (cRes.ok) setCaregivers((await cRes.json()).caregivers || []);
        if (tRes.ok) setCareTasks((await tRes.json()).tasks || []);
        if (mRes.ok) setMedicines((await mRes.json()).medicines || []);
      } catch (e) {
        setError('Failed to load dataset. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs = [
    { id: 'patients',   label: '🏥 Patients',              count: patients.length },
    { id: 'family',     label: '👨‍👩‍👧 Family Members',       count: familyMembers.length },
    { id: 'caregivers', label: '🩺 Caregiver Assignments',  count: caregivers.length },
    { id: 'tasks',      label: '✅ Care Tasks',             count: careTasks.length },
    { id: 'medicines',  label: '💊 Medicines',              count: medicines.length },
  ];

  const summaryCards = [
    { label: 'Total Patients',   value: patients.length,     icon: '🏥', color: '#6366f1' },
    { label: 'Family Accounts',  value: familyMembers.length, icon: '👨‍👩‍👧', color: '#ec4899' },
    { label: 'Caregivers',       value: caregivers.length,   icon: '🩺', color: '#22c55e' },
    { label: 'Care Tasks',       value: careTasks.length,    icon: '✅', color: '#f59e0b' },
    { label: 'Medicines',        value: medicines.length,    icon: '💊', color: '#3b82f6' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px' }}>🗄️ System Datasets</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Comprehensive view of all records stored in Supabase — patients, family, caregivers, tasks, and medicines.
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {summaryCards.map(card => (
          <div key={card.label} className="glass-card" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setActiveSection(
              card.label === 'Total Patients' ? 'patients' :
              card.label === 'Family Accounts' ? 'family' :
              card.label === 'Caregivers' ? 'caregivers' :
              card.label === 'Care Tasks' ? 'tasks' : 'medicines'
            )}>
            <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: card.color }}>{card.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              padding: '10px 18px', borderRadius: '30px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s ease',
              background: activeSection === tab.id ? 'var(--accent-gradient)' : 'var(--bg-glass)',
              color: 'white',
              boxShadow: activeSection === tab.id ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            {tab.label}
            <span style={{ marginLeft: '8px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>⚠️ {error}</div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)' }}>
            {activeSection === 'patients'   && <SectionHeader icon="🏥" title="Patient Details"          subtitle="Full clinical records with assigned care team"                  count={patients.length} />}
            {activeSection === 'family'     && <SectionHeader icon="👨‍👩‍👧" title="Family Members"          subtitle="Registered family accounts and their linked patients"           count={familyMembers.length} />}
            {activeSection === 'caregivers' && <SectionHeader icon="🩺" title="Caregiver Assignments"    subtitle="Caregivers with their assigned patient workloads"               count={caregivers.length} />}
            {activeSection === 'tasks'      && <SectionHeader icon="✅" title="Care Tasks"               subtitle="All daily care tasks across every patient"                      count={careTasks.length} />}
            {activeSection === 'medicines'  && <SectionHeader icon="💊" title="Medicine Tracker Dataset" subtitle="All prescribed medicines with dosage, schedule, and status"     count={medicines.length} />}
          </div>
          <div style={{ padding: '8px 0 24px' }}>
            {activeSection === 'patients'   && <PatientsTable     data={patients} />}
            {activeSection === 'family'     && <FamilyTable       data={familyMembers} />}
            {activeSection === 'caregivers' && <AssignmentsTable  data={caregivers} />}
            {activeSection === 'tasks'      && <CareTasksTable    data={careTasks} />}
            {activeSection === 'medicines'  && <MedicinesTable    data={medicines} />}
          </div>
        </div>
      )}
    </div>
  );
}
