import React from 'react';
import { Wifi, Battery } from 'lucide-react';

export default function StatusBar({ dark = true }) {
  return (
    <div className={`status-bar ${dark ? 'status-dark' : 'status-light'}`}>
      <span className="status-time">9:41</span>
      <div className="status-dynamic-island"></div>
      <div className="status-icons">
        <svg className="signal-icon" width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <rect x="0" y="8" width="2.5" height="4" rx="0.8" />
          <rect x="4.5" y="5" width="2.5" height="7" rx="0.8" />
          <rect x="9" y="2.5" width="2.5" height="9.5" rx="0.8" />
          <rect x="13.5" y="0" width="2.5" height="12" rx="0.8" />
        </svg>
        <Wifi size={14} strokeWidth={2.5} />
        <div className="battery-badge">
          <div className="battery-fill"></div>
        </div>
      </div>
    </div>
  );
}
