import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api.js';

export default function AdminLogin({ setAdminToken, showToast }) {
  const navigate = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.login(u, p);
      api.setToken(result.token);
      setAdminToken(result.token);
      navigate('/admin');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <button className="logo" onClick={() => navigate('/')} style={{ marginBottom: 24 }}>
          Kindred
        </button>
        <h2 className="form-title">Admin login</h2>
        <p className="form-sub">Authorized personnel only.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input type="text" value={u} onChange={e => setU(e.target.value)} required autoFocus autoComplete="username" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={p} onChange={e => setP(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? <><span className="spinner-mini"></span> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <button className="btn btn-light btn-block" onClick={() => navigate('/')} style={{ marginTop: 12 }}>
          Back to site
        </button>
      </div>
    </div>
  );
}