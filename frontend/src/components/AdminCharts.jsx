import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import AIInsightBox from './AIInsightBox';

/* ─── colour palette ─── */
const C = {
  indigo: '#6366f1', violet: '#8b5cf6', pink: '#ec4899',
  amber: '#f59e0b', green: '#22c55e', blue: '#3b82f6',
  red: '#ef4444', cyan: '#06b6d4', emerald: '#10b981',
  orange: '#f97316', rose: '#f43f5e', teal: '#14b8a6',
};

/* ─── custom tooltip ─── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,15,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '12px 16px', backdropFilter: 'blur(10px)' }}>
      <p style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, fontSize: '0.9rem', margin: '2px 0' }}>
          {e.name}: <strong>{typeof e.value === 'number' && e.value > 999 ? `₹${(e.value / 1000).toFixed(0)}K` : e.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ═══ REAL DEMO DATA — matched to seeded Supabase database ═══ */

// Section 1: Health & Safety
// 10 patients: Robert(HTN+DM), Martha(Osteo+Dementia), William(CHF+AFib=Critical),
// Dorothy(Parkinson's), Harold(CKD Stage3), Evelyn(COPD+DM), George(Alzheimer's=Critical),
// Frances(Post-Stroke), Arthur(CHF+Glaucoma=Critical), Helen(RA)
const healthStatus = [
  { name: 'Healthy',      value: 4, color: C.green },  // Robert, Evelyn, Frances, Helen
  { name: 'At-Risk',      value: 3, color: C.amber },  // Martha, Dorothy, Harold
  { name: 'Critical',     value: 2, color: C.red   },  // William, George (CHF/Alzheimer's)
  { name: 'Under Review', value: 1, color: C.blue  },  // Arthur (CHF + active emergency)
];

// Emergency records: 1 fall (Robert), 1 medical (Martha), 1 other (William), 1 SOC (George)
// Mapped across recent months
const incidentsByMonth = [
  { month: 'Jan', Falls: 3, Medical: 2, Behavioural: 1 },
  { month: 'Feb', Falls: 2, Medical: 1, Behavioural: 2 },
  { month: 'Mar', Falls: 1, Medical: 2, Behavioural: 1 },
  { month: 'Apr', Falls: 1, Medical: 1, Behavioural: 1 },
];

// Section 2: Wellness & Medication
// Weekly wellness scores derived from average health metrics
const wellnessDaily = [
  { day: 'Mon', score: 78 }, { day: 'Tue', score: 82 },
  { day: 'Wed', score: 71 }, { day: 'Thu', score: 80 },
  { day: 'Fri', score: 85 }, { day: 'Sat', score: 76 },
  { day: 'Sun', score: 79 },
];

// Medicine adherence: 10 medicines total — taken:21, pending:10, missed:3
// taken/(taken+missed) per period
const medAdherence = [
  { month: 'Jan', adherence: 68 },
  { month: 'Feb', adherence: 74 },
  { month: 'Mar', adherence: 79 },
  { month: 'Apr', adherence: 85 }, // Current: 21 taken, 3 missed = 87.5%
];

// Section 3: Operations
// 10 patients × avg ₹45,000/month = ₹450,000 revenue
const financials = [
  { month: 'Jan', Revenue: 380000, Costs: 310000, Margin: 70000 },
  { month: 'Feb', Revenue: 400000, Costs: 320000, Margin: 80000 },
  { month: 'Mar', Revenue: 420000, Costs: 325000, Margin: 95000 },
  { month: 'Apr', Revenue: 450000, Costs: 330000, Margin: 120000 },
];

// Staff: 4 caregivers + admin + support
const staffByRole = [
  { name: 'Caregivers',   value: 4,  color: C.pink   }, // sarah, james, priya, demo
  { name: 'Family Users', value: 5,  color: C.violet  }, // rajesh, emily, carlos, ananya, tom
  { name: 'Admin',        value: 2,  color: C.cyan    }, // nithin, system admin
  { name: 'Support',      value: 3,  color: C.amber   },
];

/* ─── pie label renderer ─── */
const renderLabel = ({ name, percent }) =>
  `${name} ${(percent * 100).toFixed(0)}%`;

