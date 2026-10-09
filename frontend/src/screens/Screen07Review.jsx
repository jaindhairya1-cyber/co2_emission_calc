import React from 'react';
import { ChevronLeft, Edit2, Building2, Zap, Flame, Truck, Box, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Screen07Review() {
  const { appData, navigateTo, goBack } = useApp();
  const { business, electricity, fuels, materials, waste } = appData;

  const firstFuel = fuels[0] || { quantity: 500, unit: 'Litres', type: 'Diesel', sourceType: 'Actual (from bill)' };
  const firstMat = materials[0] || { quantity: 5000, unit: 'kg', type: 'Steel', sourceType: 'Actual (from invoice)' };
  const firstWaste = waste[0] || { quantity: 200, unit: 'kg', type: 'General waste', sourceType: 'Estimated' };

  const reviewItems = [
    {
      id: 'biz',
      title: 'Business details',
      icon: Building2,
      line1: `${business.name || 'ABC Textiles'}, ${business.city ? business.city.split(',')[0] : 'Indore'}`,
      line2: `${business.industry || 'Textiles'} - ${business.employees || 50} employees`,
      screen: 3
    },
    {
      id: 'elec',
      title: 'Electricity',
      icon: Zap,
      line1: `${Number(electricity.amount || 12000).toLocaleString()} ${electricity.unit || 'kWh'}/month`,
      line2: electricity.sourceType || 'Actual (from bill)',
      screen: 4
    },
    {
      id: 'fuel',
      title: 'Fuel',
      icon: Flame,
      line1: `${Number(firstFuel.quantity || 500).toLocaleString()} L ${firstFuel.type?.toLowerCase() || 'diesel'}/month`,
      line2: firstFuel.sourceType || 'Actual (from bill)',
      screen: 5
    },
    {
      id: 'transport',
      title: 'Transport',
      icon: Truck,
      line1: appData.transport?.distance_km ? `${appData.transport.distance_km.toLocaleString()} km/month` : 'Not added',
      line2: appData.transport?.vehicle_type ? `${appData.transport.vehicle_type} (${appData.transport.sourceType || 'Actual'})` : 'Calculated via Scope 3 standard',
      screen: 15
    },
    {
      id: 'materials',
      title: 'Materials',
      icon: Box,
      line1: `${Number(firstMat.quantity || 5000).toLocaleString()} kg ${firstMat.type?.toLowerCase() || 'steel'}/month`,
      line2: firstMat.sourceType || 'Actual (from invoice)',
      screen: 6
    },
    {
      id: 'waste',
      title: 'Waste',
      icon: Trash2,
      line1: `${Number(firstWaste.quantity || 200).toLocaleString()} kg/month`,
      line2: firstWaste.sourceType || 'Estimated',
      screen: 16
    }
  ];

  const handleCalculate = () => {
    navigateTo(8); // Screen 8: Home / Dashboard!
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
        <span className="step-counter">5 of 5</span>
      </div>

      <div className="wizard-header">
        <h1 className="wizard-title">Review your information</h1>
        <p className="wizard-subtitle">
          Check your details before calculating.
        </p>
      </div>

      <div className="review-cards-list">
        {reviewItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="review-card-item">
              <div className="review-card-left">
                <div className="review-icon-box">
                  <Icon size={17} />
                </div>
                <div className="review-card-text">
                  <div className="review-card-title">{item.title}</div>
                  <div className="review-card-main">{item.line1}</div>
                  <div className="review-card-sub">{item.line2}</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-review-edit"
                onClick={() => navigateTo(item.screen)}
                title={`Edit ${item.title}`}
                aria-label={`Edit ${item.title}`}
              >
                <Edit2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="wizard-footer-nav review-footer-nav">
        <button
          type="button"
          className="btn-wizard-back"
          onClick={goBack}
        >
          ← Back
        </button>
        <button
          type="button"
          id="btn-trigger-calculate"
          className="btn-wizard-next btn-calculate-action"
          onClick={handleCalculate}
        >
          <span>Calculate</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
