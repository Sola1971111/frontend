import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { fmt } from '../utils.js';
import * as api from '../api.js';

export default function ThanksPage({ donation: donationFromProp }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Donation can come from route state (manual flow) or from props (legacy)
  const donation = location.state?.donation || donationFromProp;
  const paystackRef = searchParams.get('paystack_ref');
  const isPaystackReturn = !!paystackRef;

  const [verified, setVerified] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPaystackReturn) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;

    const check = async () => {
      try {
        const result = await api.verifyPaystack(paystackRef);
        if (cancelled) return;
        if (result.status === 'approved') {
          setVerified(result);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 2000);
        } else {
          setVerified(result);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not verify payment');
      }
    };

    check();
    return () => { cancelled = true; };
  }, [paystackRef, isPaystackReturn]);

  // === PAYSTACK RETURN FLOW ===
  if (isPaystackReturn) {
    if (error) {
      return (
        <div className="thanks-wrap">
          <div className="thanks-icon-wrap" style={{ background: 'var(--danger-light)' }}>
            <span className="thanks-icon" style={{ color: 'var(--danger)' }}>!</span>
          </div>
          <h1 className="thanks-title">Payment status unknown</h1>
          <p className="thanks-sub">
            We couldn't verify your payment right now. Don't worry — if your payment went through,
            it will be added to the campaign once we receive confirmation from Paystack.
          </p>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/')}>
            Back to campaigns
          </button>
        </div>
      );
    }

    if (verified === null) {
      return (
        <div className="thanks-wrap">
          <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
          <h1 className="thanks-title">Confirming your payment…</h1>
          <p className="thanks-sub">Hang tight — this usually takes just a few seconds.</p>
        </div>
      );
    }

    if (verified.status === 'approved') {
      return (
        <div className="thanks-wrap">
          <div className="thanks-icon-wrap">
            <span className="thanks-icon">✓</span>
          </div>
          <h1 className="thanks-title">Thank you!</h1>
          <p className="thanks-sub">
            Your donation of <b style={{ color: 'var(--success-dark)' }}>{fmt(verified.amount)}</b> has
            been confirmed and added to the campaign.
          </p>
          <div className="thanks-card">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Reference
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {paystackRef}
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/')}>
            Back to campaigns
          </button>
        </div>
      );
    }

    return (
      <div className="thanks-wrap">
        <div className="thanks-icon-wrap" style={{ background: 'var(--accent-light)' }}>
          <span className="thanks-icon" style={{ color: 'var(--accent)' }}>⋯</span>
        </div>
        <h1 className="thanks-title">Processing your payment</h1>
        <p className="thanks-sub">
          Your payment is being processed. It will appear on the campaign within a few minutes
          once Paystack confirms it.
        </p>
        <div className="thanks-card">
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Reference
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {paystackRef}
          </div>
        </div>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/')}>
          Back to campaigns
        </button>
      </div>
    );
  }

  // === MANUAL FLOW ===
  if (!donation) {
    // No donation context — user landed here directly somehow
    return (
      <div className="thanks-wrap">
        <h1 className="thanks-title">No donation in progress</h1>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/')}>
          Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="thanks-wrap">
      <div className="thanks-icon-wrap">
        <span className="thanks-icon">✓</span>
      </div>
      <h1 className="thanks-title">We got your donation</h1>
      <p className="thanks-sub">
        Thanks for your <b style={{ color: 'var(--success-dark)' }}>{fmt(donation.amount)}</b> donation.
        We're reviewing your transfer now — it'll appear on the campaign once we've confirmed it.
      </p>

      {donation.id && (
        <div className="thanks-card">
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Reference ID
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {donation.id}
          </div>
        </div>
      )}

      <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate('/')}>
        Back to campaigns
      </button>
    </div>
  );
}