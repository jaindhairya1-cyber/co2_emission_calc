import React from 'react';
import { ChevronLeft, Calendar, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Screen03Business() {
  const { appData, updateBusiness, navigateTo, goBack } = useApp();
  const business = appData.business;

  const industries = [
    'Textiles',
    'Manufacturing',
    'Auto Ancillary & Components',
    'Metal Fabrication',
    'Chemicals & Dyes',
    'Food & Beverage Processing',
    'Plastics & Rubber',
    'Pharmaceuticals',
    'Packaging & Paper',
    'Logistics & Warehousing'
  ];

  const reportingPeriods = [
    'FY 2025-26',
    'FY 2024-25',
    'FY 2023-24',
    'CY 2025',
    'CY 2024'
  ];

  const handleNext = (e) => {
    e?.preventDefault();
    navigateTo(0); // Screen 0: Ask User First for Domain (Electricity, Fuel, Transport, Materials, Waste)
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
        <span className="step-counter">1 of 5</span>
      </div>

      <div className="wizard-header">
        <h1 className="wizard-title">Tell us about your business</h1>
        <p className="wizard-subtitle">
          This helps us give relevant insights and recommendations.
        </p>
      </div>

      <form onSubmit={handleNext} className="wizard-form-body">
        <div className="form-group">
          <label className="form-label" htmlFor="biz-name">Business name</label>
          <input
            id="biz-name"
            type="text"
            className="form-input"
            value={business.name || ''}
            onChange={(e) => updateBusiness({ name: e.target.value })}
            placeholder="Enter your enterprise or company name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="biz-industry">Industry sector</label>
          <div className="select-wrapper">
            <select
              id="biz-industry"
              className="form-select"
              value={business.industry || ''}
              onChange={(e) => updateBusiness({ industry: e.target.value })}
              required
            >
              <option value="" disabled>Select industry sector</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="biz-city">Location / City</label>
          <input
            id="biz-city"
            type="text"
            className="form-input"
            value={business.city || ''}
            onChange={(e) => updateBusiness({ city: e.target.value })}
            placeholder="Enter city & state (e.g. Ahmedabad, Gujarat)"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="biz-employees">Number of employees</label>
          <input
            id="biz-employees"
            type="number"
            className="form-input"
            value={business.employees || ''}
            onChange={(e) => updateBusiness({ employees: e.target.value })}
            placeholder="Enter total workforce / staff count"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="biz-period">Reporting period</label>
          <div className="input-with-icon">
            <select
              id="biz-period"
              className="form-select"
              value={business.reportingPeriod || ''}
              onChange={(e) => updateBusiness({ reportingPeriod: e.target.value })}
              required
            >
              <option value="" disabled>Select reporting period</option>
              {reportingPeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Calendar size={18} className="trailing-icon" />
          </div>
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
            id="btn-biz-next"
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
