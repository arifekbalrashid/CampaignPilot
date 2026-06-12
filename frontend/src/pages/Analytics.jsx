import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, perfRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getPerformance(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  const maxSent = Math.max(...performance.map(p => p.sent), 1);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance metrics and campaign insights</p>
      </div>

      {error && (
        <div className="animate-fade-in" style={{ padding: '14px 20px', background: 'var(--rose-light)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--rose)', fontSize: '14px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard label="Total Customers" value={stats?.total_customers ?? 0} color="blue" delay={50}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
        />
        <StatCard label="Total Campaigns" value={stats?.total_campaigns ?? 0} color="orange" delay={100}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <StatCard label="Active Campaigns" value={stats?.active_campaigns ?? 0} color="green" delay={150}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
        />
        <StatCard label="Conversion Rate" value={stats?.overall_conversion_rate != null ? `${(stats.overall_conversion_rate * 100).toFixed(1)}%` : '0%'} color="purple" delay={200}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
      </div>

      {/* Campaign Performance */}
      {performance.length > 0 && (
        <div className="card-static animate-fade-in-up stagger-3" style={{ padding: '28px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
            Campaign Performance
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {performance.map((p, idx) => (
              <div key={p.campaign_id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.campaign_name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.channel || 'N/A'} · {p.sent} sent</p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{(p.conversion_rate * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-surface)', width: `${Math.max((p.sent / maxSent) * 100, 10)}%` }}>
                  <div style={{ width: `${p.sent > 0 ? (p.delivered / p.sent) * 100 : 0}%`, background: 'var(--blue)', transition: 'width 0.6s ease' }} />
                  <div style={{ width: `${p.sent > 0 ? (p.opened / p.sent) * 100 : 0}%`, background: 'var(--purple)', transition: 'width 0.6s ease' }} />
                  <div style={{ width: `${p.sent > 0 ? (p.converted / p.sent) * 100 : 0}%`, background: 'var(--green)', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {[{ label: 'Delivered', color: 'var(--blue)' }, { label: 'Opened', color: 'var(--purple)' }, { label: 'Converted', color: 'var(--green)' }].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {performance.length > 0 && (() => {
        const totals = performance.reduce((acc, p) => ({ sent: acc.sent + p.sent, delivered: acc.delivered + p.delivered, opened: acc.opened + p.opened, converted: acc.converted + p.converted }), { sent: 0, delivered: 0, opened: 0, converted: 0 });
        const maxVal = totals.sent || 1;
        const funnel = [
          { label: 'Sent', value: totals.sent, color: 'var(--accent)' },
          { label: 'Delivered', value: totals.delivered, color: 'var(--blue)' },
          { label: 'Opened', value: totals.opened, color: 'var(--purple)' },
          { label: 'Converted', value: totals.converted, color: 'var(--green)' },
        ];
        return (
          <div className="card-static animate-fade-in-up stagger-4" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Conversion Funnel (All Campaigns)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {funnel.map(({ label, value, color }, idx) => (
                <div key={label} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color }}>{value.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${(value / maxVal) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
