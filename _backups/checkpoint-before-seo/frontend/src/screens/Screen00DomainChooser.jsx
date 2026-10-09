import React from 'react';
import { Zap, Flame, Truck, Box, Trash2, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Screen00DomainChooser({ onSelectDomain, showBack = true }) {
  const { navigateTo, goBack, appData, footprint } = useApp();

  const domains = [
    {
      id: 'electricity',
      name: 'Electricity',
      scope: 'Scope 2 (Indirect)',
      icon: Zap,
      screen: 4,
      desc: 'Grid power consumption, captive solar & green tariffs',
      currentValue: appData.electricity?.amount ? `${Number(appData.electricity.amount).toLocaleString()} ${appData.electricity?.unit || 'kWh'}/mo` : 'Not entered yet',
      status: appData.electricity?.amount ? 'Entered' : 'Pending',
      color: '#0284C7',
      bg: '#E0F2FE'
    },
    {
      id: 'fuel',
      name: 'Fuel',
      scope: 'Scope 1 (Direct)',
      icon: Flame,
      screen: 5,
      desc: 'Diesel generator sets, boiler fuels, petrol, LPG & PNG',
      currentValue: (appData.fuels?.[0]?.quantity && String(appData.fuels[0].quantity).trim() !== '')
        ? `${Number(appData.fuels[0].quantity).toLocaleString()} ${appData.fuels[0].unit || 'Litres'} ${appData.fuels[0].type || ''}/mo`
        : 'Not entered yet',
      status: (appData.fuels?.[0]?.quantity && String(appData.fuels[0].quantity).trim() !== '') ? 'Entered' : 'Pending',
      color: '#F43F5E',
      bg: '#FFE4E6'
    },
    {
      id: 'transport',
      name: 'Transport & Fleet',
      scope: 'Scope 3 (Freight / Logistics)',
      icon: Truck,
      screen: 15, // Dedicated Transport screen
      desc: 'Commercial delivery vehicles, freight kilometres & dispatches',
      currentValue: (appData.transport?.distance_km && String(appData.transport.distance_km).trim() !== '')
        ? `${Number(appData.transport.distance_km).toLocaleString()} km/mo (${appData.transport.vehicle_type || 'LCV'})`
        : 'Not entered yet',
      status: (appData.transport?.distance_km && String(appData.transport.distance_km).trim() !== '') ? 'Entered' : 'Pending',
      color: '#3B82F6',
      bg: '#DBEAFE'
    },
    {
      id: 'materials',
      name: 'Raw Materials',
      scope: 'Scope 3 (Embodied Carbon)',
      icon: Box,
      screen: 6,
      desc: 'Purchased virgin steel, cotton yarn, polymers & chemicals',
      currentValue: (appData.materials?.[0]?.quantity && String(appData.materials[0].quantity).trim() !== '')
        ? `${Number(appData.materials[0].quantity).toLocaleString()} kg ${appData.materials[0].type || ''}/mo`
        : 'Not entered yet',
      status: (appData.materials?.[0]?.quantity && String(appData.materials[0].quantity).trim() !== '') ? 'Entered' : 'Pending',
      color: '#F59E0B',
      bg: '#FEF3C7'
    },
    {
      id: 'waste',
      name: 'Waste Generation',
      scope: 'Scope 3 (End of Life)',
      icon: Trash2,
      screen: 16, // Dedicated Waste screen
      desc: 'Factory scrap, municipal landfill waste & hazardous disposal',
      currentValue: (appData.waste?.[0]?.quantity && String(appData.waste[0].quantity).trim() !== '')
        ? `${Number(appData.waste[0].quantity).toLocaleString()} kg ${appData.waste[0].type || ''}/mo`
        : 'Not entered yet',
      status: (appData.waste?.[0]?.quantity && String(appData.waste[0].quantity).trim() !== '') ? 'Entered' : 'Pending',
      color: '#10B981',
      bg: '#DCFCE7'
    }
  ];

  const handleDomainClick = (screenId) => {
    if (onSelectDomain) {
      onSelectDomain(screenId);
    } else {
      navigateTo(screenId);
    }
  };

  return (
    <div className="screen-container form-wizard-screen">
      <div className="wizard-top-nav">
        {showBack && (
          <button
            type="button"
            className="wizard-back-btn"
            onClick={goBack}
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <span className="step-counter">Domain Selector</span>
      </div>

      <div className="wizard-header">
        <h1 className="wizard-title">Select Operational Domain</h1>
        <p className="wizard-subtitle">
          Choose which domain you want to enter activity data for or calculate emissions:
        </p>
      </div>

      <div className="domain-selection-cards-list">
        {domains.map((dom) => {
          const Icon = dom.icon;
          return (
            <button
              key={dom.id}
              type="button"
              className="domain-choice-card"
              onClick={() => handleDomainClick(dom.screen)}
            >
              <div className="domain-choice-icon-wrap" style={{ backgroundColor: dom.bg, color: dom.color }}>
                <Icon size={22} />
              </div>
              <div className="domain-choice-info">
                <div className="domain-choice-header">
                  <span className="domain-choice-name">{dom.name}</span>
                  <span className="domain-choice-scope">{dom.scope}</span>
                </div>
                <p className="domain-choice-desc">{dom.desc}</p>
                <div className="domain-choice-meta">
                  <span className="domain-meta-current">Current: <strong>{dom.currentValue}</strong></span>
                  <span className="domain-status-pill">{dom.status}</span>
                </div>
              </div>
              <ArrowRight size={18} className="domain-choice-arrow" />
            </button>
          );
        })}
      </div>

      <div className="domain-chooser-footer">
        <button
          type="button"
          className="btn-primary-pill"
          onClick={() => navigateTo(7)} // Jump to Review & Calculate
        >
          <span>Proceed to Review & Calculate</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