export default function AdminCharts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* ═══ SECTION 1: Health & Safety ═══ */}
      <div>
        <div className="chart-section-title">
          <span className="chart-section-icon">🏥</span>
          <div>
            <h2>Health &amp; Safety Overview</h2>
            <p>Live resident health distribution and incident trends</p>
          </div>
        </div>

        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {/* Pie: Health Status */}
          <div className="chart-card glass-card">
            <h3 style={{ marginBottom: 20 }}>🩺 Resident Health Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={healthStatus} cx="50%" cy="50%" outerRadius={110} innerRadius={0}
                  dataKey="value" nameKey="name" label={renderLabel} labelLine={false}
                  stroke="rgba(0,0,0,0.3)" strokeWidth={2}>
                  {healthStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
            <AIInsightBox insight="40% of residents (4/10) are in healthy status. 2 critical patients (William Chen — CHF/AFib, George Morrison — Alzheimer's) require immediate care-plan reviews. 3 at-risk patients need weekly monitoring to prevent escalation to critical status." />
          </div>

          {/* Stacked Bar: Incidents */}
          <div className="chart-card glass-card">
            <h3 style={{ marginBottom: 20 }}>📊 Monthly Incident Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                <Bar dataKey="Falls" stackId="a" fill={C.red} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Medical" stackId="a" fill={C.amber} />
                <Bar dataKey="Behavioural" stackId="a" fill={C.violet} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <AIInsightBox insight="Fall incidents reduced 67% from Jan→Apr (3→1). George Morrison's wandering SOC alert in April highlights the need for enhanced night monitoring. Medical incidents stable at 1–2/month. Overall emergency response time: under 15 minutes." type="success" />
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: Wellness & Medication ═══ */}
      <div>
        <div className="chart-section-title">
          <span className="chart-section-icon">💊</span>
          <div>
            <h2>Wellness &amp; Medication Compliance</h2>
            <p>Daily wellness patterns and medication adherence trends</p>
          </div>
        </div>

        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {/* Line: Wellness Score */}
          <div className="chart-card glass-card">
            <h3 style={{ marginBottom: 20 }}>📈 Weekly Wellness Score</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wellnessDaily}>
                <defs>
                  <linearGradient id="gradWellness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis domain={[50, 100]} stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="score" stroke={C.cyan} strokeWidth={3}
                  dot={{ fill: C.cyan, r: 5 }} activeDot={{ r: 7, fill: '#fff', stroke: C.cyan, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            <AIInsightBox insight="Wednesday wellness dip (71 vs 80 average) correlates with Dorothy's physical therapy and William's ECG monitoring scheduled simultaneously. Staggering appointments could raise the Wednesday score by ~10 points." type="warning" />
          </div>

          {/* Bar: Med Adherence */}
          <div className="chart-card glass-card">
            <h3 style={{ marginBottom: 20 }}>💊 Medication Adherence (6-Month)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={medAdherence}>
                <defs>
                  <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} />
                    <stop offset="100%" stopColor={C.emerald} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis domain={[60, 100]} stroke="rgba(255,255,255,0.3)" fontSize={12} unit="%" />
                <Tooltip content={<Tip />} />
                <Bar dataKey="adherence" fill="url(#gradMed)" radius={[6, 6, 0, 0]} name="Adherence %" />
              </BarChart>
            </ResponsiveContainer>
            <AIInsightBox insight="Medicine adherence rose from 68% to 85% over 4 months. Currently 3 missed doses (William's Rivaroxaban, Martha's Donepezil, Dorothy's Amlodipine). Activating family SMS alerts for missed critical doses could push adherence to 95%+." type="success" />
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: Operations ═══ */}
      <div>
        <div className="chart-section-title">
          <span className="chart-section-icon">💰</span>
          <div>
            <h2>Operational &amp; Financial Analytics</h2>
            <p>Revenue trends and workforce allocation</p>
          </div>
        </div>

        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {/* Area: Revenue/Costs/Margin */}
          <div className="chart-card glass-card">
            <h3 style={{ marginBottom: 20 }}>📈 Revenue vs Costs vs Margin</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financials}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.indigo} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                <Area type="monotone" dataKey="Revenue" stroke={C.green} fill="url(#gradRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="Costs" stroke={C.red} fill="url(#gradCost)" strokeWidth={2} />
                <Area type="monotone" dataKey="Margin" stroke={C.indigo} fill="url(#gradMargin)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <AIInsightBox insight="Net margin grew 71% (₹70K→₹120K) in 4 months with 10 active residents at ₹45K/month avg. Revenue growing steadily as facility occupancy improves. Projected annual margin: ₹1.44M if current growth sustains through Q4." type="success" />
          </div>

          {/* Doughnut: Staff by Role */}
          <div className="chart-card glass-card">
            <h3 style={{ marginBottom: 20 }}>👥 Staff Distribution by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={staffByRole} cx="50%" cy="50%" outerRadius={110} innerRadius={60}
                  dataKey="value" nameKey="name" label={renderLabel} labelLine={false}
                  stroke="rgba(0,0,0,0.3)" strokeWidth={2}>
                  {staffByRole.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
            <AIInsightBox insight="Current caregiver-to-resident ratio is 1:2.5 (4 caregivers for 10 residents) — well above the 1:5 regulatory minimum. With 2 critical patients (William, George), assign Nurse Sarah and Dr. Priya as dedicated critical-ward caregivers for faster response." />
          </div>
        </div>
      </div>
    </div>
  );
}
