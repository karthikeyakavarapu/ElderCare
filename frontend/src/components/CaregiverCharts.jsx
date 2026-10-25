import {
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import AIInsightBox from './AIInsightBox';

const C = {
  indigo: '#6366f1', violet: '#8b5cf6', pink: '#ec4899',
  amber: '#f59e0b', green: '#22c55e', blue: '#3b82f6',
  red: '#ef4444', cyan: '#06b6d4', emerald: '#10b981',
  orange: '#f97316', rose: '#f43f5e', teal: '#14b8a6',
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,15,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '12px 16px', backdropFilter: 'blur(10px)' }}>
      <p style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color || e.stroke, fontSize: '0.9rem', margin: '2px 0' }}>
          {e.name}: <strong>{e.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ═══ MOCK DATA ═══ */

const residentStatus = [
  { name: 'Stable', value: 8, color: C.green },
  { name: 'Needs Attention', value: 3, color: C.amber },
  { name: 'Critical', value: 2, color: C.red },
  { name: 'New Admission', value: 1, color: C.blue },
];

const taskCategories = [
  { task: 'Medications', Done: 12, Pending: 2 },
  { task: 'Bathing', Done: 10, Pending: 4 },
  { task: 'Vitals Check', Done: 14, Pending: 0 },
  { task: 'Meals', Done: 11, Pending: 3 },
  { task: 'Exercise', Done: 6, Pending: 8 },
  { task: 'Hygiene', Done: 9, Pending: 5 },
];

const activityRadar = [
  { activity: 'Physiotherapy', value: 35 },
  { activity: 'Walking', value: 78 },
  { activity: 'Social', value: 82 },
  { activity: 'Cognitive', value: 65 },
  { activity: 'Nutrition', value: 90 },
  { activity: 'Hygiene', value: 85 },
];

const nutritionHydration = [
  { day: 'Mon', Calories: 1850, Hydration: 2100 },
  { day: 'Tue', Calories: 1920, Hydration: 2200 },
  { day: 'Wed', Calories: 1780, Hydration: 1700 },
  { day: 'Thu', Calories: 1900, Hydration: 2050 },
  { day: 'Fri', Calories: 1950, Hydration: 2150 },
  { day: 'Sat', Calories: 1830, Hydration: 1900 },
  { day: 'Sun', Calories: 1870, Hydration: 2000 },
];

const renderLabel = ({ name, percent }) =>
  `${name} ${(percent * 100).toFixed(0)}%`;

export default function CaregiverCharts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* Section title */}
      <div className="chart-section-title">
        <span className="chart-section-icon">🩺</span>
        <div>
          <h2>My Shift Analytics</h2>
          <p>Real-time overview of your 14 assigned residents</p>
        </div>
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

        {/* Pie: Resident statuses */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>🏥 Assigned Residents Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={residentStatus} cx="50%" cy="50%" outerRadius={110}
                dataKey="value" nameKey="name" label={renderLabel} labelLine={false}
                stroke="rgba(0,0,0,0.3)" strokeWidth={2}>
                {residentStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <AIInsightBox insight="2 critical residents (Mrs. Sharma, Mr. Patel) need vitals checks within the next hour. 3 residents flagged 'Needs Attention' — verify medication schedules and update care notes before shift handover." type="danger" />
        </div>

        {/* Stacked Bar: Task completion */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>✅ Task Completion by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis type="category" dataKey="task" stroke="rgba(255,255,255,0.3)" fontSize={11} width={90} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Bar dataKey="Done" stackId="a" fill={C.green} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Pending" stackId="a" fill={C.rose} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <AIInsightBox insight="Exercise tasks have the highest pending rate (57%) — 8 of 14 residents haven't completed their sessions. Prioritize afternoon exercise rounds. Vitals are at 100% completion — great work keeping that on track." type="warning" />
        </div>

        {/* Radar: Activity participation */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>🎯 Activity Participation Radar</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={activityRadar} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="activity" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar name="Participation %" dataKey="value" stroke={C.indigo} fill={C.indigo} fillOpacity={0.25} strokeWidth={2} />
              <Tooltip content={<Tip />} />
            </RadarChart>
          </ResponsiveContainer>
          <AIInsightBox insight="Physiotherapy participation is critically low at 35% — far below the 78% walking average. This may be due to scheduling conflicts or resident reluctance. Talk to the physio team about adjusting session times to after breakfast when energy levels are highest." type="warning" />
        </div>

        {/* Dual Line: Nutrition + Hydration */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>🥗 Nutrition &amp; Hydration Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={nutritionHydration}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis yAxisId="cal" stroke={C.orange} fontSize={12} orientation="left" />
              <YAxis yAxisId="hyd" stroke={C.cyan} fontSize={12} orientation="right" unit="ml" />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Line yAxisId="cal" type="monotone" dataKey="Calories" stroke={C.orange} strokeWidth={2.5}
                dot={{ fill: C.orange, r: 4 }} name="Calories (kcal)" />
              <Line yAxisId="hyd" type="monotone" dataKey="Hydration" stroke={C.cyan} strokeWidth={2.5}
                dot={{ fill: C.cyan, r: 4 }} name="Hydration (ml)" />
            </LineChart>
          </ResponsiveContainer>
          <AIInsightBox insight="Wednesday hydration dropped to 1,700ml — 19% below the 2,100ml daily target. This correlates with the wellness score dip. Ensure water rounds happen hourly on Wednesdays and consider flavored-water options to boost intake." type="warning" />
        </div>
      </div>
    </div>
  );
}
