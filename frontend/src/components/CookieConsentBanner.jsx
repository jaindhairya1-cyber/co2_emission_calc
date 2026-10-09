import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, ShieldCheck } from 'lucide-react';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('terra_cookie_consent');
    if (!consent) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('terra_cookie_consent', 'accepted_v1');
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {showBanner && !showModal && (
        <div className="cookie-consent-bar">
          <div className="cookie-bar-content">
            <div className="cookie-icon-box">
              <Cookie size={16} className="text-emerald" />
            </div>
            <p className="cookie-bar-text">
              We use local storage strictly for carbon calculations & session persistence.
            </p>
          </div>
          <div className="cookie-bar-actions">
            <button
              type="button"
              className="cookie-link-btn"
              onClick={() => setShowModal(true)}
            >
              Policy
            </button>
            <button
              type="button"
              className="cookie-accept-btn"
              onClick={handleAccept}
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald" />
                <h2 className="modal-sheet-title">Cookie & Local Storage Policy</h2>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet-body text-sm space-y-3 leading-relaxed">
              <p>
                <strong>1. Functional Local Storage:</strong> TerraAI stores your emission inputs, uploaded document metadata, and Temporary Session ID locally in your browser so you never lose progress.
              </p>
              <p>
                <strong>2. Zero Tracking / Advertising:</strong> We do not track you across other websites, and we never sell enterprise consumption telemetry.
              </p>
              <p>
                <strong>3. Regulatory Compliance:</strong> Compliant with Digital Personal Data Protection (DPDP) guidelines and ISO 27001 data isolation standards.
              </p>
              <div className="mt-4 pt-2">
                <button
                  type="button"
                  className="btn-wizard-next w-full flex items-center justify-center gap-2"
                  onClick={handleAccept}
                >
                  <Check size={16} />
                  <span>Accept & Continue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
