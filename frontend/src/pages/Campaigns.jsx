import { useState, useEffect } from 'react';
import { campaignsAPI } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [objective, setObjective] = useState('');
  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await campaignsAPI.list();
      setCampaigns(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handlePlan = async (e) => {
    e.preventDefault();
    if (!objective.trim()) return;
    try {
      setPlanning(true);
      setPlanResult(null);
      setError(null);
      const res = await campaignsAPI.plan(objective);
      setPlanResult(res.data);
      setObjective('');
      await fetchCampaigns();
    } catch (err) {
      console.error('Failed to plan campaign', err);
      setError('Failed to create campaign plan. Make sure the backend AI service is configured.');
    } finally {
      setPlanning(false);
    }
  };

  const handleLaunch = async (campaignId) => {
    try {
      setError(null);
      await campaignsAPI.launch(campaignId);
      await fetchCampaigns();
      if (selectedCampaign?.id === campaignId) await viewDetail(campaignId);
    } catch (err) {
      console.error('Failed to launch campaign', err);
      setError(err.response?.data?.detail || 'Failed to launch campaign');
    }
  };

  const viewDetail = async (id) => {
    try {
      setDetailLoading(true);
      setIsEditing(false);
      const res = await campaignsAPI.get(id);
      setSelectedCampaign(res.data);
      setEditData({ name: res.data.name, message: res.data.message });
    } catch (err) {
      console.error('Failed to fetch campaign details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await campaignsAPI.update(selectedCampaign.id, editData);
      await fetchCampaigns();
      await viewDetail(selectedCampaign.id);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update campaign', err);
      setError('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft campaign?')) return;
    try {
      await campaignsAPI.delete(id);
      await fetchCampaigns();
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
    } catch (err) {
      console.error('Failed to delete campaign', err);
      setError('Failed to delete campaign');
    }
  };

  const getStatusBadge = (status) => <span className={`badge badge-${status || 'draft'}`}>{status || 'draft'}</span>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Campaigns</h1>
        <p className="page-subtitle">Plan and launch AI-powered marketing campaigns</p>
      </div>

      {error && (
        <div className="animate-fade-in" style={{
          padding: '14px 20px',
          background: 'var(--rose-light)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--rose)',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {/* Plan Form */}
      <div className="card-static animate-fade-in-up" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Plan a New Campaign
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Describe your campaign objective and our AI will create a complete plan
        </p>
        <form onSubmit={handlePlan}>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. 'Re-engage customers who haven't ordered in 30 days with a 20% discount on their favorite category'"
            className="input-field"
            style={{ marginBottom: '16px', minHeight: '90px' }}
            required
          />
          <button type="submit" className="btn-primary" disabled={planning || !objective.trim()}>
            {planning ? (
              <>
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                AI is planning...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                </svg>
                Generate AI Plan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Plan Result */}
      {planResult && (
        <div className="card-static animate-fade-in-up" style={{ padding: '24px', marginBottom: '24px', borderColor: 'rgba(52, 168, 83, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="feature-icon-green" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)' }}>Campaign Plan Created!</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Your AI-generated campaign plan has been saved. View it in the list below to review details and launch.
          </p>
          <button className="btn-secondary" onClick={() => setPlanResult(null)}>Dismiss</button>
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <LoadingSpinner message="Loading campaigns..." />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
          title="No campaigns yet"
          description="Create your first AI-powered campaign by entering an objective above."
        />
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {campaigns.map((campaign, idx) => (
            <div
              key={campaign.id}
              className="card animate-fade-in-up"
              style={{ padding: '24px', cursor: 'pointer', animationDelay: `${idx * 40}ms` }}
              onClick={() => viewDetail(campaign.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', flex: 1, marginRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {campaign.name}
                </h3>
                {getStatusBadge(campaign.status)}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                {campaign.objective}
              </p>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                {campaign.channel && <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>📡 {campaign.channel}</span>}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>👥 {campaign.audience_count}</span>
                {campaign.created_at && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(campaign.created_at).toLocaleDateString()}</span>}
              </div>
              {campaign.status === 'draft' && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn-primary" style={{ width: '100%', fontSize: '13px', padding: '8px 16px', marginBottom: '8px' }} onClick={(e) => { e.stopPropagation(); handleLaunch(campaign.id); }}>
                    Launch Campaign
                  </button>
                  <button className="btn-secondary" style={{ width: '100%', fontSize: '13px', padding: '8px 16px', color: 'var(--rose)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}>
                    Delete Draft
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} title="Campaign Details" wide>
        {detailLoading ? <LoadingSpinner message="Loading details..." /> : selectedCampaign ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="input-field"
                  style={{ flex: 1, fontSize: '20px', fontWeight: 700 }}
                />
              ) : (
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{selectedCampaign.name}</h3>
              )}
              {getStatusBadge(selectedCampaign.status)}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Objective</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedCampaign.objective}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Channel', value: selectedCampaign.channel || 'N/A' },
                { label: 'Audience', value: selectedCampaign.audience_count },
                selectedCampaign.estimated_conversion != null && { label: 'Est. Conversion', value: `${(selectedCampaign.estimated_conversion * 100).toFixed(1)}%` },
                selectedCampaign.created_at && { label: 'Created', value: new Date(selectedCampaign.created_at).toLocaleDateString() },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{value}</p>
                </div>
              ))}
            </div>
            {selectedCampaign.audience_summary && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Audience Summary</p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedCampaign.audience_summary}</p>
              </div>
            )}
            {selectedCampaign.message && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Message</p>
                {isEditing ? (
                  <textarea
                    value={editData.message}
                    onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                    className="input-field"
                    style={{ minHeight: '120px', fontSize: '14px' }}
                  />
                ) : (
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedCampaign.message}</div>
                )}
              </div>
            )}

            {selectedCampaign.metrics && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Delivery Metrics</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'Sent', value: selectedCampaign.metrics.sent, color: 'var(--text-primary)' },
                    { label: 'Delivered', value: selectedCampaign.metrics.delivered, color: 'var(--blue)' },
                    { label: 'Opened', value: selectedCampaign.metrics.opened, color: 'var(--purple)' },
                    { label: 'Clicked', value: selectedCampaign.metrics.clicked, color: 'var(--amber)' },
                    { label: 'Converted', value: selectedCampaign.metrics.converted, color: 'var(--green)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}>
                      <p style={{ fontSize: '20px', fontWeight: 800, color, marginBottom: '4px' }}>{value}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedCampaign.status === 'draft' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                {isEditing ? (
                  <>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)} disabled={saving}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  </>
                ) : (
                  <>
                    <button className="btn-secondary" style={{ flex: 1, color: 'var(--rose)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDelete(selectedCampaign.id)}>Delete</button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(true)}>Edit Plan</button>
                    <button className="btn-primary" style={{ flex: 2 }} onClick={() => handleLaunch(selectedCampaign.id)}>Launch Campaign</button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
