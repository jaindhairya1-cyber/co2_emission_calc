import React, { useState, useEffect } from 'react';
import { Bell, Edit2, Download, FileSpreadsheet, FileText, ArrowDownRight, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomNavBar from '../components/BottomNavBar';

export default function Screen12Reports() {
  const { appData, footprint, navigateTo, tempId, authUser } = useApp();
  const business = appData.business;

  const repName = authUser?.user_metadata?.full_name || business.ownerName || 'MSME Administrator';
  const repEmail = authUser?.email || business.email || tempId;
  const repPhone = authUser?.phone || business.phone || 'Verified via Session';

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState(null);
  const [serverReports, setServerReports] = useState({ spreadsheets: [], pdfs: [] });

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // Fetch list of generated reports from FastAPI backend
  const refreshReportList = () => {
    fetch(`${apiBase}/api/reports/list`)
      .then(res => res.json())
      .then(data => setServerReports(data))
      .catch(() => {});
  };

  useEffect(() => {
    refreshReportList();
  }, []);

  const handleDownloadSpreadsheet = async () => {
    setDownloadingXlsx(true);
    setDownloadMessage(null);

    const payload = {
      business,
      tempId,
      footprint,
      electricity: appData.electricity,
      fuels: appData.fuels,
      transport: appData.transport,
      materials: appData.materials,
      waste: appData.waste
    };

    try {
      const response = await fetch(`${apiBase}/api/reports/spreadsheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Backend spreadsheet generation error');
      const data = await response.json();

      // Trigger file download
      window.open(`${apiBase}/api/reports/download/${data.filename}`, '_blank');
      setDownloadMessage({ type: 'success', text: `Spreadsheet generated: ${data.filename}` });
      refreshReportList();
    } catch (err) {
      // Fallback CSV download if FastAPI is offline
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Domain,Scope,Emissions (tCO2e),Status\n"
        + `Scope 1 Direct Fuels,Scope 1,${footprint.scope1},Actual from Bills\n`
        + `Scope 2 Grid Electricity,Scope 2,${footprint.scope2},CEA India Verified\n`
        + `Scope 3 Supply Chain,Scope 3,${footprint.scope3},Estimated/Invoiced\n`
        + `TOTAL FOOTPRINT,Net,${footprint.total},Certified Compliant\n`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TerraAI_Carbon_Report_${business.name || 'MSME'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadMessage({ type: 'info', text: 'Downloaded Carbon Audit CSV spreadsheet.' });
    } finally {
      setDownloadingXlsx(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    setDownloadMessage(null);

    const payload = {
      business,
      tempId,
      footprint,
      electricity: appData.electricity,
      fuels: appData.fuels,
      transport: appData.transport,
      materials: appData.materials,
      waste: appData.waste
    };

    try {
      const response = await fetch(`${apiBase}/api/reports/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Backend PDF generation error');
      const data = await response.json();

      // Trigger file download
      window.open(`${apiBase}/api/reports/download/${data.filename}`, '_blank');
      setDownloadMessage({ type: 'success', text: `Audit PDF generated: ${data.filename}` });
      refreshReportList();
    } catch (err) {
      // Fallback printable view
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="screen-container app-screen with-bottom-nav">
      <div className="app-header-bar">
        <h1 className="results-title">Reports</h1>
        <div className="header-actions">
          <button
            type="button"
            className="btn-icon-header"
            onClick={refreshReportList}
            title="Refresh reports"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            className="btn-icon-header"
            onClick={() => alert('No new audit alerts. All greenhouse gas entries compliant with CEA & BRSR MSME norms.')}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
        </div>
      </div>

      <div className="reports-scroll-content">
        {/* Company Header Card */}
        <div className="reports-company-card">
          <div className="reports-company-avatar">
            <img src="/hero.jpg" alt="Factory avatar" className="avatar-img" />
          </div>
          <div className="reports-company-info">
            <div className="reports-biz-name">{business.name || 'Registered MSME Entity'}</div>
            <div className="reports-owner-name">Lead: {repName}</div>
            <div className="reports-location">{business.city || 'Regional Facility'}</div>
          </div>
          <button
            type="button"
            className="reports-edit-btn"
            onClick={() => navigateTo(3)}
            aria-label="Edit business profile"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {/* Account details */}
        <div className="report-info-section">
          <h2 className="report-section-title">Account details</h2>
          <div className="report-data-grid">
            <div className="report-data-row">
              <span className="report-field-lbl">Representative</span>
              <span className="report-field-val">{repName}</span>
            </div>
            <div className="report-data-row">
              <span className="report-field-lbl">Session / Account</span>
              <span className="report-field-val">{repEmail}</span>
            </div>
            <div className="report-data-row">
              <span className="report-field-lbl">Phone</span>
              <span className="report-field-val">{repPhone}</span>
            </div>
            <div className="report-data-row">
              <span className="report-field-lbl">Session Token</span>
              <span className="report-field-val code-font">{tempId}</span>
            </div>
          </div>
        </div>

        {/* Business details */}
        <div className="report-info-section">
          <h2 className="report-section-title">Business details</h2>
          <div className="report-data-grid">
            <div className="report-data-row">
              <span className="report-field-lbl">Industry</span>
              <span className="report-field-val">{business.industry || 'Textiles'}</span>
            </div>
            <div className="report-data-row">
              <span className="report-field-lbl">Employees</span>
              <span className="report-field-val">{business.employees || 50}</span>
            </div>
            <div className="report-data-row">
              <span className="report-field-lbl">Reporting period</span>
              <span className="report-field-val">{business.reportingPeriod || 'FY 2025-26'}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="report-info-section">
          <h2 className="report-section-title">Progress</h2>
          <div className="progress-metrics-row">
            <div className="progress-metric-card">
              <div className="progress-val-badge">
                <ArrowDownRight size={14} className="icon-reduction" />
                <span>8.4%</span>
              </div>
              <div className="progress-lbl">CO₂e reduced vs previous period</div>
            </div>

            <div className="progress-metric-card">
              <div className="progress-val-text">₹1,12,000</div>
              <div className="progress-lbl">Total saved from solutions</div>
            </div>
          </div>
        </div>

        {/* Shared with */}
        <div className="report-info-section">
          <h2 className="report-section-title">Shared with</h2>
          <div className="shared-with-card">
            <div className="shared-avatar">
              <span className="shared-initials">CA</span>
            </div>
            <div className="shared-details">
              <div className="shared-role">CA / Accountant</div>
              <div className="shared-date">Shared on 12 Sep 2026</div>
            </div>
            <button
              type="button"
              className="btn-manage-pill"
              onClick={() => alert('Access permission: View & Export BRSR Report.')}
            >
              Manage
            </button>
          </div>
        </div>

        {downloadMessage && (
          <div className={`download-alert ${downloadMessage.type === 'success' ? 'alert-success' : 'alert-info'}`}>
            <Check size={16} />
            <span>{downloadMessage.text}</span>
          </div>
        )}

        {/* Download Buttons: Spreadsheet & PDF */}
        <div className="report-actions-dual">
          <button
            type="button"
            id="btn-download-pdf-report"
            className="btn-primary-pill"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
          >
            <FileText size={18} />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Audit'}</span>
          </button>

          <button
            type="button"
            id="btn-download-excel-report"
            className="btn-secondary-pill"
            onClick={handleDownloadSpreadsheet}
            disabled={downloadingXlsx}
          >
            <FileSpreadsheet size={18} />
            <span>{downloadingXlsx ? 'Generating Excel...' : 'Export Spreadsheet (.xlsx)'}</span>
          </button>
        </div>

        {/* Stored Server Reports */}
        {(serverReports.spreadsheets.length > 0 || serverReports.pdfs.length > 0) && (
          <div className="report-info-section">
            <h2 className="report-section-title">Saved Server Reports (FastAPI)</h2>
            <div className="server-files-list">
              {serverReports.spreadsheets.slice(0, 2).map((fn) => (
                <a
                  key={fn}
                  href={`http://127.0.0.1:8000/api/reports/download/${fn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="server-file-link"
                >
                  <FileSpreadsheet size={14} className="text-forest" />
                  <span className="file-link-name">{fn}</span>
                  <Download size={14} />
                </a>
              ))}
              {serverReports.pdfs.slice(0, 2).map((fn) => (
                <a
                  key={fn}
                  href={`http://127.0.0.1:8000/api/reports/download/${fn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="server-file-link"
                >
                  <FileText size={14} className="text-forest" />
                  <span className="file-link-name">{fn}</span>
                  <Download size={14} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavBar activeTab="reports" />
    </div>
  );
}
