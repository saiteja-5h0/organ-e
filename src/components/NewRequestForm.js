import React, { useState } from 'react';

export default function NewRequestForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    organ: '',
    urgency: 'High',
    blood: '',
    location: '',
    hospital: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function update(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form, time: 'Just now' };
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      onCreated && onCreated(data);
      setForm({ organ: '', urgency: 'High', blood: '', location: '', hospital: '' });
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ margin: '16px 0', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.9)' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input name="organ" placeholder="Organ (e.g., Kidney)" value={form.organ} onChange={update} required />
        <select name="urgency" value={form.urgency} onChange={update}>
          <option>Critical</option>
          <option>High</option>
          <option>Moderate</option>
        </select>
        <input name="blood" placeholder="Blood group (e.g., O+)" value={form.blood} onChange={update} required />
        <input name="location" placeholder="Location" value={form.location} onChange={update} required />
        <input name="hospital" placeholder="Hospital" value={form.hospital} onChange={update} required />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Create Request'}</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>

      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
