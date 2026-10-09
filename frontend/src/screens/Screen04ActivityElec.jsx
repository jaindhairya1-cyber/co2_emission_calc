import { ChevronLeft, Zap, Flame, Truck, Box, Trash2, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BillUploadReview from '../components/BillUploadReview';

export default function Screen04ActivityElec() {
  const { appData, tempId, updateElectricity, updateBusiness, navigateTo, goBack } = useApp();
  const elec = appData.electricity;

  const categories = [
    { id: 'elec', label: 'Electricity', icon: Zap, screen: 4, active: true },
    { id: 'fuel', label: 'Fuel', icon: Flame, screen: 5 },
    { id: 'transport', label: 'Transport', icon: Truck, screen: 5 },
    { id: 'materials', label: 'Materials', icon: Box, screen: 6 },
    { id: 'waste', label: 'Waste', icon: Trash2, screen: 6 }
  ];

  const handleBillConfirmed = ({ records, fileName, draft }) => {
    const record = records[0];
    updateElectricity({
      amount: record.quantity,
      unit: record.unit,
      period: record.period,
      billFileName: fileName,
      billUploaded: true,
      sourceType: 'Actual (from bills)',
      billDetails: draft.common_fields
    });
  };

  const handleNext = (e) => {
    e?.preventDefault();
    navigateTo(5); // Screen 5: More Inputs (Fuel)
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

      <div className="wizard-header">
        <h1 className="wizard-title">Add your activity data</h1>
        <p className="wizard-subtitle">
          Enter details manually or upload your bills.
        </p>
      </div>

      {/* Category Icons Row */}
      <div className="activity-category-row">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              className={`activity-cat-pill ${cat.active ? 'active' : ''}`}
              onClick={() => navigateTo(cat.screen)}
            >
              <div className="cat-icon-circle">
                <Icon size={16} />
              </div>
              <span className="cat-text">{cat.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleNext} className="wizard-form-body">
        <div className="input-card-section">
          <h2 className="card-section-title">Electricity consumption</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="elec-amount">
              Total electricity used {elec.unit ? `(${elec.unit})` : ''}
            </label>
            <div className="input-group-unit">
              <input
                id="elec-amount"
                type="number"
                className="form-input unit-input"
                value={elec.amount ?? ''}
                onChange={(e) => updateElectricity({ amount: e.target.value })}
                placeholder="Enter total units consumed"
                required
              />
              <select
                id="elec-unit"
                className="unit-select"
                value={elec.unit || ''}
                onChange={(e) => updateElectricity({ unit: e.target.value })}
                required
              >
                <option value="" disabled>Select unit</option>
                <option value="kWh">kWh</option>
                <option value="MWh">MWh</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="elec-period">Period</label>
            <select
              id="elec-period"
              className="form-select"
              value={elec.period || ''}
              onChange={(e) => updateElectricity({ period: e.target.value })}
              required
            >
              <option value="" disabled>Select billing period</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>

          {/* Radio Options: Actual vs Estimated */}
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="elec-source"
                value="Actual (from bills)"
                checked={elec.sourceType === 'Actual (from bills)'}
                onChange={(e) => updateElectricity({ sourceType: e.target.value })}
              />
              <span className="custom-radio"></span>
              <span className="radio-text">Actual (from bills)</span>
            </label>

            <label className="radio-label">
              <input
                type="radio"
                name="elec-source"
                value="Estimated"
                checked={elec.sourceType === 'Estimated'}
                onChange={(e) => updateElectricity({ sourceType: e.target.value })}
              />
              <span className="custom-radio"></span>
              <span className="radio-text">Estimated</span>
            </label>
          </div>

          <BillUploadReview
            category="Electricity"
            tempId={tempId}
            appData={appData}
            onBusinessSuggestion={(name) => {
              if (!appData.business.name?.trim()) updateBusiness({ name });
            }}
            onConfirmed={handleBillConfirmed}
          />

          {elec.billUploaded && (
            <div className="upload-attached-pill">
              <Check size={14} className="text-emerald" />
              <span>Bill attached & verified via smart OCR</span>
            </div>
          )}
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
            id="btn-elec-next"
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
