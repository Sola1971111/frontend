import { useState, useRef } from 'react';
import { campaignImageUrl } from '../api.js';

const CATS = ['Medical', 'Environment', 'Education', 'Creative', 'Community', 'Animals'];

export default function CampaignEditor({ initial, onClose, onSave }) {
  const isNew = !initial;
  const [data, setData] = useState(initial || {
    title: '', category: 'Medical',
    goal: 100000, daysLeft: 30, urgent: false, story: '', creator: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const valid = data.title?.trim() && data.story?.trim() && data.creator?.trim() && data.goal > 0;
  const existingImageUrl = initial ? campaignImageUrl(initial) : null;

  const handleImageChange = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Please use one under 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({ ...data, imageFile });
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = imagePreview || existingImageUrl;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isNew ? 'New campaign' : 'Edit campaign'}</h3>

        <div className="field">
          <label>Cover image {isNew && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(recommended)</span>}</label>
          <div className={`upload-box ${imageFile || existingImageUrl ? 'has-file' : ''}`}
               onClick={() => fileRef.current?.click()}
               style={{ padding: previewSrc ? 12 : 24 }}>
            {previewSrc ? (
              <>
                <img src={previewSrc} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }} />
                <div className="upload-hint" style={{ marginTop: 10 }}>
                  {imageFile ? `New: ${imageFile.name}` : 'Tap to replace'}
                </div>
              </>
            ) : (
              <>
                <div className="upload-icon">🖼️</div>
                <div className="upload-text">Tap to upload image</div>
                <div className="upload-hint">JPG, PNG, or WebP (max 5MB)</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                 onChange={e => handleImageChange(e.target.files?.[0])} />
        </div>

        <div className="field">
          <label>Title *</label>
          <input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Creator name *</label>
          <input value={data.creator} onChange={e => setData({ ...data, creator: e.target.value })} />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Goal amount (₦) *</label>
          <input type="number" value={data.goal} onChange={e => setData({ ...data, goal: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>Days left</label>
          <input type="number" value={data.daysLeft} onChange={e => setData({ ...data, daysLeft: Number(e.target.value) })} />
        </div>
        <div className="field">
          <div className="checkbox-row">
            <input type="checkbox" id="urgent" checked={!!data.urgent}
                   onChange={e => setData({ ...data, urgent: e.target.checked })} />
            <label htmlFor="urgent">Mark as urgent</label>
          </div>
        </div>
        <div className="field">
          <label>Story *</label>
          <textarea rows={5} value={data.story} onChange={e => setData({ ...data, story: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-light" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!valid || saving} onClick={handleSave}>
            {saving ? <><span className="spinner-mini"></span> Saving…</> : (isNew ? 'Create' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
