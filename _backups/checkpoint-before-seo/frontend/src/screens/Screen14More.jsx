import React, { useState } from 'react';
import { BookOpen, Settings, Shield, FileText, Mail, ChevronRight, ExternalLink, X, Info, Check, RefreshCw, Globe, Sliders, Cookie } from 'lucide-react';
import { ELECTRICITY_FACTORS, FUEL_FACTORS, TRANSPORT_FACTORS, MATERIAL_FACTORS, WASTE_FACTORS } from '../data/emissionFactors';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';

export default function Screen14More() {
  const { tempId, createNewTempId } = useApp();
  const [showFactorsModal, setShowFactorsModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('electricity');
  
  // Real modal states (replacing alert dialogs)
  const [activeDialog, setActiveDialog] = useState(null); // 'settings' | 'privacy' | 'terms' | 'contact' | null
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText('contact@terracarbon.in');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="screen-container app-screen with-bottom-nav">
      <div className="app-header-bar">
        <h1 className="results-title">More</h1>
      </div>

      <div className="profile-scroll-content">
        {/* Menu items */}
        <div className="menu-group-card">
          <button
            type="button"
            className="menu-row-item"
            onClick={() => setShowFactorsModal(true)}
          >
            <div className="menu-item-left">
              <BookOpen size={18} className="menu-item-icon" />
              <span className="menu-item-label">Emission factors</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>

          <button
            type="button"
            className="menu-row-item"
            onClick={() => setActiveDialog('settings')}
          >
            <div className="menu-item-left">
              <Settings size={18} className="menu-item-icon" />
              <span className="menu-item-label">Settings & Defaults</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>
        </div>

        {/* Section Legal */}
        <div className="profile-section-heading">Legal & Support</div>
        <div className="menu-group-card">
          <button
            type="button"
            className="menu-row-item"
            onClick={() => setActiveDialog('privacy')}
          >
            <div className="menu-item-left">
              <Shield size={18} className="menu-item-icon" />
              <span className="menu-item-label">Privacy Policy</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>

          <button
            type="button"
            className="menu-row-item"
            onClick={() => setActiveDialog('terms')}
          >
            <div className="menu-item-left">
              <FileText size={18} className="menu-item-icon" />
              <span className="menu-item-label">Terms & Conditions</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>

          <button
            type="button"
            className="menu-row-item"
            onClick={() => setActiveDialog('cookies')}
          >
            <div className="menu-item-left">
              <Cookie size={18} className="menu-item-icon" />
              <span className="menu-item-label">Cookie & Local Storage Policy</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>

          <button
            type="button"
            className="menu-row-item"
            onClick={() => setActiveDialog('contact')}
          >
            <div className="menu-item-left">
              <Mail size={18} className="menu-item-icon" />
              <span className="menu-item-label">Contact & Support</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>
        </div>

        {/* App information */}
        <div className="profile-section-heading">App information</div>
        <div className="app-info-card">
          <div className="app-info-row">
            <span className="app-info-title">TerraAI v1.2.0</span>
            <span className="text-xs text-muted">Statutory MSME Edition</span>
          </div>
          <div className="app-info-row">
            <a
              href="https://terracarbon.in"
              target="_blank"
              rel="noreferrer"
              className="app-info-link"
            >
              <span>https://terracarbon.in</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {activeDialog === 'settings' && (
        <div className="modal-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-forest" />
                <h2 className="modal-sheet-title">App Settings & Standards</h2>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setActiveDialog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet-body">
              <div className="form-group mb-3">
                <label className="form-label">Regional Electricity Standard</label>
                <input className="form-input" disabled value="CEA India Grid Baseline v21.0 (0.710 kg CO₂e/kWh)" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Accounting Unit Metric</label>
                <input className="form-input" disabled value="Metric Tonnes CO₂ Equivalent (tCO₂e)" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Financial Currency Standard</label>
                <input className="form-input" disabled value="Indian Rupee (INR ₹)" />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Active Audit Token</label>
                <input className="form-input font-mono" disabled value={tempId} />
              </div>
              <button
                type="button"
                className="btn-upload-outline w-full mb-2"
                onClick={() => {
                  createNewTempId();
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 2500);
                }}
              >
                <RefreshCw size={15} />
                <span>Generate New Audit Session ID</span>
              </button>
              {settingsSaved && (
                <p className="text-xs text-emerald mt-1 text-center">New session token active and synced!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeDialog === 'privacy' && (
        <div className="modal-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-forest" />
                <h2 className="modal-sheet-title">Privacy Policy</h2>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setActiveDialog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet-body text-sm space-y-3 leading-relaxed">
              <p><strong>1. Data Ownership:</strong> All corporate consumption figures, uploaded invoices, and carbon ledgers remain the sole property of your MSME enterprise.</p>
              <p><strong>2. Local Persistence:</strong> In guest mode, your operational activity logs are encrypted in your device's browser memory under your session token.</p>
              <p><strong>3. Zero Telemetry Sharing:</strong> TerraAI never sells, monetizes, or shares proprietary factory data with third parties or advertisement networks.</p>
              <p><strong>4. Cloud Security:</strong> When connected to Supabase Cloud, PostgreSQL Row Level Security (RLS) ensures only authorized company credentials can query your ledger.</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {activeDialog === 'terms' && (
        <div className="modal-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-forest" />
                <h2 className="modal-sheet-title">Terms & Conditions</h2>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setActiveDialog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet-body text-sm space-y-3 leading-relaxed">
              <p><strong>1. Methodology Standards:</strong> All statutory calculations are benchmarked according to the Central Electricity Authority (CEA) India CO₂ Baseline Database and GHG Protocol Corporate Standards.</p>
              <p><strong>2. Advisory Nature:</strong> Decarbonization ROI estimates and payback periods are indicative projections intended for operational planning and BRSR MSME reporting.</p>
              <p><strong>3. Document Verification:</strong> Users are responsible for ensuring billing receipts uploaded for OCR reflect accurate meter readings and fiscal periods.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Policy Modal */}
      {activeDialog === 'cookies' && (
        <div className="modal-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <div className="flex items-center gap-2">
                <Cookie size={18} className="text-forest" />
                <h2 className="modal-sheet-title">Cookie & Local Storage Policy</h2>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setActiveDialog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet-body text-sm space-y-3 leading-relaxed">
              <p><strong>1. Essential Local Storage:</strong> TerraAI uses browser <code>localStorage</code> solely to save your active emission calculations, Temporary MSME ID, and verified bill records on your local device.</p>
              <p><strong>2. No Third-Party Tracking Cookies:</strong> We do not deploy cross-site tracking cookies or marketing pixels.</p>
              <p><strong>3. Session Continuity:</strong> Temporary session IDs allow frictionless calculation without mandatory sign-up, ensuring continuous offline resilience.</p>
              <p><strong>4. Clearing Data:</strong> You can purge all locally saved carbon ledgers anytime from the Settings menu by resetting your browser storage.</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {activeDialog === 'contact' && (
        <div className="modal-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-forest" />
                <h2 className="modal-sheet-title">Contact & Support</h2>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setActiveDialog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-sheet-body text-sm space-y-3">
              <p>Have questions about BRSR MSME compliance or statutory emission factor methodology?</p>
              <div className="menu-group-card p-3">
                <div className="text-xs text-muted mb-1">Official Support Email</div>
                <div className="font-semibold text-forest">contact@terracarbon.in</div>
              </div>
              <div className="menu-group-card p-3">
                <div className="text-xs text-muted mb-1">Support Hours</div>
                <div className="text-sm">Monday – Friday: 09:00 – 18:00 IST</div>
              </div>
              <button
                type="button"
                className="btn-wizard-next w-full flex items-center justify-center gap-2"
                onClick={handleCopyEmail}
              >
                {copiedEmail ? <Check size={16} /> : <Mail size={16} />}
                <span>{copiedEmail ? 'Email Copied!' : 'Copy Support Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emission Factors Interactive Modal */}
      {showFactorsModal && (
        <div className="modal-backdrop" onClick={() => setShowFactorsModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-header">
              <h2 className="modal-sheet-title">Official Emission Factors</h2>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowFactorsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-tab-bar">
              <button
                type="button"
                className={`modal-tab ${activeModalTab === 'electricity' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('electricity')}
              >
                Electricity
              </button>
              <button
                type="button"
                className={`modal-tab ${activeModalTab === 'fuels' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('fuels')}
              >
                Fuels
              </button>
              <button
                type="button"
                className={`modal-tab ${activeModalTab === 'transport' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('transport')}
              >
                Transport
              </button>
              <button
                type="button"
                className={`modal-tab ${activeModalTab === 'materials' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('materials')}
              >
                Materials
              </button>
              <button
                type="button"
                className={`modal-tab ${activeModalTab === 'waste' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('waste')}
              >
                Waste
              </button>
            </div>

            <div className="modal-sheet-body">
              {activeModalTab === 'electricity' && (
                <div className="factors-table-wrap">
                  <div className="factor-item-card">
                    <div className="factor-card-title">{ELECTRICITY_FACTORS.indiaGrid.name}</div>
                    <div className="factor-card-badge">{ELECTRICITY_FACTORS.indiaGrid.factor} {ELECTRICITY_FACTORS.indiaGrid.unit}</div>
                    <div className="factor-card-meta">Scope 2 | Standard: {ELECTRICITY_FACTORS.indiaGrid.source}</div>
                  </div>
                  <div className="factor-item-card">
                    <div className="factor-card-title">{ELECTRICITY_FACTORS.renewable.name}</div>
                    <div className="factor-card-badge">{ELECTRICITY_FACTORS.renewable.factor} {ELECTRICITY_FACTORS.renewable.unit}</div>
                    <div className="factor-card-meta">Scope 2 | Standard: {ELECTRICITY_FACTORS.renewable.source}</div>
                  </div>
                </div>
              )}

              {activeModalTab === 'fuels' && (
                <div className="factors-table-wrap">
                  {Object.entries(FUEL_FACTORS).map(([key, val]) => (
                    <div key={key} className="factor-item-card">
                      <div className="factor-card-title">{val.name}</div>
                      <div className="factor-card-badge">{val.factor} {val.unit}</div>
                      <div className="factor-card-meta">Scope {val.scope} | Avg rate: ₹{val.costPerUnit}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeModalTab === 'transport' && (
                <div className="factors-table-wrap">
                  {Object.entries(TRANSPORT_FACTORS).map(([key, val]) => (
                    <div key={key} className="factor-item-card">
                      <div className="factor-card-title">{val.name}</div>
                      <div className="factor-card-badge">{val.factor} {val.unit}</div>
                      <div className="factor-card-meta">Scope {val.scope} (Road Freight Logistics)</div>
                    </div>
                  ))}
                </div>
              )}

              {activeModalTab === 'materials' && (
                <div className="factors-table-wrap">
                  {Object.entries(MATERIAL_FACTORS).map(([key, val]) => (
                    <div key={key} className="factor-item-card">
                      <div className="factor-card-title">{val.name}</div>
                      <div className="factor-card-badge">{val.factor} {val.unit}</div>
                      <div className="factor-card-meta">Scope {val.scope} (Upstream Embodied Carbon)</div>
                    </div>
                  ))}
                </div>
              )}

              {activeModalTab === 'waste' && (
                <div className="factors-table-wrap">
                  {Object.entries(WASTE_FACTORS).map(([key, val]) => (
                    <div key={key} className="factor-item-card">
                      <div className="factor-card-title">{val.name}</div>
                      <div className="factor-card-badge">{val.factor} {val.unit}</div>
                      <div className="factor-card-meta">Scope {val.scope} (Downstream End-of-Life)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNavBar activeTab="more" />
    </div>
  );
}

