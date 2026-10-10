import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';
import { getSession, isSupabaseConfigured } from '../services/supabaseClient';

const CATEGORY_NAMES = {
  Electricity: 'Electricity',
  Fuel: 'Fuel',
  Transport: 'Transport',
  Materials: 'Materials',
  Waste: 'Waste'
};

function getValue(fields, key) {
  const field = fields?.[key];
  return field && typeof field === 'object' && 'value' in field ? field.value : null;
}

function setField(fields, key, value) {
  const previous = fields[key];
  return {
    ...fields,
    [key]: {
      ...(previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {}),
      value,
      confidence: previous?.confidence ?? 1
    }
  };
}

function parsePeriod(value) {
  if (!value) return null;
  const period = String(value).toLowerCase();
  if (period.includes('quarter') || /\bq[1-4]\b/.test(period)) return 'Quarterly';
  if (period.includes('annual') || period.includes('year') || /\bfy\b/.test(period)) return 'Annual';
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/.test(period)) return 'Monthly';
  return null;
}

function makeActivityRecords(draft, category) {
  const data = draft.category_data || {};
  const period = parsePeriod(
    getValue(draft.common_fields, 'billing_period')
      || getValue(data, 'billing_period')
  );
  const records = [];
  const add = (type, quantity, unit) => {
    const parsed = Number(quantity);
    if (String(type || '').trim() && Number.isFinite(parsed) && parsed > 0) {
      records.push({ type, quantity: parsed, unit, period: period || 'Monthly' });
    }
  };

  if (category === 'Electricity') {
    let units = getValue(data, 'units_consumed_kwh');
    if (!units || Number(units) <= 0) {
      const curr = getValue(data, 'current_reading');
      const prev = getValue(data, 'previous_reading');
      if (curr && prev && Number(curr) > Number(prev)) {
        units = Number(curr) - Number(prev);
      }
    }
    if (!units || Number(units) <= 0) {
      const amt = getValue(data, 'amount') || getValue(draft.common_fields, 'total_amount_inr');
      if (amt && Number(amt) > 0) {
        units = Math.round(Number(amt) / 10.18);
      }
    }
    add('Grid electricity', units, 'kWh');
  } else if (category === 'Fuel') {
    (Array.isArray(data.line_items) ? data.line_items : []).forEach((item) => {
      add(item.fuel_type, item.quantity, item.unit);
    });
    if (!records.length) {
      add('Diesel', getValue(data, 'diesel_litres'), 'Litres');
      add('Petrol', getValue(data, 'petrol_litres'), 'Litres');
      add('LPG', getValue(data, 'lpg_cylinders'), 'nos');
    }
    if (!records.length) {
      const amt = getValue(data, 'amount') || getValue(draft.common_fields, 'total_amount_inr');
      if (amt && Number(amt) > 0) {
        add('Diesel', Math.round(Number(amt) / 90), 'Litres');
      }
    }
  } else if (category === 'Transport') {
    const type = getValue(data, 'vehicle_type') || 'Light Commercial Vehicle';
    let km = getValue(data, 'total_distance_km');
    if (!km || Number(km) <= 0) {
      const amt = getValue(data, 'amount') || getValue(draft.common_fields, 'total_amount_inr');
      if (amt && Number(amt) > 0) {
        km = Math.round(Number(amt) / 45);
      }
    }
    add(type, km, 'km');
  } else if (category === 'Materials') {
    (Array.isArray(data.line_items) ? data.line_items : []).forEach((item) => {
      let mtype = item.material_type || item.item_name || 'Cotton Fabric';
      const mtypeLower = String(mtype).toLowerCase();
      if (mtypeLower.includes('cotton') || mtypeLower.includes('fabric') || mtypeLower.includes('yarn')) mtype = 'Cotton Fabric';
      else if (mtypeLower.includes('poly') || mtypeLower.includes('plastic')) mtype = 'Polyester Yarn';
      else if (mtypeLower.includes('steel') || mtypeLower.includes('metal')) mtype = 'Steel';
      else if (mtypeLower.includes('carton') || mtypeLower.includes('cardboard') || mtypeLower.includes('pack')) mtype = 'Cardboard';
      else if (mtypeLower.includes('alumin')) mtype = 'Aluminum';
      else mtype = 'Cotton Fabric';
      add(mtype, item.weight_kg ?? item.quantity, item.weight_kg != null ? 'kg' : item.unit || 'kg');
    });
    if (!records.length) {
      add('Cotton Fabric', getValue(data, 'cotton_kg'), 'kg');
      add('Polyester Yarn', getValue(data, 'polyester_kg'), 'kg');
      add('Cotton Fabric', getValue(data, 'total_material_weight_kg'), 'kg');
    }
    if (!records.length) {
      const amt = getValue(data, 'amount') || getValue(draft.common_fields, 'total_amount_inr');
      if (amt && Number(amt) > 0) {
        add('Cotton Fabric', Math.round(Number(amt) / 310), 'kg');
      }
    }
  } else if (category === 'Waste') {
    (Array.isArray(data.line_items) ? data.line_items : []).forEach((item) => {
      add(item.waste_type, item.quantity_kg, 'kg');
    });
    if (!records.length) add('General waste', getValue(data, 'total_waste_kg'), 'kg');
    if (!records.length) {
      const amt = getValue(data, 'amount') || getValue(draft.common_fields, 'total_amount_inr');
      if (amt && Number(amt) > 0) {
        add('General waste', Math.round(Number(amt) / 5.5), 'kg');
      }
    }
  }
  return records;
}

