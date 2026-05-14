import { useState } from 'react';

const FIELDS = [
  ['bankName', 'Bank name *'],
  ['accountName', 'Account name *'],
  ['accountNumber', 'Account number *'],
  ['routingCode', 'Sort / Routing code'],
  ['reference', 'Reference instruction']
];

export default function BankEditor({ initial, onClose, onSave }) {
  const [data, setData] = useState(initial || {
    bankName: '', accountName: '', accountNumber: '',
    routingCode: '', reference: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const valid = data.bankName && data.accountName && data.accountNumber;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try { await onSave(data); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Edit bank details</h3>
        <p className="form-sub">These show on the donor payment page.</p>
        {FIELDS.map(([key, label]) => (
          <div className="field" key={key}>
            <label>{label}</label>
            <input value={data[key] || ''} onChange={e => setData({ ...data, [key]: e.target.value })} />
          </div>
        ))}
        <div className="field">
          <label>Notes shown to donor</label>
          <textarea rows={3} value={data.notes || ''} onChange={e => setData({ ...data, notes: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-light" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={!valid || saving}>
            {saving ? <><span className="spinner-mini"></span> Saving…</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
