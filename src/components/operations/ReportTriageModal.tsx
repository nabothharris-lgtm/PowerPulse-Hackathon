import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Report, Incident, IncidentPriority, IncidentSeverity } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { 
  X, 
  CheckCircle2, 
  Layers, 
  Link2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  MapPin, 
  Flame, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

interface ReportTriageModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
  onNavigateToIncident?: (incidentId: string) => void;
}

export const ReportTriageModal: React.FC<ReportTriageModalProps> = ({
  report,
  isOpen,
  onClose,
  onActionComplete,
  onNavigateToIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'NEW_INCIDENT' | 'LINK_EXISTING' | 'REQUEST_INFO' | 'REJECT'>('NEW_INCIDENT');

  // Duplicate candidates
  const [duplicateCandidates, setDuplicateCandidates] = useState<{
    candidateReports: { report: Report; distanceMeters: number; matchScore: number }[];
    candidateIncidents: { incident: Incident; distanceMeters: number; relevance: number }[];
  } | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // New Incident Form State
  const [incidentTitle, setIncidentTitle] = useState(`${report.categoryName} - ${report.locationName}`);
  const [priority, setPriority] = useState<IncidentPriority>(
    report.categoryName.toLowerCase().includes('wire') || report.categoryName.toLowerCase().includes('down')
      ? 'EMERGENCY'
      : 'HIGH'
  );
  const [severity, setSeverity] = useState<IncidentSeverity>(
    report.categoryName.toLowerCase().includes('wire') ? 'CRITICAL' : 'HIGH'
  );
  const [affectedRadius, setAffectedRadius] = useState<number>(450);
  const [affectedCustomers, setAffectedCustomers] = useState<number>(85);
  const [incidentDescription, setIncidentDescription] = useState(report.description || '');

  // Link existing state
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');

  // Clarification state
  const [clarificationReason, setClarificationReason] = useState('Please clarify the exact pole number or nearest landmark.');

  // Rejection state
  const [rejectionReason, setRejectionReason] = useState('Report could not be verified / outside service network.');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCandidates() {
      setLoadingCandidates(true);
      try {
        const res = await api.reports.getDuplicateCandidates(report.id);
        setDuplicateCandidates(res);
        if (res.candidateIncidents.length > 0) {
          setSelectedIncidentId(res.candidateIncidents[0].incident.id);
        }
      } catch (err) {
        console.error('Failed to load candidate duplicates:', err);
      } finally {
        setLoadingCandidates(false);
      }
    }
    loadCandidates();
  }, [report.id]);

  if (!isOpen) return null;

  // Handler: Create Incident & Link
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.incidents.create({
        title: incidentTitle.trim(),
        primaryReportId: report.id,
        categoryId: report.categoryId,
        description: incidentDescription.trim(),
        severity,
        priority,
        locationName: report.locationName,
        district: report.district,
        subArea: report.subArea,
        latitude: report.latitude,
        longitude: report.longitude,
        affectedRadiusMeters: Number(affectedRadius),
        affectedCustomersEst: Number(affectedCustomers),
      });

      onActionComplete();
      if (onNavigateToIncident) {
        onNavigateToIncident(res.incident.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create incident.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Link to Existing Incident
  const handleLinkIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId) {
      setError('Please select an active incident to link this report to.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.incidents.linkReport(selectedIncidentId, report.id);
      onActionComplete();
      if (onNavigateToIncident) {
        onNavigateToIncident(selectedIncidentId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link report to incident.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Request Info
  const handleRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationReason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.reports.requestInfo(report.id, clarificationReason.trim());
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to request clarification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Reject Report
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.reports.reject(report.id, rejectionReason.trim());
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to reject report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Operations Triage &amp; Incident Grouping
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                {report.categoryName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {report.locationName}, {report.district}
            </span>
            <span>•</span>
            <span>Reporter: {report.reporterName} ({report.reporterPhone})</span>
          </div>
        </div>

        {/* Candidate Matching Banner (Smart Deduplication) */}
        {duplicateCandidates && (duplicateCandidates.candidateIncidents.length > 0 || duplicateCandidates.candidateReports.length > 0) && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 sm:px-6 text-xs text-amber-950">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Smart Deduplication Alert: </span>
                <span>
                  Found {duplicateCandidates.candidateIncidents.length} active work order(s) and {duplicateCandidates.candidateReports.length} related citizen report(s) within 500m of this report.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('NEW_INCIDENT')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'NEW_INCIDENT'
                ? 'border-amber-500 text-slate-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Work Order
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LINK_EXISTING')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'LINK_EXISTING'
                ? 'border-amber-500 text-slate-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Link to Active Order ({duplicateCandidates?.candidateIncidents.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REQUEST_INFO')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'REQUEST_INFO'
                ? 'border-amber-500 text-slate-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Request Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REJECT')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'REJECT'
                ? 'border-red-500 text-red-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-red-700'
            }`}
          >
            Reject Report
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CREATE NEW INCIDENT */}
          {activeTab === 'NEW_INCIDENT' && (
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600">
                Verifying this report will create a new operational <strong>Incident Work Order</strong> and link this report as the primary evidence source for technical field dispatch.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  value={incidentTitle}
                  onChange={e => setIncidentTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispatch Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as IncidentPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="EMERGENCY">EMERGENCY (Fallen wire / Fire / Electrocution hazard)</option>
                    <option value="CRITICAL">CRITICAL (Major feeder line / Hospital impacted)</option>
                    <option value="HIGH">HIGH (Neighborhood outage)</option>
                    <option value="NORMAL">NORMAL (Standard LV fault)</option>
                    <option value="LOW">LOW (Streetlight / minor defect)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Technical Severity *
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Affected Radius (Meters)
                  </label>
                  <input
                    type="number"
                    value={affectedRadius}
                    onChange={e => setAffectedRadius(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Affected Customers
                  </label>
                  <input
                    type="number"
                    value={affectedCustomers}
                    onChange={e => setAffectedCustomers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatch Instructions &amp; Safety Scope
                </label>
                <textarea
                  value={incidentDescription}
                  onChange={e => setIncidentDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Creating Incident...' : 'Verify & Create Work Order'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LINK TO EXISTING INCIDENT */}
          {activeTab === 'LINK_EXISTING' && (
            <form onSubmit={handleLinkIncident} className="space-y-4">
              <p className="text-xs text-slate-600">
                Attach this report to an active incident work order in the same geographic grid feeder area.
              </p>

              {duplicateCandidates?.candidateIncidents.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                  No active incidents detected within 500m. You can create a new work order under the first tab.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {duplicateCandidates?.candidateIncidents.map(cand => (
                    <div
                      key={cand.incident.id}
                      onClick={() => setSelectedIncidentId(cand.incident.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedIncidentId === cand.incident.id
                          ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {cand.incident.title}
                        </span>
                        <PriorityBadge priority={cand.incident.priority} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                        <span>{cand.incident.locationName}</span>
                        <span>•</span>
                        <span className="text-indigo-700 font-semibold font-mono">
                          ~{cand.distanceMeters}m away
                        </span>
                        <span>•</span>
                        <span>{cand.incident.relatedReportIds.length} existing reports</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedIncidentId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{submitting ? 'Linking...' : 'Link Report to Incident'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REQUEST INFO */}
          {activeTab === 'REQUEST_INFO' && (
            <form onSubmit={handleRequestInfo} className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-xs text-purple-900">
                Change report status to <strong>NEEDS_INFORMATION</strong>. The citizen will be notified to provide additional details.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clarification Message to Resident *
                </label>
                <textarea
                  value={clarificationReason}
                  onChange={e => setClarificationReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Request Details from Resident'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: REJECT */}
          {activeTab === 'REJECT' && (
            <form onSubmit={handleReject} className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-900">
                Marking a report as <strong>REJECTED</strong> logs the decision in the audit trail.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{submitting ? 'Rejecting...' : 'Reject Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
