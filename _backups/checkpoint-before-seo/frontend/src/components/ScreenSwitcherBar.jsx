import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, Monitor, Copy, Check, RefreshCw, Sparkles, Layers } from 'lucide-react';

export default function ScreenSwitcherBar() {
  const {
    screens,
    currentScreen,
    navigateTo,
    deviceMode,
    setDeviceMode,
    tempId,
    createNewTempId,
    resetToBenchmark
  } = useApp();

  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(tempId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewId = () => {
    const newId = createNewTempId();
    alert(`Generated New Temporary ID: ${newId}\nYour sessions and inputs are saved under this ID.`);
  };

  return (
    <header className="screen-switcher-bar">
      <div className="switcher-left">
        <div className="brand-badge">
          <div className="brand-dot"></div>
          <span className="brand-name">TerraAI</span>
          <span className="brand-ver">v1.0.0</span>
        </div>

        <div className="screen-selector-container">
          <Layers size={15} className="switcher-icon" />
          <label htmlFor="screen-select" className="sr-only">Select Screen</label>
          <select
            id="screen-select"
            className="screen-select-dropdown"
            value={currentScreen}
            onChange={(e) => navigateTo(Number(e.target.value))}
          >
            {screens.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.group})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="switcher-center">
        <div className="temp-id-pill" title="Temporary Session ID - Zero signup needed">
          <span className="temp-label">Temporary ID:</span>
          <span className="temp-value">{tempId}</span>
          <button
            onClick={handleCopyId}
            className="icon-btn-micro"
            title="Copy Temporary ID"
            aria-label="Copy Temporary ID"
          >
            {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
          </button>
          <button
            onClick={handleNewId}
            className="icon-btn-micro"
            title="Generate new temporary ID"
            aria-label="Generate new temporary ID"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="switcher-right">
        <button
          onClick={resetToBenchmark}
          className="btn-toolbar-subtle"
          title="Reset inputs to ABC Textiles benchmark from the design"
        >
          <Sparkles size={14} />
          <span>Reset Benchmark</span>
        </button>

        <div className="view-toggle-group">
          <button
            className={`view-toggle-btn ${deviceMode === 'phone' ? 'active' : ''}`}
            onClick={() => setDeviceMode('phone')}
            title="Mobile Phone Frame View (as designed in the mockups)"
          >
            <Smartphone size={15} />
            <span>Mobile</span>
          </button>
          <button
            className={`view-toggle-btn ${deviceMode === 'fullscreen' ? 'active' : ''}`}
            onClick={() => setDeviceMode('fullscreen')}
            title="Full Width Web View"
          >
            <Monitor size={15} />
            <span>Full View</span>
          </button>
        </div>
      </div>
    </header>
  );
}
