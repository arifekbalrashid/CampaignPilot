import { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customersAPI.list(page, pageSize, search || null);
      setCustomers(res.data.customers);
      setTotal(res.data.total);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setSearch(searchInput); };

  const viewDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await customersAPI.get(id);
      setSelectedCustomer(res.data);
    } catch (err) { console.error('Failed to fetch customer details', err); }
    finally { setDetailLoading(false); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const getInitialColor = (name) => {
    const colors = ['var(--blue)', 'var(--purple)', 'var(--green)', 'var(--amber)', 'var(--accent)', 'var(--cyan)'];
    const bgColors = ['var(--blue-light)', 'var(--purple-light)', 'var(--green-light)', 'var(--amber-light)', 'var(--accent-light)', 'var(--cyan-light)'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const idx = Math.abs(hash) % colors.length;
    return { text: colors[idx], bg: bgColors[idx] };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">{total} total customers in your database</p>
      </div>

      {error && (
        <div className="animate-fade-in" style={{ padding: '14px 20px', background: 'var(--rose-light)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--rose)', fontSize: '14px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div className="card-static animate-fade-in-up" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name, email, phone, or city..." className="input-field" style={{ paddingLeft: '42px' }} />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {search && <button type="button" className="btn-secondary" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>Clear</button>}
        </form>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner message="Loading customers..." /> : customers.length === 0 ? (
        <EmptyState
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          title={search ? 'No results found' : 'No customers yet'}
          description={search ? `No customers match "${search}".` : 'Your customer database is empty.'}
        />
      ) : (
        <div className="card-static animate-fade-in-up" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>City</th>
                <th>Age</th>
                <th>Total Spend</th>
                <th>Last Order</th>
                <th>Channel</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const { text, bg } = getInitialColor(customer.name);
                return (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{customer.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{customer.city}</td>
                    <td>{customer.age}</td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>₹{customer.total_spend?.toLocaleString()}</td>
                    <td>{customer.last_order ? new Date(customer.last_order).toLocaleDateString() : 'N/A'}</td>
                    <td><span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{customer.preferred_channel}</span></td>
                    <td><button className="btn-ghost" onClick={() => viewDetail(customer.id)} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button key={pageNum} className={page === pageNum ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 12px', fontSize: '13px', minWidth: '36px' }} onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </button>
                  );
                })}
                <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Profile" wide>
        {detailLoading ? <LoadingSpinner message="Loading profile..." /> : selectedCustomer ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: getInitialColor(selectedCustomer.name).bg, color: getInitialColor(selectedCustomer.name).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, flexShrink: 0 }}>
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCustomer.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{selectedCustomer.email}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Phone', value: selectedCustomer.phone },
                { label: 'City', value: selectedCustomer.city },
                { label: 'Age', value: selectedCustomer.age },
                { label: 'Total Spend', value: `₹${selectedCustomer.total_spend?.toLocaleString()}` },
                { label: 'Last Order', value: selectedCustomer.last_order ? new Date(selectedCustomer.last_order).toLocaleDateString() : 'N/A' },
                { label: 'Preferred Channel', value: selectedCustomer.preferred_channel },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{value}</p>
                </div>
              ))}
            </div>
            {selectedCustomer.orders?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Order History ({selectedCustomer.orders.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedCustomer.orders.slice(0, 10).map((order) => (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{order.product}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.category} · {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</p>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>₹{order.amount?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedCustomer.campaign_history?.length > 0 && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Campaign History ({selectedCustomer.campaign_history.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedCustomer.campaign_history.map((ch, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Campaign #{ch.campaign_id}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{ch.channel}</p>
                      </div>
                      <span className={`badge badge-${ch.status === 'delivered' ? 'active' : ch.status}`}>{ch.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
