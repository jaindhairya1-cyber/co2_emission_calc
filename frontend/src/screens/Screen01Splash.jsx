import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Screen01Splash() {
  const { navigateTo } = useApp();

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
        </div>
      </div>
    </div>
  );
}
