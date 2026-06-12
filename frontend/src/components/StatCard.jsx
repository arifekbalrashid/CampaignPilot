export default function StatCard({ icon, label, value, color = 'orange', delay = 0 }) {
  const colors = {
    orange: { bg: 'var(--accent-light)', text: 'var(--accent)' },
    blue: { bg: 'var(--blue-light)', text: 'var(--blue)' },
    green: { bg: 'var(--green-light)', text: 'var(--green)' },
    purple: { bg: 'var(--purple-light)', text: 'var(--purple)' },
    amber: { bg: 'var(--amber-light)', text: 'var(--amber)' },
    cyan: { bg: 'var(--cyan-light)', text: 'var(--cyan)' },
  };

  const c = colors[color] || colors.orange;

  return (
    <div
      className="card animate-fade-in-up"
      style={{ padding: '24px', animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginBottom: '8px',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: '30px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {value}
          </p>
        </div>
        <div className="feature-icon" style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c.text,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
