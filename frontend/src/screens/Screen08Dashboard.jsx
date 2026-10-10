import React, { useState } from 'react';
import { Bell, ArrowDownRight, FileEdit, Award, ChevronRight, Sparkles, FileText, Download, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';
import SmartBillModal from '../components/SmartBillModal';

export default function Screen08Dashboard() {
  const { appData, footprint, navigateTo, goBack, tempId, whatIfResult } = useApp();
  const business = appData.business;
  const [showBillModal, setShowBillModal] = useState(false);

  return (
    <div className="screen-container app-screen with-bottom-nav">
      {/* Clean App Header Bar */}
      <div className="app-header-bar">
        <div className="app-logo-area">
          <button
            type="button"
            className="wizard-back-btn"
            onClick={goBack}
            aria-label="Back"
            title="Go back"
            style={{ marginRight: '6px' }}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="header-leaf-icon">
            <img src="/logo.png" alt="TerraAI Logo" className="header-logo-img" />
          </div>
          <span className="app-header-brand">TerraAI</span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-icon-header"
            onClick={() => navigateTo(12)}
            aria-label="Reports and Certificates"
            title="Download Reports & Certificates"
            id="header-reports-btn"
          >
            <FileText size={18} />
          </button>
          <button
            type="button"
            className="btn-icon-header"
            onClick={() => alert(`Active Session: ${tempId}\nVerified Carbon Audit for ${business.name || 'Your Business'}`)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="unread-dot"></span>
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* User Greeting matching Photo */}
        <div className="greeting-block">
          <p className="greeting-label">Good morning,</p>
          <h1 className="greeting-company">{business.name || 'ABC Textiles'}</h1>
          <p className="greeting-location">{business.city || 'Indore, Madhya Pradesh'}</p>
        </div>

        {/* Total Carbon Footprint Card matching Photo */}
        <div className="carbon-hero-card">
          <div className="carbon-hero-top">
            <span className="carbon-hero-title">Total carbon footprint</span>
            <div className="reduction-pill">
              <ArrowDownRight size={14} className="icon-reduction" />
              <span>{footprint.reductionBadge ? footprint.reductionBadge.replace('-', '').trim() : '8.4%'}</span>
            </div>
          </div>

          <div className="carbon-value-row">
            <span className="carbon-main-number">{footprint.total.toFixed(1)}</span>
            <span className="carbon-unit-text">tCO₂e</span>
            <span className="carbon-comparison-text">vs previous period</span>
          </div>

          <div className="scopes-breakdown-grid">
            <div className="scope-box">
              <div className="scope-val">{footprint.scope1.toFixed(1)}</div>
              <div className="scope-lbl">Scope 1</div>
            </div>
            <div className="scope-box">
              <div className="scope-val">{footprint.scope2.toFixed(1)}</div>
              <div className="scope-lbl">Scope 2</div>
            </div>
            <div className="scope-box">
              <div className="scope-val">{footprint.scope3.toFixed(1)}</div>
              <div className="scope-lbl">Scope 3</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section matching Photo */}
        <div className="quick-actions-section">
          <h2 className="section-heading">Quick actions</h2>

          <div className="quick-actions-grid">
            <button
              type="button"
              id="action-update-data"
              className="quick-action-card"
              onClick={() => navigateTo(0)} // Asks user for domain first!
            >
              <div className="quick-action-icon-circle icon-bg-mint">
                <FileEdit size={20} className="text-forest" />
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">Update data</div>
                <div className="quick-action-sub">Edit your inputs</div>
              </div>
            </button>

            <button
              type="button"
              id="action-view-actions"
              className="quick-action-card"
              onClick={() => navigateTo(10)} // Reduction Actions
            >
              <div className="quick-action-icon-circle icon-bg-lightgreen">
                <Award size={20} className="text-emerald" />
              </div>
              <div className="quick-action-text">
                <div className="quick-action-title">View actions</div>
                <div className="quick-action-sub">See recommendations</div>
              </div>
            </button>
          </div>
        </div>

        {/* Smart Bill Auto-Classifier Banner */}
        <div
          className="smart-bill-teaser-card"
          onClick={() => setShowBillModal(true)}
        >
          <div className="smart-bill-teaser-left">
            <div className="smart-bill-tag">
              <Sparkles size={12} />
              <span>SMART BILL ANALYZER</span>
            </div>
            <div className="smart-bill-title">Auto-Classify Any Bill or Consumption</div>
            <div className="smart-bill-sub">
              Upload any bill — we identify the domain and compute statutory emissions
            </div>
          </div>
          <ChevronRight size={18} className="text-emerald" />
        </div>

        {/* What-If / ROI Simulation Banner matching Photo */}
        <div
          className="roi-highlight-banner"
          onClick={() => navigateTo(11)}
        >
          <div className="roi-banner-left">
            <div className="roi-tag">SIMULATION</div>
            <div className="roi-title">Explore What-If ROI Scenarios</div>
            <div className="roi-sub">
              Target: <strong>{whatIfResult.newTotal.toFixed(1)} tCO₂e</strong> • Save <strong>₹{whatIfResult.annualSaving.toLocaleString()}/yr</strong>
            </div>
          </div>
          <ChevronRight size={20} className="text-emerald" />
        </div>
      </div>

      <SmartBillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
      />

      <BottomNavBar activeTab="home" />
    </div>
  );
}
