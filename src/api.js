// frontend/src/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_BASE = BASE;

const TOKEN_KEY = 'kindred_admin_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const CHAT_THREAD_KEY = 'kindred_chat_thread';
export const getChatThreadId = () => localStorage.getItem(CHAT_THREAD_KEY);
export const setChatThreadId = (id) => localStorage.setItem(CHAT_THREAD_KEY, id);
export const clearChatThreadId = () => localStorage.removeItem(CHAT_THREAD_KEY);

async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!opts.body || typeof opts.body === 'string') headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.blob();
}

// ==== Auth ====
export const login = (username, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

// ==== Campaigns ====
export const listCampaigns = () => request('/api/campaigns');
export const getCampaign = (id) => request(`/api/campaigns/${id}`);
export const campaignImageUrl = (c) => c?.imageUrl ? `${BASE}${c.imageUrl}` : null;

export const createCampaign = async (data) => {
  const fd = new FormData();
  fd.append('title', data.title);
  fd.append('story', data.story);
  fd.append('creator', data.creator);
  fd.append('category', data.category);
  fd.append('gradient', data.gradient || '');
  fd.append('goal', data.goal);
  fd.append('daysLeft', data.daysLeft);
  fd.append('urgent', data.urgent ? 'true' : 'false');
  if (data.imageFile) fd.append('image', data.imageFile);

  const res = await fetch(`${BASE}/api/campaigns`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd
  });
  if (!res.ok) {
    let msg = 'Create failed'; try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export const updateCampaign = async (id, data) => {
  const fd = new FormData();
  if (data.title != null) fd.append('title', data.title);
  if (data.story != null) fd.append('story', data.story);
  if (data.creator != null) fd.append('creator', data.creator);
  if (data.category != null) fd.append('category', data.category);
  if (data.gradient != null) fd.append('gradient', data.gradient);
  if (data.goal != null) fd.append('goal', data.goal);
  if (data.daysLeft != null) fd.append('daysLeft', data.daysLeft);
  if (data.urgent != null) fd.append('urgent', data.urgent ? 'true' : 'false');
  if (data.imageFile) fd.append('image', data.imageFile);

  const res = await fetch(`${BASE}/api/campaigns/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd
  });
  if (!res.ok) {
    let msg = 'Update failed'; try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export const deleteCampaign = (id) => request(`/api/campaigns/${id}`, { method: 'DELETE' });

// ==== Donations ====
export const submitDonation = async ({ campaignId, donorName, email, amount, message, anonymous, receiptFile }) => {
  const fd = new FormData();
  fd.append('campaignId', campaignId);
  fd.append('donorName', donorName);
  fd.append('email', email);
  fd.append('amount', amount);
  if (message) fd.append('message', message);
  fd.append('anonymous', anonymous ? 'true' : 'false');
  fd.append('receipt', receiptFile);
  const res = await fetch(`${BASE}/api/donations`, { method: 'POST', body: fd });
  if (!res.ok) {
    let msg = 'Submission failed';
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export const listDonations = (status = 'all') => request(`/api/donations?status=${status}`);
export const approveDonation = (id) => request(`/api/donations/${id}/approve`, { method: 'POST' });
export const rejectDonation = (id) => request(`/api/donations/${id}/reject`, { method: 'POST' });
export const removeDonation = (id) => request(`/api/donations/${id}`, { method: 'DELETE' });
export const receiptUrl = (id) => `${BASE}/api/donations/${id}/receipt`;

// ==== Settings ====
export const getBank = () => request('/api/settings/bank');
export const updateBank = (data) => request('/api/settings/bank', { method: 'PUT', body: JSON.stringify(data) });
export const getStats = () => request('/api/settings/stats');
export const getPaymentMethod = () => request('/api/settings/payment-method');
export const setPaymentMethod = (method) => request('/api/settings/payment-method', {
  method: 'PUT',
  body: JSON.stringify({ method })
});

// ==== Paystack ====
export const initializePaystack = (data) =>
  request('/api/paystack/initialize', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const verifyPaystack = (reference) =>
  request(`/api/paystack/verify/${reference}`);

// ==== Chat (visitor) ====
export const createChatThread = (visitorName, visitorEmail) =>
  request('/api/chat/threads', { method: 'POST', body: JSON.stringify({ visitorName, visitorEmail }) });

export const sendVisitorMessage = (threadId, body) =>
  request(`/api/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, sender: 'visitor' })
  });

export const getVisitorThread = (threadId) =>
  request(`/api/chat/threads/${threadId}/messages`);

export const markVisitorRead = (threadId) =>
  request(`/api/chat/threads/${threadId}/read-visitor`, { method: 'POST' });

// ==== Chat (admin) ====
export const listChatThreads = () => request('/api/chat/admin/threads');
export const getAdminThread = (id) => request(`/api/chat/admin/threads/${id}`);
export const sendAdminMessage = (id, body) =>
  request(`/api/chat/admin/threads/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
export const markAdminRead = (id) =>
  request(`/api/chat/admin/threads/${id}/read`, { method: 'POST' });
export const deleteThread = (id) =>
  request(`/api/chat/admin/threads/${id}`, { method: 'DELETE' });
