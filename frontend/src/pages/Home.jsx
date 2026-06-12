import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, campaignsRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentCampaigns(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (campaignsRes.status === 'fulfilled') setRecentCampaigns(campaignsRes.value.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div>
      {/* Hero Section */}
      <div className="animate-fade-in-up" style={{
        textAlign: 'center',
        padding: '48px 0 40px',
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: '12px',
        }}>
          Welcome to CampaignPilot
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-muted)',
          maxWidth: '520px',
          margin: '0 auto',
        }}>
          Powerful tools and insights to manage customers, plan AI-powered campaigns, and grow your business.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard
          label="Customers"
          value={stats?.total_customers != null ? `${(stats.total_customers / 1000).toFixed(stats.total_customers >= 1000 ? 0 : 1)}K+` : '0'}
          color="blue"
          delay={50}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <StatCard
          label="Total Campaigns"
          value={stats?.total_campaigns ?? 0}
          color="orange"
          delay={100}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <StatCard
          label="Active Campaigns"
          value={stats?.active_campaigns ?? 0}
          color="green"
          delay={150}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
        />
        <StatCard
          label="Conversion Rate"
          value={stats?.overall_conversion_rate != null ? `${(stats.overall_conversion_rate * 100).toFixed(1)}%` : '0%'}
          color="purple"
          delay={200}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
      </div>

      {/* Feature Section Title */}
      <div className="animate-fade-in-up stagger-3" style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Everything you need to succeed
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
          Powerful tools and insights to help you manage customers, track performance, and grow your business.
        </p>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <Link to="/campaigns" style={{ textDecoration: 'none' }}>
          <div className="card animate-fade-in-up stagger-4" style={{ padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
            <div className="feature-icon feature-icon-orange" style={{ margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              AI Campaigns
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Create and send targeted campaigns powered by AI to engage your customers and drive conversions.
            </p>
          </div>
        </Link>

        <Link to="/analytics" style={{ textDecoration: 'none' }}>
          <div className="card animate-fade-in-up stagger-4" style={{ padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
            <div className="feature-icon feature-icon-blue" style={{ margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Analytics & Insights
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Track performance metrics and gain valuable insights to optimize your marketing strategies.
            </p>
          </div>
        </Link>

        <Link to="/customers" style={{ textDecoration: 'none' }}>
          <div className="card animate-fade-in-up stagger-5" style={{ padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
            <div className="feature-icon feature-icon-green" style={{ margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Customer Management
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Organize and manage your customer data with powerful tools for segmentation and targeting.
            </p>
          </div>
        </Link>

        <Link to="/import" style={{ textDecoration: 'none' }}>
          <div className="card animate-fade-in-up stagger-5" style={{ padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
            <div className="feature-icon feature-icon-purple" style={{ margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Import Data
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Bulk upload customers and orders using CSV or Excel files for quick onboarding.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Campaigns */}
      {recentCampaigns.length > 0 && (
        <div className="card-static animate-fade-in-up stagger-5" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Campaigns
            </h2>
            <Link to="/campaigns" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentCampaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid transparent',
                transition: 'all var(--transition-fast)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {campaign.name}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                    {campaign.channel && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📡 {campaign.channel}</span>}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>👥 {campaign.audience_count}</span>
                  </div>
                </div>
                <span className={`badge badge-${campaign.status}`}>{campaign.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
