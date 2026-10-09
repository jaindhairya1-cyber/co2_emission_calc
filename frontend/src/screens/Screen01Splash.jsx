import React from 'react';
import { ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Screen01Splash() {
  const { navigateTo, tempId } = useApp();

  return (
    <div className="screen-container splash-screen">
      <div className="splash-overlay-tint"></div>

      <div className="splash-content-layer">
        <div className="splash-header">
          <div className="brand-logo-hero">
            <div className="leaf-icon-container">
              <img src="/logo.png" alt="TerraAI Logo" className="brand-logo-img" />
            </div>
            <h1 className="splash-title">TerraAI</h1>
            <p className="splash-subtitle">Carbon Intelligence for MSMEs</p>
          </div>
        </div>

        <div className="splash-hero-center-badge">
          <span className="splash-pill-glass">
            <Sparkles size={14} className="text-emerald" />
            Smart Energy & Emissions Accounting
          </span>
        </div>

        <div className="splash-actions-area">
          <button
            id="btn-splash-get-started"
            className="btn-primary-pill btn-splash-action"
            onClick={() => navigateTo(2)}
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>

          <div className="splash-temp-id-box">
            <div className="temp-id-badge-row">
              <Zap size={14} className="text-emerald" />
              <span className="temp-text">Temporary ID ready: <strong>{tempId}</strong></span>
            </div>
            <button
              id="btn-instant-temp-access"
              className="btn-text-link"
              onClick={() => navigateTo(3)}
            >
              Quick start directly with Temporary ID →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
