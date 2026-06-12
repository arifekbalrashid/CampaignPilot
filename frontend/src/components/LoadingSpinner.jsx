export default function LoadingSpinner({ size = 40, message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '48px 0',
      animation: 'fadeIn 0.3s ease both',
    }}>
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {message && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
