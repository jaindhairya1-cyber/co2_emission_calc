import React from 'react';
import { ChevronLeft, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BillUploadReview from '../components/BillUploadReview';

export default function Screen06MaterialsWaste() {
  const {
    appData,
    tempId,
    updateBusiness,
    updateMaterials,
    addMaterial,
    updateWaste,
    navigateTo,
    goBack
  } = useApp();

  const materials = appData.materials || [];
  const wasteList = appData.waste || [];

  const materialTypes = ['Steel', 'Cotton yarn', 'Plastic polymers', 'Aluminum', 'Corrugated boxes', 'Chemicals'];
  const wasteTypes = ['General waste', 'Hazardous waste', 'Recyclable plastic', 'Metal scrap', 'Organic waste'];

  const handleMatChange = (index, field, value) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    updateMaterials(updated);
  };

  const handleWasteChange = (index, field, value) => {
    const updated = [...wasteList];
    updated[index] = { ...updated[index], [field]: value };
    updateWaste(updated);
  };

  const handleAddMaterial = () => {
    addMaterial({
      type: '',
      quantity: '',
      unit: '',
      period: '',
      sourceType: 'Estimated'
    });
  };

  const handleRemoveMat = (idx) => {
    if (materials.length > 1) {
      updateMaterials(materials.filter((_, i) => i !== idx));
    }
  };

  const handleMaterialsConfirmed = ({ records, fileName }) => {
    const next = [...materials];
    records.forEach((record, index) => {
      const value = {
        id: index === 0 ? (next[0]?.id || `mat-${Date.now()}`) : `mat-${Date.now()}-${index}`,
        type: record.type,
        quantity: record.quantity,
        unit: record.unit,
        period: record.period,
        sourceType: 'Actual (from confirmed bill)',
        billFileName: fileName
      };
      if (index === 0) next[0] = { ...next[0], ...value };
      else next.push(value);
    });
    updateMaterials(next);
  };

  const handleWasteConfirmed = ({ records, fileName }) => {
    const next = [...wasteList];
    records.forEach((record, index) => {
      const value = {
        id: index === 0 ? (next[0]?.id || `waste-${Date.now()}`) : `waste-${Date.now()}-${index}`,
        type: record.type,
        quantity: record.quantity,
        unit: record.unit,
        period: record.period,
        sourceType: 'Actual (from confirmed bill)',
        billFileName: fileName
      };
      if (index === 0) next[0] = { ...next[0], ...value };
      else next.push(value);
    });
    updateWaste(next);
  };

  const handleNext = (e) => {
    e?.preventDefault();
    navigateTo(7); // Screen 7: Review & Calculate (5 of 5)
  };

  return (
    <div className="screen-container form-wizard-screen">
      <div className="wizard-top-nav">
        <button
          type="button"
          className="wizard-back-btn"
          onClick={goBack}
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="step-counter">3 of 5</span>
      </div>

      <div className="wizard-header">
        <h1 className="wizard-title">Materials and waste</h1>
        <p className="wizard-subtitle">
          Tell us what you purchase and generate.
        </p>
      </div>

      <form onSubmit={handleNext} className="wizard-form-body">
        {/* Raw materials section */}
        <div className="input-card-section mb-4">
          <h2 className="card-section-title">Raw materials</h2>

          {materials.map((mat, idx) => (
            <div key={mat.id || idx} className="material-item-block">
              {materials.length > 1 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="item-subindex">Item #{idx + 1}</span>
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => handleRemoveMat(idx)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor={`mat-type-${idx}`}>Material type</label>
                <select
                  id={`mat-type-${idx}`}
                  className="form-select"
                  value={mat.type || ''}
                  onChange={(e) => handleMatChange(idx, 'type', e.target.value)}
                  required
                >
                  <option value="" disabled>Select material type</option>
                  {materialTypes.map((mt) => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`mat-qty-${idx}`}>Quantity</label>
                <div className="input-group-unit">
                  <input
                    id={`mat-qty-${idx}`}
                    type="number"
                    className="form-input unit-input"
                    value={mat.quantity ?? ''}
                    onChange={(e) => handleMatChange(idx, 'quantity', e.target.value)}
                    placeholder="Enter purchased material quantity"
                    required
                  />
                  <select
                    id={`mat-unit-${idx}`}
                    className="unit-select"
                    value={mat.unit || ''}
                    onChange={(e) => handleMatChange(idx, 'unit', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select unit</option>
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`mat-period-${idx}`}>Period</label>
                <select
                  id={`mat-period-${idx}`}
                  className="form-select"
                  value={mat.period || ''}
                  onChange={(e) => handleMatChange(idx, 'period', e.target.value)}
                  required
                >
                  <option value="" disabled>Select billing period</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

            </div>
          ))}

          <BillUploadReview
            category="Materials"
            tempId={tempId}
            appData={appData}
            onBusinessSuggestion={(name) => {
              if (!appData.business.name?.trim()) updateBusiness({ name });
            }}
            onConfirmed={handleMaterialsConfirmed}
          />

          <button
            type="button"
            className="btn-add-secondary mt-3"
            onClick={handleAddMaterial}
          >
            <Plus size={16} />
            <span>Add another material</span>
          </button>
        </div>

        {/* Waste section */}
        <div className="input-card-section">
          <h2 className="card-section-title">Waste</h2>
          <BillUploadReview
            category="Waste"
            tempId={tempId}
            appData={appData}
            onBusinessSuggestion={(name) => {
              if (!appData.business.name?.trim()) updateBusiness({ name });
            }}
            onConfirmed={handleWasteConfirmed}
          />

          {wasteList.map((waste, idx) => (
            <div key={waste.id || idx}>
              <div className="form-group">
                <label className="form-label" htmlFor={`waste-type-${idx}`}>Waste type</label>
                <select
                  id={`waste-type-${idx}`}
                  className="form-select"
                  value={waste.type || ''}
                  onChange={(e) => handleWasteChange(idx, 'type', e.target.value)}
                  required
                >
                  <option value="" disabled>Select waste type</option>
                  {wasteTypes.map((wt) => (
                    <option key={wt} value={wt}>{wt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`waste-qty-${idx}`}>Quantity</label>
                <div className="input-group-unit">
                  <input
                    id={`waste-qty-${idx}`}
                    type="number"
                    className="form-input unit-input"
                    value={waste.quantity ?? ''}
                    onChange={(e) => handleWasteChange(idx, 'quantity', e.target.value)}
                    placeholder="Enter waste quantity generated"
                    required
                  />
                  <select
                    id={`waste-unit-${idx}`}
                    className="unit-select"
                    value={waste.unit || ''}
                    onChange={(e) => handleWasteChange(idx, 'unit', e.target.value)}
                    required
                  >
                    <option value="" disabled>Select unit</option>
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="wizard-footer-nav">
          <button
            type="button"
            className="btn-wizard-back"
            onClick={goBack}
          >
            ← Back
          </button>
          <button
            type="submit"
            id="btn-mat-next"
            className="btn-wizard-next"
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
