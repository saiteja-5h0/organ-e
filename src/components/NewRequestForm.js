import React, { useState } from 'react';

export default function NewRequestForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    organ: '',
    urgency: 'High',
    blood: '',
    location: '',
    hospital: '',
    patient_name: '',
    patient_age: '',
    patient_report: ''
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
      const payload = {
        ...form,
        patient_age: form.patient_age ? Number(form.patient_age) : null,
        time: 'Just now'
      };
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      onCreated && onCreated(data);
      setForm({ organ: '', urgency: 'High', blood: '', location: '', hospital: '', patient_name: '', patient_age: '', patient_report: '' });
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
      <h4 style={{ margin: '0 0 12px 0' }}>New Transplant Request</h4>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <input name="patient_name" placeholder="Patient name" value={form.patient_name} onChange={update} required style={{ flex: 1, minWidth: 140 }} />
        <input name="patient_age" type="number" placeholder="Age" value={form.patient_age} onChange={update} min="0" max="120" style={{ width: 80 }} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <input name="organ" placeholder="Organ (e.g., Kidney)" value={form.organ} onChange={update} required />
        <select name="urgency" value={form.urgency} onChange={update}>
          <option>Critical</option>
          <option>High</option>
          <option>Moderate</option>
        </select>
        <input name="blood" placeholder="Blood group (e.g., O+)" value={form.blood} onChange={update} required />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <input name="location" placeholder="Location" value={form.location} onChange={update} required style={{ flex: 1 }} />
        <input name="hospital" placeholder="Hospital" value={form.hospital} onChange={update} required style={{ flex: 1 }} />
      </div>

      <textarea
        name="patient_report"
        placeholder="Patient clinical report (diagnosis, lab results, compatibility notes...)"
        value={form.patient_report}
        onChange={update}
        rows={3}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Create Request'}</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>

      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
    </form>
  );
}
