import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav.jsx';
import { fmt } from '../utils.js';
import * as api from '../api.js';

export default function DonateForm({ campaign, setPendingDonation }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [anon, setAnon] = useState(false);
  const [paymentMethod, setPaymentMethodLocal] = useState('manual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const presets = [1000, 5000, 10000, 25000];

  useEffect(() => {
    api.getPaymentMethod()
      .then(r => setPaymentMethodLocal(r.method))
      .catch(e => console.error('Failed to load payment method:', e));
  }, []);

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const valid = finalAmount > 0 && name.trim() && email.includes('@');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setError('');

    const baseData = {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      amount: finalAmount,
      donorName: name.trim(),
      email: email.trim(),
      message: message.trim(),
      anonymous: anon
    };

    if (paymentMethod === 'paystack') {
      setSubmitting(true);
      try {
        const result = await api.initializePaystack({
          campaignId: campaign.id,
          donorName: name.trim(),
          email: email.trim(),
          amount: finalAmount,
          message: message.trim(),
          anonymous: anon
        });
        window.location.href = result.authorizationUrl;
      } catch (err) {
        setError(err.message || 'Could not start payment. Please try again.');
        setSubmitting(false);
      }
    } else {
      setPendingDonation(baseData);
      navigate('/payment');
    }
  };

  const buttonLabel = paymentMethod === 'paystack'
    ? `Pay ${fmt(finalAmount || 0)} via Paystack →`
    : `Continue to payment · ${fmt(finalAmount || 0)} →`;

  return (
    <>
      <Nav backTo={`/campaign/${campaign.id}`} />

      <div className="form-page">
        <h1 className="form-title">Donate to this campaign</h1>
        <p className="form-sub">{campaign.title}</p>

        {paymentMethod === 'paystack' && (
          <div className="payment-mode-banner paystack-mode">
            💳 Secure card payment powered by Paystack
          </div>
        )}
        {paymentMethod === 'manual' && (
          <div className="payment-mode-banner manual-mode">
            🏦 Pay via bank transfer (you'll upload your receipt next)
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Choose an amount</label>
            <div className="amount-grid">
              {presets.map(p => (
                <button type="button" key={p}
                  className={`amount-btn ${!customAmount && amount === p ? 'active' : ''}`}
                  onClick={() => { setAmount(p); setCustomAmount(''); }}>
                  ₦{p.toLocaleString('en-NG')}
                </button>
              ))}
            </div>
            <input type="number" min="1" placeholder="Or enter custom amount (₦)"
              value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
          </div>

          <div className="field">
            <label>Your name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
          </div>

          <div className="field">
            <label>Email *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
            <div className="field-hint">
              {paymentMethod === 'paystack'
                ? "Your receipt from Paystack will be sent here."
                : "We'll use this to identify your donation."}
            </div>
          </div>

          <div className="field">
            <label>Message of support (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Wishing you all the best…" />
          </div>

          <div className="field">
            <div className="checkbox-row">
              <input type="checkbox" id="anon" checked={anon} onChange={e => setAnon(e.target.checked)} />
              <label htmlFor="anon">Donate anonymously</label>
            </div>
          </div>

          {error && (
            <div style={{
              padding: 12,
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`btn ${paymentMethod === 'paystack' ? 'btn-success' : 'btn-primary'} btn-block btn-lg`}
            disabled={!valid || submitting}
          >
            {submitting ? <><span className="spinner-mini"></span> Redirecting to Paystack…</> : buttonLabel}
          </button>
        </form>
      </div>
    </>
  );
}