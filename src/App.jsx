import { useState, useEffect } from 'react';
import * as api from './api';

import Home from './pages/Home.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import DonateForm from './pages/DonateForm.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ThanksPage from './pages/ThanksPage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ChatWidget from './components/ChatWidget.jsx';

export default function App() {
  const [route, setRoute] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kindred_route');
      return saved ? JSON.parse(saved) : { name: 'home' };
    } catch { return { name: 'home' }; }
  });
  const [campaigns, setCampaigns] = useState([]);
  const [bank, setBank] = useState(null);
  const [adminToken, setAdminToken] = useState(api.getToken());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshCampaigns = async () => {
    try { setCampaigns(await api.listCampaigns()); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const refreshBank = async () => {
    try { setBank(await api.getBank()); }
    catch (e) { console.error(e); }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([refreshCampaigns(), refreshBank()]);

      // Detect Paystack return — URL like /?paystack_ref=KND_xxxxx
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('paystack_ref');
      if (ref) {
        // Clean the URL so refresh doesn't repeat this
        window.history.replaceState({}, '', window.location.pathname);
        setRoute({ name: 'thanks', paystackReference: ref });
        try {
          sessionStorage.setItem('kindred_route', JSON.stringify({ name: 'thanks', paystackReference: ref }));
        } catch {}
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="spinner"></div>
        <div className="loader-brand">
          <span className="logo-mark">K</span>
          Kindred
        </div>
      </div>
    );
  }

  const go = (r) => {
    setRoute(r);
    try { sessionStorage.setItem('kindred_route', JSON.stringify(r)); } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  let view;
  let onAdminPage = false;
  let hasDetailBar = false;

  if (route.name === 'home') {
    view = <Home campaigns={campaigns} go={go} />;
  } else if (route.name === 'campaign') {
    const c = campaigns.find(x => x.id === route.id);
    view = c ? <CampaignDetail campaign={c} go={go} /> : <NotFound go={go} />;
    hasDetailBar = !!c;
  } else if (route.name === 'donate') {
    const c = campaigns.find(x => x.id === route.id);
    view = c ? <DonateForm campaign={c} go={go} /> : <NotFound go={go} />;
  } else if (route.name === 'payment') {
    view = <PaymentPage donation={route.donation} bank={bank} go={go} showToast={showToast} onSuccess={refreshCampaigns} />;
  } else if (route.name === 'thanks') {
    view = <ThanksPage donation={route.donation} go={go} route={route} />;
  } else if (route.name === 'admin-login') {
    view = <AdminLogin go={go} setAdminToken={setAdminToken} showToast={showToast} />;
    onAdminPage = true;
  } else if (route.name === 'admin') {
    if (!adminToken) {
      view = <AdminLogin go={go} setAdminToken={setAdminToken} showToast={showToast} />;
    } else {
      view = <AdminDashboard
        go={go}
        campaigns={campaigns}
        bank={bank}
        refreshCampaigns={refreshCampaigns}
        refreshBank={refreshBank}
        setBank={setBank}
        setAdminToken={setAdminToken}
        showToast={showToast}
      />;
    }
    onAdminPage = true;
  }

  return (
    <>
      {view}
      {/* Chat widget shown on all public pages, NOT on admin pages */}
      {!onAdminPage && <ChatWidget hasDetailBar={hasDetailBar} />}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

function NotFound({ go }) {
  return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <h2>Not found</h2>
      <button className="btn btn-primary" onClick={() => go({ name: 'home' })}>Go home</button>
    </div>
  );
}
