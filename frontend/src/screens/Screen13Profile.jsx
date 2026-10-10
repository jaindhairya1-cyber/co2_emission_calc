import React, { useState } from 'react';
import {
  Bell, BookOpen, Settings, HelpCircle, FileText, Shield, Mail,
  ChevronRight, Zap, RefreshCw, Copy, Check, LogOut, User, Building,
  Key, CheckCircle2, AlertCircle, ArrowUpRight, ChevronLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';
import { isSupabaseConfigured, configureSupabaseKeys } from '../services/supabaseClient';

export default function Screen13Profile() {
  const {
    appData,
    tempId,
    createNewTempId,
    navigateTo,
    goBack,
    authUser,
    handleSignOut
  } = useApp();

  const business = appData.business;
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(tempId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // User display name & email
  const displayName = authUser?.user_metadata?.full_name
    || (authUser?.email ? authUser.email.split('@')[0] : '')
    || business.ownerName
    || 'Authorized Representative';

  const displayEmail = authUser?.email
    || authUser?.phone
    || business.email
    || 'Guest Session (Unlinked)';

  const userInitial = displayName.charAt(0).toUpperCase() || 'M';
  const authProvider = authUser?.app_metadata?.provider || (authUser ? 'Supabase' : 'Temporary Guest');

  return (
    <div className="screen-container app-screen with-bottom-nav">
      {/* App Header */}
      <div className="app-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="wizard-back-btn"
            onClick={goBack}
            aria-label="Back"
            title="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="results-title" style={{ margin: 0 }}>Profile & Account</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-icon-header"
            onClick={() => alert(`Active Session: ${tempId}\nAuth Provider: ${authProvider}`)}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
        </div>
      </div>

      <div className="profile-scroll-content">
        {/* User Card: Shows real Supabase user OR Guest */}
        <div className="profile-user-card">
          <div className="profile-user-header">
            <div className={`profile-avatar-circle ${!authUser ? 'profile-avatar-guest' : ''}`}>
              {userInitial}
            </div>
            <div className="profile-user-meta">
              <span className="profile-user-name">{displayName}</span>
              <span className="profile-user-email">{displayEmail}</span>
              <div className={`profile-auth-tag ${authUser ? 'tag-supabase' : 'tag-guest'}`}>
                {authUser ? <CheckCircle2 size={12} /> : <Zap size={12} />}
                <span>{authUser ? `Supabase Auth (${authProvider})` : 'Temporary Guest ID'}</span>
              </div>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="profile-detail-label">Facility</span>
              <span className="profile-detail-value">{business.name || 'Not configured'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="profile-detail-label">Location</span>
              <span className="profile-detail-value">{business.city || 'Not configured'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="profile-detail-label">Reporting Period</span>
              <span className="profile-detail-value">{business.reportingPeriod || 'FY 2025-26'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="profile-detail-label">Session ID</span>
              <span className="profile-detail-value">{tempId}</span>
            </div>
          </div>

          <div className="profile-user-actions">
            <button
              type="button"
              className="btn-profile-action"
              onClick={() => navigateTo(3)} // Edit business details
            >
              <Building size={14} />
              <span>Edit Facility</span>
            </button>
            {authUser ? (
              <button
                type="button"
                className="btn-profile-action btn-profile-signout"
                onClick={handleSignOut}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-profile-action"
                onClick={() => navigateTo(2)}
              >
                <User size={14} />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Temporary Guest Session Tools */}
        {!authUser && (
          <div className="profile-upgrade-callout">
            <div className="profile-upgrade-callout-title">
              <Zap size={16} />
              <span>Save Your Carbon Ledger Permanently</span>
            </div>
            <p className="profile-upgrade-callout-desc">
              You are currently using Temporary Session <strong className="font-mono">{tempId}</strong>.
              Connect Supabase Auth to access your audits across devices.
            </p>
            <button
              type="button"
              className="btn-upgrade-connect"
              onClick={() => navigateTo(2)}
            >
              <span>Connect Supabase Account</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}

        {/* Session Token Management */}
        <div className="profile-session-card">
          <div className="session-card-header">
            <div className="session-icon-circle">
              <Zap size={18} className="text-emerald" />
            </div>
            <div className="session-card-info">
              <span className="session-subtitle">Active Ledger Token</span>
              <div className="session-code-text">{tempId}</div>
            </div>
          </div>
          <div className="session-actions-row">
            <button
              type="button"
              className="btn-session-subtle"
              onClick={handleCopyId}
            >
              {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
            <button
              type="button"
              className="btn-session-subtle"
              onClick={() => {
                const id = createNewTempId();
                alert(`Generated new Temporary Session: ${id}`);
              }}
            >
              <RefreshCw size={14} />
              <span>New ID</span>
            </button>
          </div>
        </div>

        {/* App Configuration & Knowledge */}
        <div className="profile-section-heading">Preferences & App</div>
        <div className="menu-group-card">
          <button
            type="button"
            className="menu-row-item"
            onClick={() => navigateTo(14)}
          >
            <div className="menu-item-left">
              <BookOpen size={18} className="menu-item-icon" />
              <span className="menu-item-label">Emission factors library</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>

          <button
            type="button"
            className="menu-row-item"
            onClick={() => navigateTo(14)}
          >
            <div className="menu-item-left">
              <Settings size={18} className="menu-item-icon" />
              <span className="menu-item-label">Settings & Defaults</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>

          <button
            type="button"
            className="menu-row-item"
            onClick={() => navigateTo(14)}
          >
            <div className="menu-item-left">
              <HelpCircle size={18} className="menu-item-icon" />
              <span className="menu-item-label">Help & Support</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>
        </div>

        {/* Legal & Compliance */}
        <div className="profile-section-heading">Compliance & Legal</div>
        <div className="menu-group-card">
          <button
            type="button"
            className="menu-row-item"
            onClick={() => navigateTo(14)}
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
            onClick={() => navigateTo(14)}
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
            onClick={() => navigateTo(14)}
          >
            <div className="menu-item-left">
              <Mail size={18} className="menu-item-icon" />
              <span className="menu-item-label">Contact Us</span>
            </div>
            <ChevronRight size={18} className="menu-chevron" />
          </button>
        </div>
      </div>

      <BottomNavBar activeTab="profile" />
    </div>
  );
}
