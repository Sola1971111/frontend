import { useState, useEffect, useRef } from 'react';
import * as api from '../api.js';

const POLL_INTERVAL = 4000;

export default function ChatAdminPanel({ showToast, onUnreadChange }) {
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  const refreshThreads = async () => {
    try {
      const list = await api.listChatThreads();
      setThreads(list);
      const totalUnread = list.reduce((s, t) => s + (t.unreadAdmin || 0), 0);
      if (onUnreadChange) onUnreadChange(totalUnread);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshActive = async () => {
    if (!activeId) return;
    try {
      const res = await api.getAdminThread(activeId);
      setActiveThread(res.thread);
      setMessages(res.messages);
    } catch (e) {
      console.error(e);
    }
  };

  // Initial load + polling for thread list
  useEffect(() => {
    refreshThreads();
    const i = setInterval(refreshThreads, POLL_INTERVAL);
    return () => clearInterval(i);
  }, []);

  // Polling for active thread
  useEffect(() => {
    if (!activeId) return;
    refreshActive();
    const i = setInterval(refreshActive, POLL_INTERVAL);
    return () => clearInterval(i);
  }, [activeId]);

  // Mark as read when opening
  useEffect(() => {
    if (activeId) {
      api.markAdminRead(activeId).catch(() => {});
      // Update local count immediately
      setThreads(prev => prev.map(t => t.id === activeId ? { ...t, unreadAdmin: 0 } : t));
    }
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!draft.trim() || sending || !activeId) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      const msg = await api.sendAdminMessage(activeId, body);
      setMessages(prev => [...prev, msg]);
      refreshThreads();
    } catch (err) {
      setDraft(body);
      showToast(err.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteThread = async (id) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await api.deleteThread(id);
      if (activeId === id) {
        setActiveId(null);
        setActiveThread(null);
        setMessages([]);
      }
      await refreshThreads();
      showToast('Conversation deleted', 'info');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const fmtTime = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-admin-layout">
      {/* Thread list (left side) */}
      <div className={`chat-thread-list ${activeId ? '' : 'mobile-show'}`}>
        {threads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            No conversations yet. When visitors start a chat, they'll appear here.
          </div>
        ) : (
          threads.map(t => (
            <button
              key={t.id}
              className={`chat-thread-item ${activeId === t.id ? 'active' : ''}`}
              onClick={() => setActiveId(t.id)}
            >
              <div className="chat-thread-name">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.visitorName || 'Guest'}
                </span>
                {t.unreadAdmin > 0 && <span className="chat-thread-unread">{t.unreadAdmin}</span>}
              </div>
              {t.visitorEmail && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.visitorEmail}
                </div>
              )}
              <div className="chat-thread-time">
                {fmtTime(t.lastMessageAt)}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail (right side) */}
      <div className={`chat-admin-detail ${activeId ? '' : 'mobile-hide'}`}>
        {!activeThread ? (
          <div className="chat-admin-detail-empty">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            <div className="chat-admin-detail-head">
              <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="back-to-threads" onClick={() => setActiveId(null)}>← Back</button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeThread.visitorName || 'Guest'}
                  </div>
                  {activeThread.visitorEmail && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{activeThread.visitorEmail}</div>
                  )}
                </div>
              </div>
              <button className="btn btn-light btn-sm" onClick={() => handleDeleteThread(activeId)}>
                Delete
              </button>
            </div>

            <div className="chat-admin-detail-body" ref={bodyRef}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32, fontSize: 14 }}>
                  No messages yet.
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id}>
                    <div className={`chat-msg chat-msg-${m.sender === 'admin' ? 'visitor' : 'admin'}`}>
                      {/* Admin sees their own messages on the right (visitor styling) and visitor messages on the left */}
                      {m.body}
                    </div>
                    <div className="chat-msg-time" style={{
                      textAlign: m.sender === 'admin' ? 'right' : 'left',
                      paddingLeft: m.sender === 'visitor' ? 4 : 0,
                      paddingRight: m.sender === 'admin' ? 4 : 0
                    }}>
                      {m.sender === 'admin' ? 'You' : (activeThread.visitorName || 'Guest')} · {fmtTime(m.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="chat-form" onSubmit={handleSend}>
              <div className="chat-input-wrap">
                <textarea
                  className="chat-input"
                  placeholder="Reply to visitor…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                />
                <button type="submit" className="chat-send" disabled={!draft.trim() || sending}>
                  {sending ? <span className="spinner-mini"></span> : '↑'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
