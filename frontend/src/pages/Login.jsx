import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);

      // Verify token with our backend
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      login(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-body)',
      padding: '20px',
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center',
      }}>
        {/* Brand */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #e8703a, #f0923e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(232, 112, 58, 0.3)',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '8px',
          }}>
            CampaignPilot
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            AI-powered campaign planning and customer management
          </p>
        </div>

        {/* Login Card */}
        <div className="card-static" style={{
          padding: '40px 32px',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Welcome back
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginBottom: '32px',
          }}>
            Sign in with your Google account to continue
          </p>

          {error && (
            <div className="animate-fade-in" style={{
              padding: '12px 16px',
              background: 'var(--rose-light)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--rose)',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
            }}>
              <div style={{
                width: '32px', height: '32px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Signing you in...</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
            }}>
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="outline"
                size="large"
                width="320"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
