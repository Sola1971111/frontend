import { useState } from 'react';
import Nav from '../components/Nav.jsx';
import CampaignCard from '../components/CampaignCard.jsx';
import { fmt } from '../utils.js';

export default function Home({ campaigns, go }) {
  const [cat, setCat] = useState('All');
  const cats = ['All', 'Medical', 'Environment', 'Education', 'Creative', 'Community', 'Animals'];
  const filtered = cat === 'All' ? campaigns : campaigns.filter(c => c.category === cat);
  const totalRaised = campaigns.reduce((s, c) => s + c.raised, 0);

  return (
    <>
      <Nav go={go} />

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot"></span>
              {campaigns.length} active campaigns
            </div>
            <h1>Donate to causes that <span>actually matter</span>.</h1>
            <p>Kindred connects generous people with the causes, creators, and communities reshaping the world — one secure donation at a time.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('discover').scrollIntoView({ behavior: 'smooth' })}>
                Browse campaigns →
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
                How it works
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">{fmt(totalRaised)}</div>
                <div className="hero-stat-label">Total raised</div>
              </div>
              <div>
                <div className="hero-stat-num">{campaigns.length}</div>
                <div className="hero-stat-label">Campaigns</div>
              </div>
              <div>
                <div className="hero-stat-num">96%</div>
                <div className="hero-stat-label">Success rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVER */}
      <section className="section" id="discover">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Find a cause</h2>
            <p className="section-subtitle">Pick a category to filter campaigns</p>
          </div>

          <div className="pills">
            {cats.map(c => (
              <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 60 }}>
              No campaigns in this category yet.
            </p>
          ) : (
            <div className="grid">
              {filtered.map(c => (
                <CampaignCard key={c.id} c={c} onClick={() => go({ name: 'campaign', id: c.id })} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-tinted" id="how-it-works">
        <div className="container">
          <div className="section-head" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Three simple steps from generosity to impact</p>
          </div>
          <div className="grid">
            {[
              { n: '1', t: 'Pick a campaign', d: 'Browse causes that matter to you. Read the story behind every fundraiser.' },
              { n: '2', t: 'Donate securely', d: 'Transfer to our verified bank account, then upload your receipt. We confirm within 24 hours.' },
              { n: '3', t: 'See your impact', d: 'Watch your contribution help campaigns reach their goals. Get email updates as causes succeed.' }
            ].map(s => (
              <div key={s.n} className="card" style={{ padding: 28, textAlign: 'left' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, marginBottom: 16
                }}>{s.n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.t}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-logo">
          <span className="logo-mark">K</span> Kindred
        </div>
        <div className="footer-text">© 2026 Kindred. Built with care for generous people.</div>
      </footer>
    </>
  );
}
