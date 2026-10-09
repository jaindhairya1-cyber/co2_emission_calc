import React from 'react';
import { ChevronLeft, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BillUploadReview from '../components/BillUploadReview';

export default function Screen05ActivityFuel() {
  const { appData, tempId, updateBusiness, updateFuels, addFuel, navigateTo, goBack } = useApp();
  const fuels = appData.fuels || [];

  const fuelTypes = ['Diesel', 'Petrol', 'LPG', 'Natural Gas', 'Coal'];

  const handleFuelChange = (index, field, value) => {
    const updated = [...fuels];
    updated[index] = { ...updated[index], [field]: value };
    updateFuels(updated);
  };

  const handleAddFuel = () => {
    addFuel({
      type: '',
      quantity: '',
      unit: '',
      period: '',
      sourceType: 'Estimated',
      billFileName: null
    });
  };

  const handleRemoveFuel = (index) => {
    if (fuels.length > 1) {
      const updated = fuels.filter((_, i) => i !== index);
      updateFuels(updated);
    }
  };

  const handleBillConfirmed = ({ records, fileName }) => {
    const nextFuels = [...fuels];
    records.forEach((record, index) => {
      const value = {
        id: index === 0 ? (nextFuels[0]?.id || `fuel-${Date.now()}`) : `fuel-${Date.now()}-${index}`,
        type: record.type,
        quantity: record.quantity,
        unit: record.unit,
        period: record.period,
        sourceType: 'Actual (from confirmed bill)',
        billFileName: fileName
      };
      if (index === 0) nextFuels[0] = { ...nextFuels[0], ...value };
      else nextFuels.push(value);
    });
    updateFuels(nextFuels);
  };

  const handleNext = (e) => {
    e?.preventDefault();
    navigateTo(6); // Screen 6: Materials & Waste
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
        <span className="step-counter">2 of 5</span>
      </div>

      <form onSubmit={handleNext} className="wizard-form-body">
        {fuels.map((fuel, idx) => (
          <div key={fuel.id || idx} className="input-card-section mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="card-section-title">
                {idx === 0 ? 'Fuel consumption' : `Fuel consumption #${idx + 1}`}
              </h2>
              {fuels.length > 1 && (
                <button
                  type="button"
                  className="btn-icon-danger"
                  onClick={() => handleRemoveFuel(idx)}
                  title="Remove fuel"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`fuel-type-${idx}`}>Fuel type</label>
              <select
                id={`fuel-type-${idx}`}
                className="form-select"
                value={fuel.type || ''}
                onChange={(e) => handleFuelChange(idx, 'type', e.target.value)}
                required
              >
                <option value="" disabled>Select fuel type</option>
                {fuelTypes.map((ft) => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`fuel-qty-${idx}`}>Quantity</label>
              <div className="input-group-unit">
                <input
                  id={`fuel-qty-${idx}`}
                  type="number"
                  className="form-input unit-input"
                  value={fuel.quantity ?? ''}
                  onChange={(e) => handleFuelChange(idx, 'quantity', e.target.value)}
                  placeholder="Enter fuel quantity consumed"
                  required
                />
                <select
                  id={`fuel-unit-${idx}`}
                  className="unit-select"
                  value={fuel.unit || ''}
                  onChange={(e) => handleFuelChange(idx, 'unit', e.target.value)}
                  required
                >
                  <option value="" disabled>Select unit</option>
                  <option value="Litres">Litres</option>
                  <option value="kg">kg</option>
                  <option value="m³">m³</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`fuel-period-${idx}`}>Period</label>
              <select
                id={`fuel-period-${idx}`}
                className="form-select"
                value={fuel.period || ''}
                onChange={(e) => handleFuelChange(idx, 'period', e.target.value)}
                required
              >
                <option value="" disabled>Select billing period</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name={`fuel-source-${idx}`}
                  value="Actual (from bills)"
                  checked={fuel.sourceType === 'Actual (from bills)'}
                  onChange={(e) => handleFuelChange(idx, 'sourceType', e.target.value)}
                />
                <span className="custom-radio"></span>
                <span className="radio-text">Actual (from bills)</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name={`fuel-source-${idx}`}
                  value="Estimated"
                  checked={fuel.sourceType === 'Estimated'}
                  onChange={(e) => handleFuelChange(idx, 'sourceType', e.target.value)}
                />
                <span className="custom-radio"></span>
                <span className="radio-text">Estimated</span>
              </label>
            </div>

          </div>
        ))}

        <BillUploadReview
          category="Fuel"
          tempId={tempId}
          appData={appData}
          onBusinessSuggestion={(name) => {
            if (!appData.business.name?.trim()) updateBusiness({ name });
          }}
          onConfirmed={handleBillConfirmed}
        />

        {/* Repeat for other fuels */}
        <div className="add-fuel-section">
          <p className="repeat-label">Repeat for other fuels</p>
          <button
            type="button"
            className="btn-add-secondary"
            onClick={handleAddFuel}
          >
            <Plus size={16} />
            <span>Add another fuel</span>
          </button>
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
            id="btn-fuel-next"
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
