import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav.jsx';
import * as api from '../api.js';
import { fmt } from '../utils.js';

export default function PaymentPage({ donation, bank, showToast, onSuccess }) {
  const navigate = useNavigate();
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // If user lands here without a donation in progress, redirect them home
  useEffect(() => {
    if (!donation) {
      navigate('/', { replace: true });
    }
  }, [donation, navigate]);

  if (!donation) {
    return null;
  }

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Please upload under 5MB.', 'error');
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const copy = (val, label) => {
    if (!val) return;
    navigator.clipboard?.writeText(val).then(() => showToast(`${label} copied!`, 'info'));
  };

  const handleComplete = async () => {
    if (!receiptFile) {
      showToast('Please upload your payment receipt first', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.submitDonation({
        campaignId: donation.campaignId,
        donorName: donation.donorName,
        email: donation.email,
        amount: donation.amount,
        message: donation.message,
        anonymous: donation.anonymous,
        receiptFile
      });
      if (onSuccess) await onSuccess();
      navigate('/thanks', { state: { donation: { ...donation, id: result.id } } });
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Nav backTo={`/donate/${donation.campaignId}`} />

      <div className="form-page">
        <h1 className="form-title">Complete your donation</h1>
        <p className="form-sub">
          Transfer <b>{fmt(donation.amount)}</b> to the account below, then upload your receipt.
        </p>

        <div className="bank-card">
          <div className="bank-row">
            <div>
              <div className="bank-label">Bank</div>
              <div className="bank-value">{bank?.bankName || '—'}</div>
            </div>
          </div>
          <div className="bank-row">
            <div>
              <div className="bank-label">Account name</div>
              <div className="bank-value">{bank?.accountName || '—'}</div>
            </div>
            <button className="copy-btn" onClick={() => copy(bank?.accountName, 'Account name')}>COPY</button>
          </div>
          <div className="bank-row">
            <div>
              <div className="bank-label">Account number</div>
              <div className="bank-value">{bank?.accountNumber || '—'}</div>
            </div>
            <button className="copy-btn" onClick={() => copy(bank?.accountNumber, 'Account number')}>COPY</button>
          </div>
          {bank?.routingCode && (
            <div className="bank-row">
              <div>
                <div className="bank-label">Sort / Routing code</div>
                <div className="bank-value">{bank.routingCode}</div>
              </div>
              <button className="copy-btn" onClick={() => copy(bank.routingCode, 'Sort code')}>COPY</button>
            </div>
          )}
          {bank?.reference && (
            <div className="bank-row">
              <div style={{ width: '100%' }}>
                <div className="bank-label">Reference</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{bank.reference}</div>
              </div>
            </div>
          )}
          <div className="bank-row">
            <div style={{ width: '100%' }}>
              <div className="bank-label">Amount to send</div>
              <div className="bank-value amount" style={{ textAlign: 'left' }}>{fmt(donation.amount)}</div>
            </div>
          </div>
        </div>

        {bank?.notes && (
          <p style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 20,
            lineHeight: 1.6,
            padding: 14,
            background: 'var(--bg-section)',
            borderRadius: 10
          }}>
            💡 {bank.notes}
          </p>
        )}

        <div className="field">
          <label>Upload receipt *</label>
          <div className={`upload-box ${receiptFile ? 'has-file' : ''}`}
               onClick={() => fileRef.current?.click()}>
            {receiptFile ? (
              <>
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Receipt preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon">📄</div>
                )}
                <div className="upload-text">{receiptFile.name}</div>
                <div className="upload-hint">Tap to replace</div>
              </>
            ) : (
              <>
                <div className="upload-icon">📎</div>
                <div className="upload-text">Tap to upload receipt</div>
                <div className="upload-hint">JPG, PNG, or PDF (max 5MB)</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                 onChange={e => handleFile(e.target.files?.[0])} />
        </div>

        <button className="btn btn-success btn-block btn-lg"
                onClick={handleComplete}
                disabled={!receiptFile || submitting}>
          {submitting ? <><span className="spinner-mini"></span> Submitting…</> : '✓ Payment Completed'}
        </button>
      </div>
    </>
  );
}