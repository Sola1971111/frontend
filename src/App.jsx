import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
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
  const [campaigns, setCampaigns] = useState([]);
  const [bank, setBank] = useState(null);
  const [adminToken, setAdminToken] = useState(api.getToken());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [pendingDonation, setPendingDonation] = useState(null); // for payment page state

  const location = useLocation();

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
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="spinner"></div>
        <div className="loader-brand">Kindred</div>
      </div>
    );
  }

  // Show chat widget on all pages except admin
  const onAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      <Routes>
        <Route path="/" element={<Home campaigns={campaigns} />} />
        <Route
          path="/campaign/:id"
          element={<CampaignDetailWrapper campaigns={campaigns} />}
        />
        <Route
          path="/donate/:id"
          element={<DonateFormWrapper campaigns={campaigns} setPendingDonation={setPendingDonation} />}
        />
        <Route
          path="/payment"
          element={
            <PaymentPage
              donation={pendingDonation}
              bank={bank}
              showToast={showToast}
              onSuccess={refreshCampaigns}
            />
          }
        />
        <Route path="/thanks" element={<ThanksPage donation={pendingDonation} />} />

        <Route
          path="/admin"
          element={
            adminToken
              ? <AdminDashboard
                  campaigns={campaigns}
                  bank={bank}
                  refreshCampaigns={refreshCampaigns}
                  refreshBank={refreshBank}
                  setBank={setBank}
                  setAdminToken={setAdminToken}
                  showToast={showToast}
                />
              : <Navigate to="/admin/login" replace />
          }
        />
        <Route
          path="/admin/login"
          element={
            <AdminLogin
              setAdminToken={setAdminToken}
              showToast={showToast}
            />
          }
        />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!onAdminPage && <ChatWidget />}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  );
}

// Wrapper for campaign detail — pulls :id from URL, finds campaign
function CampaignDetailWrapper({ campaigns }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>Campaign not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go home</button>
      </div>
    );
  }
  return <CampaignDetail campaign={campaign} />;
}

// Wrapper for donate form
function DonateFormWrapper({ campaigns, setPendingDonation }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <h2>Campaign not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go home</button>
      </div>
    );
  }
  return <DonateForm campaign={campaign} setPendingDonation={setPendingDonation} />;
}