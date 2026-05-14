import { fmt } from '../utils.js';
import { campaignImageUrl } from '../api.js';

export default function CampaignCard({ c, onClick }) {
  const pct = Math.min((c.raised / c.goal) * 100, 100);
  const imgUrl = campaignImageUrl(c);

  return (
    <button className="card" onClick={onClick}>
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
