import { useState } from 'react';
import { fmt } from '../utils.js';
import { campaignImageUrl } from '../api.js';

export default function CampaignCard({ c, onClick }) {
  const pct = Math.min((c.raised / c.goal) * 100, 100);
  const imgUrl = campaignImageUrl(c);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();  // don't trigger the card click
    const shareUrl = `${window.location.origin}/campaign/${c.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: c.title,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt('Copy this link:', shareUrl);
    }
  };

  return (
    <button className="card" onClick={onClick} style={{ position: 'relative' }}>
      <div className="campaign-img">
        {imgUrl ? (
          <img src={imgUrl} alt={c.title} loading="lazy" />
        ) : (
          <div className="campaign-img-fallback">{c.title}</div>
        )}
        {c.urgent && (
          <span className="urgent-badge">
            <span className="urgent-dot"></span> Urgent
          </span>
        )}
        <span className="share-btn-card" onClick={handleShare} title="Share">
          {copied ? '✓' : <ShareIconSmall />}
        </span>
      </div>
      <div className="campaign-body">
        <span className="campaign-cat">{c.category}</span>
        <h3 className="campaign-title">{c.title}</h3>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: pct + '%' }}></div>
        </div>
        <div className="campaign-stats">
          <span>
            <span className="raised">{fmt(c.raised)}</span>
            <span className="goal"> / {fmt(c.goal)}</span>
          </span>
          <span>{c.daysLeft > 0 ? `${c.daysLeft}d left` : (c.raised >= c.goal ? '✓ Funded' : 'Ended')}</span>
        </div>
      </div>
    </button>
  );
}

function ShareIconSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}