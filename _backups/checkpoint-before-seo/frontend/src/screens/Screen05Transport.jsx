import React from 'react';
import { ChevronLeft, Truck, ArrowRight, Zap, Flame, Box, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BillUploadReview from '../components/BillUploadReview';

export default function Screen05Transport() {
  const { appData, tempId, setAppData, updateBusiness, navigateTo, goBack } = useApp();
  const transport = appData.transport || {
    distance_km: '',
    vehicle_type: '',
    period: '',
    sourceType: 'Estimated',
    logUploaded: false,
    logFileName: null
  };

  const vehicleTypes = [
    'Light Commercial Vehicle',
    'Diesel Truck (Heavy)',
    'Electric Fleet Van'
  ];

  const updateTransport = (fields) => {
    setAppData(prev => ({
      ...prev,
      transport: { ...transport, ...fields }
    }));
  };

  const handleBillConfirmed = ({ records, fileName, draft }) => {
    const record = records[0];
    updateTransport({
      distance_km: record.quantity,
      vehicle_type: draft.category_data?.vehicle_type?.value || transport.vehicle_type,
      period: record.period,
      sourceType: 'Actual (from confirmed bill)',
      logUploaded: true,
      logFileName: fileName
    });
  };

  const handleNext = (e) => {
    e?.preventDefault();
    navigateTo(6); // Materials
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
        <span className="step-counter">Transport Domain</span>
      </div>

      <div className="wizard-header">
        <h1 className="wizard-title">Transport & Logistics</h1>
        <p className="wizard-subtitle">
          Enter delivery fleet kilometres or freight logs.
        </p>
      </div>

      {/* Category Domain Selector Bar */}
      <div className="activity-category-row">
        {[
          { id: 'elec', label: 'Electricity', icon: Zap, screen: 4 },
          { id: 'fuel', label: 'Fuel', icon: Flame, screen: 5 },
          { id: 'trans', label: 'Transport', icon: Truck, screen: 15, active: true },
          { id: 'mat', label: 'Materials', icon: Box, screen: 6 },
          { id: 'waste', label: 'Waste', icon: Trash2, screen: 16 }
        ].map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              className={`activity-cat-pill ${c.active ? 'active' : ''}`}
              onClick={() => navigateTo(c.screen)}
            >
              <div className="cat-icon-circle">
                <Icon size={16} />
              </div>
              <span className="cat-text">{c.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleNext} className="wizard-form-body">
        <div className="input-card-section">
          <h2 className="card-section-title">Fleet & Delivery Logistics</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="trans-type">Primary vehicle type</label>
            <select
              id="trans-type"
              className="form-select"
              value={transport.vehicle_type || ''}
              onChange={(e) => updateTransport({ vehicle_type: e.target.value })}
              required
            >
              <option value="" disabled>Select vehicle type</option>
              {vehicleTypes.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="trans-km">Distance travelled</label>
            <div className="input-group-unit">
              <input
                id="trans-km"
                type="number"
                className="form-input unit-input"
                value={transport.distance_km ?? ''}
                onChange={(e) => updateTransport({ distance_km: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Enter total distance travelled"
                required
              />
              <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>km</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="trans-period">Period</label>
            <select
              id="trans-period"
              className="form-select"
              value={transport.period || ''}
              onChange={(e) => updateTransport({ period: e.target.value })}
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
                name="trans-source"
                value="Actual (from logbook)"
                checked={transport.sourceType === 'Actual (from logbook)'}
                onChange={(e) => updateTransport({ sourceType: e.target.value })}
              />
              <span className="radio-text">Actual (from logbook)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="trans-source"
                value="Estimated"
                checked={transport.sourceType === 'Estimated'}
                onChange={(e) => updateTransport({ sourceType: e.target.value })}
              />
              <span className="radio-text">Estimated</span>
            </label>
          </div>

          <BillUploadReview
            category="Transport"
            tempId={tempId}
            appData={appData}
            onBusinessSuggestion={(name) => {
              if (!appData.business.name?.trim()) updateBusiness({ name });
            }}
            onConfirmed={handleBillConfirmed}
          />
        </div>

        <div className="wizard-footer-nav">
          <button
            type="button"
            className="btn-wizard-back"
            onClick={() => navigateTo(0)} // Back to domain chooser
          >
            Domains
          </button>
          <button
            type="submit"
            id="btn-transport-next"
            className="btn-wizard-next"
          >
            <span>Next (Materials)</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
