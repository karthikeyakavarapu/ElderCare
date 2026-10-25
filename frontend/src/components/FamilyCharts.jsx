import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
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

const vitalsWeek = [
  { day: 'Mon', Systolic: 128, Diastolic: 82, HeartRate: 74 },
  { day: 'Tue', Systolic: 130, Diastolic: 84, HeartRate: 76 },
  { day: 'Wed', Systolic: 135, Diastolic: 88, HeartRate: 80 },
  { day: 'Thu', Systolic: 126, Diastolic: 80, HeartRate: 72 },
  { day: 'Fri', Systolic: 124, Diastolic: 79, HeartRate: 71 },
  { day: 'Sat', Systolic: 127, Diastolic: 81, HeartRate: 73 },
  { day: 'Sun', Systolic: 125, Diastolic: 80, HeartRate: 72 },
];

const wellnessComparison = [
  { dimension: 'Mobility', ThisWeek: 72, LastWeek: 65 },
  { dimension: 'Appetite', ThisWeek: 85, LastWeek: 80 },
  { dimension: 'Sleep', ThisWeek: 68, LastWeek: 70 },
  { dimension: 'Mood', ThisWeek: 78, LastWeek: 72 },
  { dimension: 'Social', ThisWeek: 82, LastWeek: 75 },
  { dimension: 'Cognition', ThisWeek: 70, LastWeek: 68 },
];

const activityAttendance = [
  { week: 'Week 1', Physiotherapy: 3, Art: 4, Music: 5, Garden: 2 },
  { week: 'Week 2', Physiotherapy: 4, Art: 3, Music: 5, Garden: 3 },
  { week: 'Week 3', Physiotherapy: 2, Art: 5, Music: 4, Garden: 4 },
  { week: 'Week 4', Physiotherapy: 5, Art: 4, Music: 5, Garden: 3 },
];

const moodData = [
  { day: 'Mon', mood: 4 },
  { day: 'Tue', mood: 3 },
  { day: 'Wed', mood: 2 },
  { day: 'Thu', mood: 4 },
  { day: 'Fri', mood: 5 },
  { day: 'Sat', mood: 4 },
  { day: 'Sun', mood: 5 },
];

/* emoji Y-axis labels */
const emojiMap = { 1: '😢', 2: '😐', 3: '🙂', 4: '😊', 5: '😄' };
const MoodTick = ({ x, y, payload }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '1.2rem' }}>
    {emojiMap[payload.value] || ''}
  </text>
);

/* custom dot for mood line */
const MoodDot = ({ cx, cy, payload }) => (
  <text x={cx} y={cy - 14} textAnchor="middle" style={{ fontSize: '1.1rem' }}>
    {emojiMap[payload.mood] || ''}
  </text>
);

export default function FamilyCharts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      <div className="chart-section-title">
        <span className="chart-section-icon">👨‍👩‍👧‍👦</span>
        <div>
          <h2>Your Loved One's Weekly Report</h2>
          <p>Easy-to-understand health and wellness updates</p>
        </div>
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

        {/* Line: Vitals (BP + HR) */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>❤️ Blood Pressure &amp; Heart Rate This Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vitalsWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} domain={[60, 150]} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Line type="monotone" dataKey="Systolic" stroke={C.red} strokeWidth={2.5} name="BP Top Number"
                dot={{ fill: C.red, r: 4 }} />
              <Line type="monotone" dataKey="Diastolic" stroke={C.amber} strokeWidth={2.5} name="BP Bottom Number"
                dot={{ fill: C.amber, r: 4 }} />
              <Line type="monotone" dataKey="HeartRate" stroke={C.pink} strokeWidth={2.5} name="Heart Rate"
                dot={{ fill: C.pink, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <AIInsightBox insight="Blood pressure is well controlled — the top number (systolic) averaged 128, within the normal range of 120-140 for their age group. Wednesday showed a small spike to 135/88 — this can happen after a less restful night but returned to normal by Thursday. Heart rate is steady at 72-76 bpm. Overall, nothing to worry about this week." type="success" />
        </div>

        {/* Radar: This Week vs Last Week */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>📊 Wellness Progress: This Week vs Last</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={wellnessComparison} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar name="This Week" dataKey="ThisWeek" stroke={C.indigo} fill={C.indigo} fillOpacity={0.3} strokeWidth={2} />
              <Radar name="Last Week" dataKey="LastWeek" stroke={C.amber} fill={C.amber} fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 5" />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
            </RadarChart>
          </ResponsiveContainer>
          <AIInsightBox insight="Great news — your loved one improved in 5 out of 6 areas this week! Mobility jumped from 65 to 72 (likely thanks to increased physiotherapy). Sleep dipped slightly from 70 to 68. The care team has been notified and is adjusting the evening routine to help with better rest." />
        </div>

        {/* Grouped Bar: Activity Attendance */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>🎨 Activity Attendance This Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Bar dataKey="Physiotherapy" fill={C.indigo} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Art" fill={C.pink} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Music" fill={C.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Garden" fill={C.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <AIInsightBox insight="Music is the favourite activity at 19 sessions this month (consistently 4-5/week). Garden visits increased from 2 to 4 sessions — the warmer weather is helping! Physiotherapy attendance was low in Week 3 (only 2 sessions) but bounced back to 5 in Week 4 after the schedule was adjusted to morning slots." />
        </div>

        {/* Mood Line: Emoji Y-axis */}
        <div className="chart-card glass-card">
          <h3 style={{ marginBottom: 20 }}>😊 Daily Mood Tracker</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={<MoodTick />}
                stroke="rgba(255,255,255,0.3)" width={40} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="mood" stroke={C.violet} strokeWidth={3}
                dot={<MoodDot />} name="Mood Score" />
            </LineChart>
          </ResponsiveContainer>
          <AIInsightBox insight="The week ended on a high note — mood scored 😄 (5/5) on both Friday and Sunday! Wednesday was the lowest at 😐 (2/5), which matches the lower hydration and activity levels that day. The care team is looking at adding a mid-week social activity to keep spirits up." />
        </div>
      </div>
    </div>
  );
}
