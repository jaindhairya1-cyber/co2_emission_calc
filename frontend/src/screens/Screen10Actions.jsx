import React, { useState } from 'react';
import { ChevronLeft, Search, Lightbulb, Sun, Truck, Zap, Flame, CheckCircle, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';

export default function Screen10Actions() {
  const { appData, toggleActionApplied, goBack, navigateTo } = useApp();
  const [activeFilter, setActiveFilter] = useState('Recommended'); // 'Recommended' | 'All actions' | 'Applied'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const appliedIds = appData.appliedActionIds || [];

  const getActionIcon = (title) => {
    if (title.includes('LED') || title.includes('lighting')) return Lightbulb;
    if (title.includes('solar') || title.includes('Rooftop')) return Sun;
    if (title.includes('Transport') || title.includes('route')) return Truck;
    if (title.includes('Compressor')) return Zap;
    return Flame;
  };

  const filteredActions = appData.actions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'Applied') {
      return appliedIds.includes(action.id);
    }
    if (activeFilter === 'Recommended') {
      return action.priorityType === 'high';
    }
    return true; // 'All actions'
  });

  return (
    <div className="screen-container app-screen with-bottom-nav">
      <div className="actions-header-bar">
        <button
          type="button"
          className="btn-back-header"
          onClick={goBack}
          aria-label="Back"
        >
          <ChevronLeft size={22} />
          <span className="actions-header-title">Actions</span>
        </button>

        <div className="header-actions">
          <button
            type="button"
            className="btn-icon-header"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search actions"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-bar-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search reduction actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Filter Tabs: Recommended | All actions | Applied */}
      <div className="actions-filter-tabs">
        {['Recommended', 'All actions', 'Applied'].map((filter) => (
          <button
            key={filter}
            type="button"
            className={`filter-tab-pill ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter} {filter === 'Applied' && `(${appliedIds.length})`}
          </button>
        ))}
      </div>

      <div className="actions-list-container">
        {filteredActions.length === 0 ? (
          <div className="empty-actions-box">
            <p>No reduction actions found for this filter.</p>
            {activeFilter === 'Applied' && (
              <button
                type="button"
                className="btn-link-action"
                onClick={() => setActiveFilter('Recommended')}
              >
                Browse Recommended Actions
              </button>
            )}
          </div>
        ) : (
          filteredActions.map((action) => {
            const Icon = getActionIcon(action.title);
            const isApplied = appliedIds.includes(action.id);

            return (
              <div
                key={action.id}
                className={`action-card-item ${isApplied ? 'applied-state' : ''}`}
                onClick={() => toggleActionApplied(action.id)}
              >
                <div className="action-card-header">
                  <div className="action-icon-circle">
                    <Icon size={18} />
                  </div>
                  <div className="action-title-area">
                    <div className="action-title-text">{action.title}</div>
                    <span className={`priority-badge priority-${action.priorityType}`}>
                      {action.priority}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`btn-apply-toggle ${isApplied ? 'is-active' : ''}`}
                    title={isApplied ? 'Marked as Applied' : 'Click to apply'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActionApplied(action.id);
                    }}
                  >
                    {isApplied ? (
                      <CheckCircle size={20} className="text-emerald" />
                    ) : (
                      <ChevronRight size={20} className="text-muted" />
                    )}
                  </button>
                </div>

                <div className="action-metrics-grid">
                  <div className="metric-box">
                    <div className="metric-val">{action.co2Reduction} tCO₂e/yr</div>
                    <div className="metric-lbl">Investment</div>
                    <div className="metric-sub-val">₹{action.investment.toLocaleString()}</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-val">₹{action.annualSaving.toLocaleString()}/yr</div>
                    <div className="metric-lbl">Payback</div>
                    <div className="metric-sub-val">{action.paybackYears} years</div>
                  </div>
                </div>

                {isApplied && (
                  <div className="applied-pill-banner">
                    ✓ Applied in decarbonization roadmap
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNavBar activeTab="results" />
    </div>
  );
}
