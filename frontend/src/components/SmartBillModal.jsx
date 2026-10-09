import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BillUploadReview from './BillUploadReview';

export default function SmartBillModal({ isOpen, onClose }) {
  const {
    appData,
    tempId,
    updateBusiness,
    updateElectricity,
    updateFuels,
    updateMaterials,
    updateWaste,
    setAppData
  } = useApp();
  const [category, setCategory] = useState('');

  if (!isOpen) return null;

  const handleConfirmed = ({ category: confirmedCategory, records, fileName, draft }) => {
    const common = {
      period: records[0]?.period,
      sourceType: 'Actual (from confirmed bill)',
      billFileName: fileName
    };
    if (confirmedCategory === 'Electricity') {
      updateElectricity({
        amount: records[0].quantity,
        unit: records[0].unit,
        ...common,
        billUploaded: true,
        billDetails: draft.common_fields
      });
      return;
    }
    if (confirmedCategory === 'Transport') {
      setAppData((previous) => ({
        ...previous,
        transport: {
          ...previous.transport,
          distance_km: records[0].quantity,
          vehicle_type: draft.category_data?.vehicle_type?.value || previous.transport?.vehicle_type,
          ...common,
          logUploaded: true,
          logFileName: fileName
        }
      }));
      return;
    }

    const key = confirmedCategory === 'Fuel' ? 'fuels' : confirmedCategory === 'Materials' ? 'materials' : 'waste';
    const update = confirmedCategory === 'Fuel' ? updateFuels : confirmedCategory === 'Materials' ? updateMaterials : updateWaste;
    const current = appData[key] || [];
    const next = [...current];
    records.forEach((record, index) => {
      const value = {
        id: index === 0 ? (next[0]?.id || `${key}-${Date.now()}`) : `${key}-${Date.now()}-${index}`,
        type: record.type,
        quantity: record.quantity,
        unit: record.unit,
        ...common
      };
      if (index === 0) next[0] = { ...next[0], ...value };
      else next.push(value);
    });
    update(next);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet smart-bill-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-header">
          <div className="flex items-center gap-2">
            <div className="smart-bill-icon-wrap">
              <Sparkles size={16} className="text-emerald" />
            </div>
            <div>
              <h2 className="modal-sheet-title">Smart Bill & Consumption Analyzer</h2>
              <span className="modal-sheet-sub">Extract bill details, review them, and confirm before saving</span>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="smart-bill-body">
          <label className="form-group">
            <span className="form-label">Document category</span>
            <select className="form-select" value={category || ''} onChange={(event) => setCategory(event.target.value)} required>
              <option value="" disabled>Select document category</option>
              <option value="Electricity">Electricity</option>
              <option value="Fuel">Fuel</option>
              <option value="Transport">Transport</option>
              <option value="Materials">Materials</option>
              <option value="Waste">Waste</option>
            </select>
          </label>
          <BillUploadReview
            category={category}
            tempId={tempId}
            appData={appData}
            onConfirmed={handleConfirmed}
            onBusinessSuggestion={(name) => {
              if (!appData.business?.name?.trim()) updateBusiness({ name });
            }}
          />
        </div>
      </div>
    </div>
  );
}
