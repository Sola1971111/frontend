import Nav from '../components/Nav.jsx';
import { fmt } from '../utils.js';
import { campaignImageUrl } from '../api.js';

export default function CampaignDetail({ campaign, go }) {
  const pct = Math.min((campaign.raised / campaign.goal) * 100, 100);
  const imgUrl = campaignImageUrl(campaign);

  return (
    <>
      <Nav go={go} backTo={{ name: 'home' }} showAdmin={false} />

      <div className="detail-hero">
        {imgUrl ? (
          <img src={imgUrl} alt={campaign.title} />
        ) : (
          <div className="detail-hero-fallback">{campaign.title}</div>
        )}
      </div>

      <div className="detail-body">
        <span className="campaign-cat" style={{ marginBottom: 12 }}>{campaign.category}</span>
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
          <button className="btn btn-primary btn-block btn-lg" onClick={() => go({ name: 'donate', id: campaign.id })}>
            Donate to this campaign →
          </button>
        </div>
      </div>
    </>
  );
}
