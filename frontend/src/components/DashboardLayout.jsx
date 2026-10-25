import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function TabItem({ active, onClick, icon, label }) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        borderLeft: `4px solid ${active ? '#f59e0b' : 'transparent'}`,
        color: active ? 'white' : 'var(--text-secondary)'
      }}
    >
      <span style={{ fontSize: '1.2rem', color: active ? 'white' : 'var(--text-secondary)' }}>{icon}</span>
      <span style={{ fontWeight: active ? '600' : '400', fontSize: '1rem' }}>{label}</span>
    </div>
  );
}

export default function DashboardLayout({ children, activeTab, setActiveTab, selectedElder }) {
  const { user, authFetch, hasRole } = useAuth();
  const [triggeringSos, setTriggeringSos] = useState(false);

  const handleSOS = async () => {
    if (!window.confirm("Trigger an SOS Emergency Alert immediately?")) return;
    
    setTriggeringSos(true);
    try {
      let elderId = selectedElder?.id;
      
      if (!elderId) {
        const resElders = await authFetch('/api/dashboard/elders');
        if (resElders.ok) {
          const data = await resElders.json();
          if (data.elders && data.elders.length > 0) {
            elderId = data.elders[0].id;
          }
        }
      }

      if (!elderId) {
        alert("No patient selected! Please select a patient from the Directory first.");
        setTriggeringSos(false);
        return;
      }

      const res = await authFetch('/api/emergency/trigger', {
        method: 'POST',
        body: JSON.stringify({
          elder_id: elderId,
          type: 'soc',
          description: 'Emergency SOS triggered from Dashboard Header'
        })
      });

      if (res.ok) {
        alert('🚨 SOS Alert Triggered! Caregivers and family have been notified.');
      } else {
        alert('Failed to trigger SOS');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering SOS');
    } finally {
      setTriggeringSos(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <div className="dashboard-sidebar">
        <div className="dashboard-profile-section">
          <div className="dashboard-profile-avatar">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>{user?.full_name}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{user?.role}</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Admin Navigation */}
          {hasRole('admin') && (
            <>
              <TabItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon="🏠" label="Dashboard" />
              <TabItem active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} icon="👥" label="Patients Directory" />
              <TabItem active={activeTab === 'vitals'} onClick={() => setActiveTab('vitals')} icon="📈" label="Metric Admin" />
              <TabItem active={activeTab === 'medicines'} onClick={() => setActiveTab('medicines')} icon="💊" label="Medicine Tracker" />
              <TabItem active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon="🚨" label="Alerts" />
              <TabItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon="✅" label="Care Tasks" />
              <TabItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon="💬" label="Messages" />
              <TabItem active={activeTab === 'add-patient'} onClick={() => setActiveTab('add-patient')} icon="➕" label="Add Patient" />
              <TabItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="🛡️" label="Family / Users" />
            </>
          )}

          {/* Caretaker Navigation */}
          {hasRole('caregiver') && (
            <>
               <TabItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon="🏠" label="Analytics" />
               <TabItem active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} icon="👥" label="My Patients" />
               <TabItem active={activeTab === 'vitals'} onClick={() => setActiveTab('vitals')} icon="📈" label="Metric Updating" />
               <TabItem active={activeTab === 'medicines'} onClick={() => setActiveTab('medicines')} icon="💊" label="Medicine Tracker" />
               <TabItem active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon="🚨" label="Alerts" />
               <TabItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon="✅" label="Care Tasks" />
               <TabItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon="💬" label="Messages" />
            </>
          )}

          {/* Family Navigation */}
          {hasRole('family') && (
            <>
               <TabItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon="🏠" label="Member Status" />
               <TabItem active={activeTab === 'medicines'} onClick={() => setActiveTab('medicines')} icon="💊" label="Medicine Log" />
               <TabItem active={activeTab === 'caregiver'} onClick={() => setActiveTab('caregiver')} icon="👨‍⚕️" label="Care Team" />
               <TabItem active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon="🚨" label="Alerts" />
               <TabItem active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon="✅" label="Care Tasks" />
               <TabItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon="💬" label="Messages" />
            </>
          )}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-main">
        {/* TOPBAR */}
        <div className="dashboard-topbar">
          <div>
            <input type="text" placeholder="Search..." className="topbar-search" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="sos-action-btn" 
              onClick={handleSOS} 
              disabled={triggeringSos}
            >
              🚨 {triggeringSos ? 'SENDING...' : 'SOS ALERT'}
            </button>
            <div style={{ color: 'white', fontWeight: 'bold' }}>
               {/* Additional top bar items can go here like notifications 🔔 */}
               <span style={{ fontSize: '1.2rem', cursor: 'pointer' }}>🔔</span>
            </div>
            <div style={{ color: 'white', fontWeight: 'bold' }}>
               <span style={{ fontSize: '1.2rem', cursor: 'pointer' }}>⚙️</span>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="dashboard-content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