function editableFields(fields, onChange) {
  return Object.entries(fields || {})
    .filter(([, field]) => field && typeof field === 'object' && 'value' in field && !Array.isArray(field.value))
    .map(([key, field]) => {
      const isNumeric = key.includes('amount') || key.includes('reading') || key.includes('kwh') || key.includes('litres') || key.includes('cylinders') || key.includes('distance') || key.includes('weight') || key.includes('total_') || key.includes('units') || typeof field.value === 'number';
      return (
        <label className="form-group" key={key}>
          <span className="form-label">{key.replaceAll('_', ' ')}</span>
          <input
            className="form-input"
            type={isNumeric ? 'number' : 'text'}
            value={field.value ?? ''}
            placeholder={isNumeric ? '0' : 'Enter value'}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === '') {
                onChange(key, null);
              } else if (isNumeric) {
                const parsed = Number(raw);
                onChange(key, isNaN(parsed) ? raw : parsed);
              } else {
                onChange(key, raw);
              }
            }}
          />
          {field.value != null && field.confidence != null && (
            <small className="text-muted">Confidence: {Math.round(field.confidence * 100)}%</small>
          )}
        </label>
      );
    });
}

export default function BillUploadReview({ category, tempId, appData, onConfirmed, onBusinessSuggestion }) {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const records = useMemo(
    () => draft ? makeActivityRecords(draft, category) : [],
    [draft, category]
  );

  const updateGroupField = (group, key, value) => {
    setDraft((current) => ({
      ...current,
      [group]: setField(current[group] || {}, key, value)
    }));
  };

  const handleFile = async (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      setError('Upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }
    if (selected.size > 12 * 1024 * 1024) {
      setError('Documents must be 12 MB or smaller.');
      return;
    }

    setFile(selected);
    setDraft(null);
    setEditing(false);
    setError('');
    setSuccess('');
    setLoading(true);
    const form = new FormData();
    form.append('file', selected);
    form.append('target_category', category);
    form.append('business_name', appData.business?.name || '');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/bills/extract`, {
        method: 'POST',
        body: form
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || `Extraction failed (HTTP ${response.status}).`);
      setDraft(result);
    } catch (err) {
      setError(err.message || 'Could not read this document. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!draft || !file || !records.length) {
      setError('No valid activity quantity was extracted. Edit the details or upload a clearer document.');
      return;
    }
    if (!draft.category_matches_page) {
      setError('This document does not match the selected category. Upload it from the correct activity page.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const session = await getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (isSupabaseConfigured() && session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/bills/confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: tempId,
          target_category: category,
          detected_category: draft.detected_category,
          document_hash: draft.document_hash,
          file_name: file.name,
          activity_records: records,
          common_fields: draft.common_fields,
          category_data: draft.category_data,
          business_name: appData.business?.name || 'MSME Enterprise',
          industry: appData.business?.industry || 'Manufacturing',
          city: appData.business?.city || '',
          owner_name: appData.business?.ownerName || null,
          email: appData.business?.email || null,
          phone: appData.business?.phone || null
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || `Save failed (HTTP ${response.status}).`);
      onConfirmed({ category, records, fileName: file.name, draft });
      setSuccess('Confirmed activity saved. Carbon calculations will use the updated values.');
      setDraft(null);
      setFile(null);
    } catch (err) {
      setError(err.message || 'Could not save confirmed activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="input-card-section mb-4" aria-label={`${CATEGORY_NAMES[category]} bill extraction`}>
      <h2 className="card-section-title">Extract activity from a bill</h2>
      <p className="text-muted text-xs mb-3">PDF, JPG, JPEG or PNG; maximum 12 MB.</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        hidden
        onChange={handleFile}
      />
      <button type="button" className="btn-upload-outline" disabled={loading || saving} onClick={() => inputRef.current?.click()}>
        {loading ? <Loader2 size={16} className="spinner" /> : <Upload size={16} />}
        <span>{loading ? 'Reading and extracting…' : file ? `Selected: ${file.name}` : 'Upload bill / document'}</span>
      </button>
      {loading && <p role="status" className="text-muted text-xs mt-2">The document is being checked and extracted. No activity is saved yet.</p>}

      {draft && (
        <div className="mt-3">
          <h3 className="card-section-title">Review extracted details</h3>
          <p className="text-muted text-xs">{draft.detected_category} · {draft.ocr_engine}</p>
          {draft.validation_flags?.map((flag, index) => (
            <p className="text-xs mt-2" key={`${flag.field}-${index}`}>{flag.type === 'warning' ? 'Review: ' : ''}{flag.message}</p>
          ))}
          {draft.business_suggestion?.name && draft.business_suggestion.name !== appData.business?.name && (
            <p className="text-xs mt-2">
              Business on document: <strong>{draft.business_suggestion.name}</strong>. Profile autofill is only offered for blank profile fields; existing details will not be overwritten.
            </p>
          )}
          {!appData.business?.name?.trim() && draft.business_suggestion?.name && (
            <button
              type="button"
              className="btn-upload-outline mt-2"
              onClick={() => onBusinessSuggestion?.(draft.business_suggestion.name)}
            >
              Use extracted business name
            </button>
          )}
          {editing ? (
            <>
              <h4 className="form-label mt-3">Bill details</h4>
              <div className="grid grid-cols-1 gap-2">
                {editableFields(draft.common_fields, (key, value) => updateGroupField('common_fields', key, value))}
              </div>
              <h4 className="form-label mt-3">{CATEGORY_NAMES[category]} activity fields</h4>
              <div className="grid grid-cols-1 gap-2">
                {editableFields(draft.category_data, (key, value) => updateGroupField('category_data', key, value))}
              </div>
              {Array.isArray(draft.category_data?.line_items) && draft.category_data.line_items.map((item, index) => (
                <div className="input-card-section mt-2" key={`item-${index}`}>
                  <strong>Line item {index + 1}</strong>
                  {Object.entries(item).filter(([, value]) => typeof value === 'string' || typeof value === 'number').map(([key, value]) => (
                    <label className="form-group" key={key}>
                      <span className="form-label">{key.replaceAll('_', ' ')}</span>
                      <input
                        className="form-input"
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value ?? ''}
                        onChange={(event) => {
                          const next = [...draft.category_data.line_items];
                          next[index] = { ...next[index], [key]: typeof value === 'number' ? Number(event.target.value) : event.target.value };
                          setDraft((current) => ({ ...current, category_data: { ...current.category_data, line_items: next } }));
                        }}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="text-xs mt-2">Extracted activity:</p>
              {records.length ? records.map((record, index) => (
                <p className="text-xs" key={`${record.type}-${index}`}>
                  {record.type}: {record.quantity.toLocaleString()} {record.unit} ({record.period})
                </p>
              )) : <p className="text-xs mt-2">No usable activity quantity was found. Edit details or upload a clearer document.</p>}
              {Object.entries(draft.common_fields || {}).map(([key, field]) => (
                <p className="text-xs" key={key}>{key.replaceAll('_', ' ')}: {field.value ?? 'Not found'}</p>
              ))}
              {Object.entries(draft.category_data || {}).filter(([key, field]) => key !== 'line_items' && field && typeof field === 'object' && 'value' in field).map(([key, field]) => (
                <p className="text-xs" key={key}>{key.replaceAll('_', ' ')}: {field.value ?? 'Not found'}</p>
              ))}
            </>
          )}
          <div className="flex gap-2 mt-3">
            {editing ? (
              <button type="button" className="btn-upload-outline" onClick={() => setEditing(false)}>Done editing</button>
            ) : (
              <button type="button" className="btn-upload-outline" onClick={() => setEditing(true)}>Edit Details</button>
            )}
            <button type="button" className="btn-primary-pill" disabled={saving || loading || !records.length || !draft.category_matches_page} onClick={handleConfirm}>
              {saving ? 'Saving…' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-red-500 text-xs mt-2"><AlertCircle size={14} /> {error}</p>}
      {success && <p role="status" className="text-xs mt-2"><CheckCircle size={14} /> {success}</p>}
    </section>
  );
}
