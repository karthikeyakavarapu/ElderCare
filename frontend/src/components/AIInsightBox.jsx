export default function AIInsightBox({ insight, type = 'info' }) {
  const accentMap = {
    info: { border: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: '🤖' },
    warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '⚠️' },
    success: { border: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: '✅' },
    danger: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: '🚨' },
  };
  const a = accentMap[type] || accentMap.info;

  return (
    <div className="ai-insight-box" style={{
      background: a.bg,
      borderLeft: `4px solid ${a.border}`,
      borderRadius: '0 12px 12px 0',
      padding: '16px 20px',
      marginTop: '16px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      animation: 'fadeIn 0.5s ease',
    }}>
      <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1 }}>{a.icon}</span>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: a.border, marginBottom: '4px' }}>
          AI Insight
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {insight}
        </p>
      </div>
    </div>
  );
}
