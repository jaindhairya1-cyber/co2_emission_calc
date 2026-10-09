import React, { useState } from 'react';
import { Sparkles, ShieldAlert, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

const API = 'http://127.0.0.1:8000';
const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16, marginBottom: 14 };
const h = { fontSize: '0.95rem', fontWeight: 700, margin: '0 0 8px' };
const muted = { fontSize: '0.8rem', color: '#6B7280' };

const statusLabel = (s) => (s === 'verified_historical' ? 'Verified' : s === 'source_supported_boundary_review' ? 'Source found, boundary to review' : 'Unverified');
const statusColor = (s) => (s === 'verified_historical' ? '#15803D' : s === 'source_supported_boundary_review' ? '#B45309' : '#B91C1C');

export default function CalculationPanel() {
  const { appData, setAppData, serverPrediction } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState([]);
  const [explanation, setExplanation] = useState('');

  const call = async (path, body) => {
    const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
  };

  const applyDescription = async () => {
    setBusy('parse'); setError(''); setNotes([]);
    try {
      const { parsed } = await call('/api/ai/parse', { text });
      const withIds = (arr, p) => (arr || []).map((x, i) => ({ ...x, id: `${p}-${Date.now()}-${i}`, sourceType: 'Estimated' }));
      setAppData((prev) => ({
        ...prev,
        electricity: parsed.electricity?.amount ? { ...prev.electricity, ...parsed.electricity, sourceType: 'Estimated' } : { ...prev.electricity, amount: 0 },
        fuels: withIds(parsed.fuels, 'fuel'),
        materials: withIds(parsed.materials, 'mat'),
        waste: withIds(parsed.waste, 'waste'),
        transport: { ...prev.transport, distance_km: 0 },
      }));
      setNotes(parsed.not_understood || []);
    } catch (e) { setError(e.message); }
    setBusy('');
  };

  const explain = async () => {
    setBusy('explain'); setError('');
    try {
      const { explanation: t } = await call('/api/ai/explain', appData);
      setExplanation(t);
    } catch (e) { setError(e.message); }
    setBusy('');
  };

  const p = serverPrediction;
  return (
    <div>
      <div style={card}>
        <h3 style={h}>Describe your business</h3>
        <p style={muted}>Groq turns your description into inputs. The numbers are then calculated from the factor dataset, never by the AI.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. We use 12,000 kWh of electricity a month, 500 litres of diesel for our generator, and buy 5 tonnes of steel monthly."
          style={{ width: '100%', margin: '10px 0', padding: 10, borderRadius: 10, border: '1px solid #D1D5DB', font: 'inherit', boxSizing: 'border-box' }}
        />
        <button type="button" className="btn-primary-pill" onClick={applyDescription} disabled={!text.trim() || !!busy}>
          <Sparkles size={16} /> {busy === 'parse' ? 'Reading…' : 'Fill inputs with AI'}
        </button>
        {notes.length > 0 && (
          <p style={{ ...muted, color: '#B45309', marginTop: 10 }}>Not used (no safe match in the dataset): {notes.join('; ')}</p>
        )}
      </div>

      {error && <div style={{ ...card, borderColor: '#FCA5A5', color: '#B91C1C' }}>{error}</div>}

      {p && (
        <div style={card}>
          <h3 style={h}>How this was calculated</h3>
          <p style={muted}>Total {p.total} t CO₂ · {p.dataset.name} v{p.dataset.version}</p>
          {p.unverified_share_pct > 0 && (
            <p style={{ ...muted, color: '#B45309', display: 'flex', gap: 6, alignItems: 'center' }}>
              <ShieldAlert size={14} /> {p.unverified_share_pct}% of this total uses factors that are not yet verified.
            </p>
          )}
          {p.line_items.map((l) => (
            <div key={l.factor_id + l.label} style={{ borderTop: '1px solid #F3F4F6', padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem' }}>
                <span>{l.label} (Scope {l.scope})</span><span>{l.emissions_tonnes.toFixed(2)} t</span>
              </div>
              <div style={muted}>{l.annual_quantity.toLocaleString()} {l.unit}/yr × {l.factor} {l.factor_unit}</div>
              <div style={muted}>
                <span style={{ color: statusColor(l.status), fontWeight: 600 }}>{statusLabel(l.status)}</span> · {l.reference_year || 'year not stated'} · {l.source}
                {l.source_url && <a href={l.source_url} target="_blank" rel="noreferrer" style={{ marginLeft: 6 }}><ExternalLink size={11} /></a>}
              </div>
              <div style={muted}>Boundary: {l.boundary}</div>
            </div>
          ))}
          {p.unsupported.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <strong style={{ fontSize: '0.85rem' }}>Not counted</strong>
              {p.unsupported.map((u) => <div key={u.domain + u.item} style={muted}>{u.domain} – {u.item}: {u.reason}</div>)}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <strong style={{ fontSize: '0.85rem' }}>Assumptions</strong>
            <ul style={{ ...muted, paddingLeft: 18, margin: '4px 0 0' }}>{p.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      )}

      <div style={card}>
        <h3 style={h}>Explain my footprint</h3>
        <button type="button" className="btn-primary-pill" onClick={explain} disabled={!!busy}>
          <Sparkles size={16} /> {busy === 'explain' ? 'Writing…' : 'Explain with AI'}
        </button>
        {explanation && <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginTop: 12, lineHeight: 1.5 }}>{explanation}</div>}
      </div>
    </div>
  );
}
