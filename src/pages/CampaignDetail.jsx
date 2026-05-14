import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav.jsx';
import { fmt } from '../utils.js';
import { campaignImageUrl } from '../api.js';

export default function CampaignDetail({ campaign }) {
  const navigate = useNavigate();
  const pct = Math.min((campaign.raised / campaign.goal) * 100, 100);
  const imgUrl = campaignImageUrl(campaign);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/campaign/${campaign.id}`;

  const handleShare = async () => {
    // Try native share first (mobile devices have this)
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          url: shareUrl
        });
        return;
      } catch (err) {
        // User cancelled, or share failed — fall back to copy
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Last resort — show the URL in a prompt
      prompt('Copy this link:', shareUrl);
    }
  };

  return (
    <>
      <Nav backTo="/" />

      <div className="detail-hero">
        {imgUrl ? (
          <img src={imgUrl} alt={campaign.title} />
        ) : (
          <div className="detail-hero-fallback">{campaign.title}</div>
        )}
      </div>

      <div className="detail-body">
        <div className="detail-header-row">
          <span className="campaign-cat">{campaign.category}</span>
          <button className="share-btn" onClick={handleShare} aria-label="Share campaign">
            {copied ? (
              <>✓ Copied!</>
            ) : (
              <>
                <ShareIcon /> Share
              </>
            )}
          </button>
        </div>
        <h1 className="detail-title">{campaign.title}</h1>
        <div className="detail-meta">By {campaign.creator}</div>

        <div className="detail-progress-card">
          <div>
            <span className="detail-raised">{fmt(campaign.raised)}</span>
            <span className="detail-of"> raised of {fmt(campaign.goal)}</span>
          </div>
          <div className="progress-container" style={{ height: 10, marginTop: 14 }}>
            <div className="progress-bar" style={{ width: pct + '%' }}></div>
          </div>
          <div className="detail-meta-row">
            <div className="detail-meta-cell">
              <div className="detail-meta-cell-num">{Math.round(pct)}%</div>
              <div className="detail-meta-cell-label">Funded</div>
            </div>
            <div className="detail-meta-cell">
              <div className="detail-meta-cell-num">{campaign.daysLeft}</div>
              <div className="detail-meta-cell-label">Days left</div>
            </div>
            <div className="detail-meta-cell">
              <div className="detail-meta-cell-num">{campaign.urgent ? 'Yes' : 'No'}</div>
              <div className="detail-meta-cell-label">Urgent</div>
            </div>
          </div>
        </div>

        <h2 className="story-title">The story</h2>
        <p className="story-text">{campaign.story}</p>
      </div>

      <div className="donate-bar">
        <div className="donate-bar-inner">
          <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate(`/donate/${campaign.id}`)}>
            Donate to this campaign →
          </button>
        </div>
      </div>
    </>
  );
}

function ShareIcon() {
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