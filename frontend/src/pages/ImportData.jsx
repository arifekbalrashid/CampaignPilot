import { useState, useRef, useEffect } from 'react';
import { importAPI } from '../services/api';

export default function ImportData() {
  const [importType, setImportType] = useState('customers');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    importAPI.getTemplates().then(res => setTemplates(res.data)).catch(() => {});
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Please upload a CSV or Excel (.xlsx) file');
      setFile(null);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      setResult(null);
      const res = importType === 'customers'
        ? await importAPI.customers(file)
        : await importAPI.orders(file);
      setResult(res.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Import failed', err);
      setError(err.response?.data?.detail || 'Import failed. Please check your file format.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (type) => {
    if (!templates || !templates[type]) return;
    const cols = templates[type].columns;
    const example = templates[type].example_row;
    const header = cols.join(',');
    const row = cols.map(c => example[c] || '').join(',');
    const csv = `${header}\n${row}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = () => {
    if (!file) return null;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') return '📄';
    return '📊';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Import Data</h1>
        <p className="page-subtitle">Upload CSV or Excel files to import customers and orders</p>
      </div>

      {/* Import Type Toggle */}
      <div className="card-static animate-fade-in-up" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: 'customers', label: 'Customers', icon: '👥', desc: 'Import customer profiles' },
            { value: 'orders', label: 'Orders', icon: '🛒', desc: 'Import purchase orders' },
          ].map(({ value, label, icon, desc }) => (
            <button
              key={value}
              onClick={() => { setImportType(value); setFile(null); setResult(null); setError(null); }}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${importType === value ? 'var(--accent)' : 'var(--border)'}`,
                background: importType === value ? 'var(--accent-light)' : 'var(--bg-white)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: importType === value ? 'var(--accent)' : 'var(--text-primary)',
                }}>{label}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '30px' }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Template Info */}
      {templates && templates[importType] && (
        <div className="card-static animate-fade-in-up stagger-1" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Expected Columns
            </h3>
            <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => downloadTemplate(importType)}>
              ⬇ Download Template
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {templates[importType].columns.map((col) => (
              <span key={col} style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                fontFamily: 'monospace',
              }}>
                {col}
              </span>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {importType === 'customers'
              ? '💡 Required: name, email. Other fields are optional. Duplicate emails will update existing records.'
              : '💡 Required: customer_email, product, amount. The customer must already exist in the database.'}
          </p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className="card-static animate-fade-in-up stagger-2"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          padding: '48px 24px',
          marginBottom: '24px',
          textAlign: 'center',
          border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
          background: dragActive ? 'var(--accent-light)' : 'var(--bg-white)',
          borderRadius: 'var(--radius-lg)',
          transition: 'all var(--transition-fast)',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {file ? (
          <div className="animate-fade-in">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{getFileIcon()}</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {file.name}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {(file.size / 1024).toFixed(1)} KB · Click to change
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              disabled={uploading}
              className="btn-primary"
              style={{ padding: '12px 32px', fontSize: '15px' }}
            >
              {uploading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Importing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Import {importType === 'customers' ? 'Customers' : 'Orders'}
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width: '64px', height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Drop your file here, or click to browse
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Supports CSV and Excel (.xlsx) files
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="animate-fade-in" style={{
          padding: '14px 20px',
          background: 'var(--rose-light)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--rose)',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card-static animate-fade-in-up" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--green-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--green)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)' }}>
              Import Complete!
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{result.total_rows}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Rows</p>
            </div>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--green-light)', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>{result.imported}</p>
              <p style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 500 }}>Imported</p>
            </div>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: result.skipped > 0 ? 'var(--amber-light)' : 'var(--bg-surface)', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: result.skipped > 0 ? 'var(--amber)' : 'var(--text-muted)' }}>{result.skipped}</p>
              <p style={{ fontSize: '12px', color: result.skipped > 0 ? 'var(--amber)' : 'var(--text-muted)', fontWeight: 500 }}>Skipped</p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Issues:</p>
              <div style={{ maxHeight: '120px', overflowY: 'auto', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                {result.errors.map((err, i) => (
                  <p key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>• {err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
