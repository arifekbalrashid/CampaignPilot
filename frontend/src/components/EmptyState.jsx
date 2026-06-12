export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
      animation: 'fadeIn 0.4s ease both',
    }}>
      {icon && (
        <div style={{
          width: '72px', height: '72px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: 'var(--text-muted)',
        }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: 1.6, marginBottom: action ? '24px' : '0' }}>
        {description}
      </p>
      {action}
    </div>
  );
}
