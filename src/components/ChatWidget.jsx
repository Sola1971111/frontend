import { useState, useEffect, useRef } from 'react';
import * as api from '../api.js';

const POLL_INTERVAL = 4000; // 4 seconds

import { useLocation } from 'react-router-dom';

export default function ChatWidget({ hasDetailBar }) {
  const location = useLocation();
  // Move the chat button up when there's a sticky donate bar (campaign detail page)
  const onCampaignDetail = location.pathname.startsWith('/campaign/');
  hasDetailBar = hasDetailBar !== undefined ? hasDetailBar : onCampaignDetail;
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState(api.getChatThreadId());
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showIntro, setShowIntro] = useState(!api.getChatThreadId());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const bodyRef = useRef(null);

  // Poll for new messages
  useEffect(() => {
    if (!threadId) return;

    const fetchThread = async () => {
      try {
        const res = await api.getVisitorThread(threadId);
        setMessages(res.messages);
        setUnread(res.thread.unreadVisitor);
      } catch (e) {
        // Thread might be deleted, reset
        if (e.message.includes('not found')) {
          api.clearChatThreadId();
          setThreadId(null);
          setShowIntro(true);
        }
      }
    };

    fetchThread();
    const interval = setInterval(fetchThread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [threadId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Mark as read when window opens
  useEffect(() => {
    if (open && threadId && unread > 0) {
      api.markVisitorRead(threadId).catch(() => {});
      setUnread(0);
    }
  }, [open, threadId, unread]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const thread = await api.createChatThread(name.trim(), email.trim());
      api.setChatThreadId(thread.id);
      setThreadId(thread.id);
      setShowIntro(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!draft.trim() || sending || !threadId) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      const msg = await api.sendVisitorMessage(threadId, body);
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      setDraft(body); // restore on error
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (!open) {
    return (
      <button
        className={`chat-toggle ${hasDetailBar ? 'has-detail-bar' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open chat support"
      >
        <ChatIcon />
        {unread > 0 && <span className="chat-toggle-badge">{unread}</span>}
      </button>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <div className="chat-header-title">Kindred Support</div>
          <div className="chat-header-sub">
            <span className="chat-online-dot"></span> We typically reply quickly
          </div>
        </div>
        <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </div>

      {showIntro ? (
        <form className="chat-intro-form" onSubmit={handleStart}>
          <p className="chat-intro-greeting">
            Hi 👋 What's your name?
          </p>
          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={!name.trim()}>
            Start chat
          </button>
        </form>
      ) : (
        <>
          <div className="chat-body" ref={bodyRef}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                Send your first message and we'll reply as soon as possible.
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id}>
                  <div className={`chat-msg chat-msg-${m.sender}`}>
                    {m.body}
                  </div>
                  <div className="chat-msg-time" style={{
                    textAlign: m.sender === 'visitor' ? 'right' : 'left',
                    paddingLeft: m.sender === 'admin' ? 4 : 0,
                    paddingRight: m.sender === 'visitor' ? 4 : 0
                  }}>
                    {fmtTime(m.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="chat-form" onSubmit={handleSend}>
            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                placeholder="Type your message…"
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
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
