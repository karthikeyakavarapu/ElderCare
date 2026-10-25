import codecs
import re

with codecs.open('src/pages/Dashboard.jsx', 'r', 'utf-8') as f:
    content = f.read()

# Add imports
if 'DashboardLayout' not in content:
    content = content.replace("import { useAuth } from '../context/AuthContext';", 
                              "import { useAuth } from '../context/AuthContext';\nimport DashboardLayout from '../components/DashboardLayout';\nimport MedicineTracker from '../components/MedicineTracker';")

# Find the return block
match = re.search(r'  return \(\n    <div className="page"', content)
if match:
    new_return = """  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
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
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>System Intelligence</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Live health trends and clinical statistics</p>
              </div>
              {statsCards}
              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                <div className="chart-card glass-card">
                  <h3 style={{ marginBottom: '20px' }}>❤️ Vital Signs: Heart Rate</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={healthData}>
                      <defs>
                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="heart_rate" stroke="#ec4899" fillOpacity={1} fill="url(#colorHr)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card glass-card">
                  <h3 style={{ marginBottom: '20px' }}>🫁 Vital Signs: Oxygen (SpO2)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={healthData}>
                      <defs>
                        <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="oxygen_level" stroke="#22c55e" fillOpacity={1} fill="url(#colorO2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
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

          {/* TAB CONTENT: MEDICINES */}
          {activeTab === 'medicines' && (
            <MedicineTracker selectedElderId={selectedElder?.id} />
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
""" # We don't include TabItem anymore since it's in DashboardLayout
    
    # Remove the old TabItem at the bottom which goes until the end
    end_main_component = content.find("function TabItem({ active, onClick, icon, label }) {")
    if end_main_component != -1:
        new_content = content[:match.start()] + new_return
        with codecs.open('src/pages/Dashboard.jsx', 'w', 'utf-8') as f:
            f.write(new_content)
        print("Dashboard.jsx updated successfully.")
    else:
        print("TabItem not found.")
else:
    print("Could not find the return statement to replace.")
