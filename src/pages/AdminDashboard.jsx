import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignEditor from '../components/CampaignEditor.jsx';
import BankEditor from '../components/BankEditor.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ChatAdminPanel from '../components/ChatAdminPanel.jsx';
import * as api from '../api.js';
import { fmt } from '../utils.js';

export default function AdminDashboard({ campaigns, bank, refreshCampaigns, refreshBank, setBank, setAdminToken, showToast }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('donations');
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalApproved: 0, pendingCount: 0, approvedCount: 0, campaignCount: 0, unreadChats: 0 });
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editingBank, setEditingBank] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [chatUnread, setChatUnread] = useState(0);
  const [paymentMethod, setPaymentMethodState] = useState('manual');
  const [togglingPayment, setTogglingPayment] = useState(false);

  const refreshDonations = async () => {
    try { setDonations(await api.listDonations('all')); }
    catch (e) { showToast(e.message, 'error'); }
  };
  const refreshStats = async () => {
    try { setStats(await api.getStats()); }
    catch (e) { console.error(e); }
  };

  useEffect(() => {
    refreshDonations();
    refreshStats();
    api.getPaymentMethod()
      .then(r => setPaymentMethodState(r.method))
      .catch(e => console.error('Failed to load payment method:', e));
    const i = setInterval(refreshStats, 8000);
    return () => clearInterval(i);
  }, []);

  const handleSignOut = () => {
    api.clearToken();
    setAdminToken(null);
    navigate('/');
  };

  // ===== Donation actions =====
  const handleApprove = async (d) => {
    try {
      await api.approveDonation(d.id);
      await Promise.all([refreshDonations(), refreshStats(), refreshCampaigns()]);
      showToast('Approved & added to campaign total', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const askReject = (d) => {
    setConfirm({
      title: 'Reject this donation?',
      message: `${d.donorName}'s donation of ${fmt(d.amount)} will be marked as rejected.`,
      confirmText: 'Reject',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.rejectDonation(d.id);
          await Promise.all([refreshDonations(), refreshStats(), refreshCampaigns()]);
          showToast('Donation rejected', 'info');
        } catch (e) { showToast(e.message, 'error'); }
      }
    });
  };

  const askDeleteDonation = (d) => {
    setConfirm({
      title: 'Delete this donation?',
      message: 'This permanently removes the donation record and its receipt file. This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.removeDonation(d.id);
          await Promise.all([refreshDonations(), refreshStats(), refreshCampaigns()]);
          showToast('Donation deleted', 'info');
        } catch (e) { showToast(e.message, 'error'); }
      }
    });
  };

  // ===== Campaign actions =====
  const handleSaveCampaign = async (data) => {
    try {
      if (editingCampaign?.id) {
        await api.updateCampaign(editingCampaign.id, data);
        showToast('Campaign updated', 'success');
      } else {
        await api.createCampaign(data);
        showToast('Campaign created', 'success');
      }
      await Promise.all([refreshCampaigns(), refreshStats()]);
      setEditingCampaign(null);
    } catch (e) {
      showToast(e.message, 'error');
      throw e;
    }
  };

  const askDeleteCampaign = (c) => {
    setConfirm({
      title: `Delete "${c.title}"?`,
      message: 'This will permanently delete the campaign, its image, and all related donations and receipts. This cannot be undone.',
      confirmText: 'Delete campaign',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.deleteCampaign(c.id);
          await Promise.all([refreshCampaigns(), refreshDonations(), refreshStats()]);
          showToast('Campaign deleted', 'info');
        } catch (e) { showToast(e.message, 'error'); }
      }
    });
  };

  const handleSaveBank = async (data) => {
    try {
      const updated = await api.updateBank(data);
      setBank(updated);
      setEditingBank(false);
      showToast('Bank details updated', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleTogglePayment = async () => {
    if (togglingPayment) return;
    const newMethod = paymentMethod === 'paystack' ? 'manual' : 'paystack';

    setConfirm({
      title: newMethod === 'paystack'
        ? 'Switch to Paystack payments?'
        : 'Switch back to manual payments?',
      message: newMethod === 'paystack'
        ? 'Donors will be charged via Paystack card payments. Make sure your Paystack account is set up and ready to receive funds.'
        : 'Donors will go back to bank transfer + receipt upload. You will need to manually approve each donation.',
      confirmText: newMethod === 'paystack' ? 'Enable Paystack' : 'Switch to manual',
      danger: false,
      onConfirm: async () => {
        setConfirm(null);
        setTogglingPayment(true);
        try {
          const result = await api.setPaymentMethod(newMethod);
          setPaymentMethodState(result.method);
          showToast(
            newMethod === 'paystack' ? 'Paystack payments enabled' : 'Switched to manual payments',
            'success'
          );
        } catch (e) {
          showToast(e.message || 'Toggle failed', 'error');
        } finally {
          setTogglingPayment(false);
        }
      }
    });
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="logo" onClick={() => navigate('/')}>
            <span>Kindred</span>
            <span className="admin-badge">ADMIN</span>
          </button>
          <button className="btn btn-light btn-sm" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <div className="admin-shell">
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-num">{fmt(stats.totalApproved)}</div>
            <div className="admin-stat-lbl">Total approved</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.pendingCount}</div>
            <div className="admin-stat-lbl">Pending review</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.approvedCount}</div>
            <div className="admin-stat-lbl">Approved donations</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.campaignCount}</div>
            <div className="admin-stat-lbl">Active campaigns</div>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'donations' ? 'active' : ''}`} onClick={() => setTab('donations')}>
            Donations {stats.pendingCount > 0 && <span className="tab-badge">{stats.pendingCount}</span>}
          </button>
          <button className={`admin-tab ${tab === 'campaigns' ? 'active' : ''}`} onClick={() => setTab('campaigns')}>
            Campaigns
          </button>
          <button className={`admin-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
            Chat {(chatUnread || stats.unreadChats) > 0 && <span className="tab-badge">{chatUnread || stats.unreadChats}</span>}
          </button>
          <button className={`admin-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            Bank Settings
          </button>
        </div>

        {tab === 'donations' && (
          <DonationsTab
            donations={donations}
            campaigns={campaigns}
            onApprove={handleApprove}
            onReject={askReject}
            onDelete={askDeleteDonation}
            onPreview={setPreviewReceipt}
          />
        )}

        {tab === 'campaigns' && (
          <CampaignsTab
            campaigns={campaigns}
            onEdit={setEditingCampaign}
            onDelete={askDeleteCampaign}
            onNew={() => setEditingCampaign({})}
          />
        )}

        {tab === 'chat' && (
          <ChatAdminPanel showToast={showToast} onUnreadChange={setChatUnread} />
        )}

        {tab === 'settings' && (
          <BankSettingsTab
            bank={bank}
            onEdit={() => setEditingBank(true)}
            paymentMethod={paymentMethod}
            onTogglePayment={handleTogglePayment}
            togglingPayment={togglingPayment}
          />
        )}
      </div>

      {previewReceipt && (
        <div className="modal-bg" onClick={() => setPreviewReceipt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Receipt preview</h3>
            <ReceiptViewer donationId={previewReceipt} />
            <button className="btn btn-light btn-block" onClick={() => setPreviewReceipt(null)} style={{ marginTop: 14 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {editingCampaign && (
        <CampaignEditor
          initial={editingCampaign.id ? editingCampaign : null}
          onClose={() => setEditingCampaign(null)}
          onSave={handleSaveCampaign}
        />
      )}

      {editingBank && (
        <BankEditor
          initial={bank}
          onClose={() => setEditingBank(false)}
          onSave={handleSaveBank}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// =============== TABS ===============

function DonationsTab({ donations, campaigns, onApprove, onReject, onDelete, onPreview }) {
  const [filter, setFilter] = useState('pending');
  const filtered = filter === 'all' ? donations : donations.filter(d => d.status === filter);

  return (
    <div>
      <div className="admin-action-row">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} className={`pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({donations.filter(d => f === 'all' ? true : d.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 60 }}>
          No donations to show.
        </p>
      ) : (
        filtered.map(d => {
          const camp = campaigns.find(c => c.id === d.campaignId);
          return (
            <div key={d.id} className="donation-row">
              <div className="donation-head">
                <div className="donation-info">
                  <div className="donation-name">
                    {d.donorName}
                    {d.anonymous && <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 6 }}>(anon to public)</span>}
                    {d.paymentMethod === 'paystack' ? (
                      <span className="payment-badge payment-badge-paystack">💳 Paystack</span>
                    ) : (
                      <span className="payment-badge payment-badge-manual">🏦 Manual</span>
                    )}
                  </div>
                  <div className="donation-meta">{d.email} · {new Date(d.createdAt).toLocaleString()}</div>
                  <div className="donation-meta" style={{ marginTop: 4 }}>
                    → {camp?.title || 'Unknown campaign'}
                  </div>
                  {d.message && (
                    <div className="donation-message">"{d.message}"</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge status-${d.status}`}>{d.status}</span>
                  <div className="donation-amount" style={{ marginTop: 6 }}>{fmt(d.amount)}</div>
                </div>
              </div>

              {d.receiptUrl && (
                <div onClick={() => onPreview(d.id)} style={{ cursor: 'pointer' }}>
                  <ReceiptThumb donationId={d.id} />
                </div>
              )}

              <div className="donation-actions">
                {d.status === 'pending' && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => onApprove(d)}>✓ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onReject(d)}>✕ Reject</button>
                  </>
                )}
                {d.status === 'approved' && (
                  <button className="btn btn-danger btn-sm" onClick={() => onReject(d)}>Revoke approval</button>
                )}
                <button className="btn btn-light btn-sm" onClick={() => onDelete(d)}>Delete</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function CampaignsTab({ campaigns, onEdit, onDelete, onNew }) {
  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={onNew}>+ New campaign</button>
      {campaigns.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', padding: 60, textAlign: 'center' }}>No campaigns yet.</p>
      ) : (
        campaigns.map(c => {
          const imgUrl = api.campaignImageUrl(c);
          return (
            <div key={c.id} className="admin-campaign">
              <div className="admin-campaign-img"
                   style={imgUrl
                     ? { backgroundImage: `url(${imgUrl})` }
                     : { background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }} />
              <div className="admin-campaign-info">
                <div className="admin-campaign-title">{c.title}</div>
                <div className="admin-campaign-meta">
                  {c.category} · {fmt(c.raised)} of {fmt(c.goal)} · {c.daysLeft}d left
                </div>
              </div>
              <div className="admin-campaign-actions">
                <button className="btn btn-light btn-sm" onClick={() => onEdit(c)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(c)}>Delete</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function BankSettingsTab({ bank, onEdit, paymentMethod, onTogglePayment, togglingPayment }) {
  if (!bank) return <p style={{ padding: 60, textAlign: 'center' }}>Loading…</p>;

  const isPaystack = paymentMethod === 'paystack';

  return (
    <div>
      {/* PAYMENT METHOD TOGGLE */}
      <div className="payment-toggle-card">
        <div className="payment-toggle-info">
          <div className="payment-toggle-title">Payment method</div>
          <div className="payment-toggle-desc">
            {isPaystack
              ? '💳 Paystack is ON — donors pay with cards, donations confirm automatically.'
              : '🏦 Manual is ON — donors transfer to your bank, then upload receipts for you to approve.'}
          </div>
        </div>
        <button
          className={`toggle-switch ${isPaystack ? 'on' : 'off'}`}
          onClick={onTogglePayment}
          disabled={togglingPayment}
          aria-label="Toggle payment method"
        >
          <span className="toggle-knob"></span>
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, marginTop: 24, fontSize: 14 }}>
        These bank details are shown to donors on the manual payment page.
      </p>
      <div className="bank-card">
        <div className="bank-row"><div><div className="bank-label">Bank</div><div className="bank-value">{bank.bankName}</div></div></div>
        <div className="bank-row"><div><div className="bank-label">Account name</div><div className="bank-value">{bank.accountName}</div></div></div>
        <div className="bank-row"><div><div className="bank-label">Account number</div><div className="bank-value">{bank.accountNumber}</div></div></div>
        <div className="bank-row"><div><div className="bank-label">Sort / Routing code</div><div className="bank-value">{bank.routingCode || '—'}</div></div></div>
        <div className="bank-row"><div style={{ width: '100%' }}><div className="bank-label">Reference instruction</div><div style={{ fontSize: 14, marginTop: 4 }}>{bank.reference || '—'}</div></div></div>
        <div className="bank-row"><div style={{ width: '100%' }}><div className="bank-label">Notes shown to donor</div><div style={{ fontSize: 14, marginTop: 4 }}>{bank.notes || '—'}</div></div></div>
      </div>
      <button className="btn btn-primary" onClick={onEdit}>Edit bank details</button>
    </div>
  );
}

// =============== HELPERS ===============

function ReceiptThumb({ donationId }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    (async () => {
      try {
        const res = await fetch(api.receiptUrl(donationId), {
          headers: { Authorization: `Bearer ${api.getToken()}` }
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (cancelled) return;
        if (blob.type.startsWith('image/')) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        } else {
          setError(true);
        }
      } catch { if (!cancelled) setError(true); }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [donationId]);

  if (error) {
    return <div className="donation-receipt-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, fontSize: 12 }}>📄 PDF</div>;
  }
  if (!src) return <div className="donation-receipt-thumb" style={{ height: 80, background: 'var(--border-soft)' }}></div>;
  return <img src={src} className="donation-receipt-thumb" alt="Receipt" />;
}

function ReceiptViewer({ donationId }) {
  const [src, setSrc] = useState(null);
  const [type, setType] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    (async () => {
      const res = await fetch(api.receiptUrl(donationId), {
        headers: { Authorization: `Bearer ${api.getToken()}` }
      });
      const blob = await res.blob();
      setType(blob.type);
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [donationId]);

  if (!src) return <p>Loading receipt…</p>;
  if (type?.startsWith('image/')) {
    return <img src={src} style={{ width: '100%', borderRadius: 12 }} alt="Receipt" />;
  }
  return (
    <div>
      <p style={{ marginBottom: 12 }}>This receipt is a PDF.</p>
      <a href={src} target="_blank" rel="noreferrer" className="btn btn-primary">Open PDF</a>
    </div>
  );
}
