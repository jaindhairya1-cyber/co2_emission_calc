import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import StatusBar from './components/StatusBar';
import ScreenSwitcherBar from './components/ScreenSwitcherBar';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/CookieConsentBanner';

import Screen01Splash from './screens/Screen01Splash';
import Screen02Auth from './screens/Screen02Auth';
import Screen03Business from './screens/Screen03Business';
import Screen00DomainChooser from './screens/Screen00DomainChooser';
import Screen04ActivityElec from './screens/Screen04ActivityElec';
import Screen05ActivityFuel from './screens/Screen05ActivityFuel';
import Screen05Transport from './screens/Screen05Transport';
import Screen06MaterialsWaste from './screens/Screen06MaterialsWaste';
import Screen06Waste from './screens/Screen06Waste';
import Screen07Review from './screens/Screen07Review';
import Screen08Dashboard from './screens/Screen08Dashboard';
import Screen09Results from './screens/Screen09Results';
import Screen10Actions from './screens/Screen10Actions';
import Screen11WhatIf from './screens/Screen11WhatIf';
import Screen12Reports from './screens/Screen12Reports';
import Screen13Profile from './screens/Screen13Profile';
import Screen14More from './screens/Screen14More';

function MainScreenContent() {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case 0:
      return <Screen00DomainChooser />;
    case 1:
      return <Screen01Splash />;
    case 2:
      return <Screen02Auth />;
    case 3:
      return <Screen03Business />;
    case 4:
      return <Screen04ActivityElec />;
    case 5:
      return <Screen05ActivityFuel />;
    case 15:
      return <Screen05Transport />;
    case 6:
      return <Screen06MaterialsWaste />;
    case 16:
      return <Screen06Waste />;
    case 7:
      return <Screen07Review />;
    case 8:
      return <Screen08Dashboard />;
    case 9:
      return <Screen09Results />;
    case 10:
      return <Screen10Actions />;
    case 11:
      return <Screen11WhatIf />;
    case 12:
      return <Screen12Reports />;
    case 13:
      return <Screen13Profile />;
    case 14:
      return <Screen14More />;
    default:
      return <Screen08Dashboard />;
  }
}

function AppContainer() {
  const { deviceMode, currentScreen, screens, navigateTo } = useApp();

  return (
    <div className="terra-workspace">
      {/* Top Switcher & Control Toolbar */}
      <ScreenSwitcherBar />

      {/* Main Preview Canvas */}
      <main className="terra-canvas-stage">
        {deviceMode === 'phone' ? (
          <div className="phone-device-wrapper">
            <div className="iphone-outer-chassis">
              <div className="iphone-screen">
                <StatusBar dark={currentScreen !== 1} />
                <div className="phone-scroll-body">
                  <ErrorBoundary>
                    <MainScreenContent />
                  </ErrorBoundary>
                  <CookieConsentBanner />
                </div>
                {/* Home Indicator bar */}
                <div className="iphone-home-indicator">
                  <div className="home-bar"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fullscreen-container">
            <div className="fullscreen-inner">
              <StatusBar dark={currentScreen !== 1} />
              <div className="fullscreen-content-body">
                <ErrorBoundary>
                  <MainScreenContent />
                </ErrorBoundary>
                <CookieConsentBanner />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fast Visual Screen Thumbnails Footer Strip */}
      <aside className="bottom-screen-flow-strip" aria-label="Screen Flow Navigation">
        <div className="flow-strip-header">
          <span className="flow-label">SCREEN FLOW PIPELINE:</span>
          <span className="flow-hint">Click any stage to instantly view & test</span>
        </div>
        <div className="flow-chips-carousel">
          {screens.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`flow-chip-btn ${currentScreen === s.id ? 'active' : ''}`}
              onClick={() => navigateTo(s.id)}
            >
              <span className="flow-chip-num">{s.id}</span>
              <span className="flow-chip-title">{s.name.replace(/^\d+\.\s*/, '')}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
}
