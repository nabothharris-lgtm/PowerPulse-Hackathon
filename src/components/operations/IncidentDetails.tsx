import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Incident, Report, Assignment, WorkUpdate, ResolutionEvidence, StatusHistory, IncidentPriority, IncidentSeverity } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Timeline } from '../common/Timeline';
import { SafetyBanner } from '../common/SafetyBanner';
import { DispatchModal } from './DispatchModal';
import { 
  ArrowLeft, 
  MapPin, 
  Wrench, 
  FileText, 
  Users, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  RotateCcw, 
  Layers, 
  ShieldAlert,
  Send,
  Sparkles
} from 'lucide-react';

interface IncidentDetailsProps {
  incidentId: string;
  onBack: () => void;
  onSelectReport?: (reportId: string) => void;
}

export const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incidentId,
  onBack,
  onSelectReport,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [relatedReports, setRelatedReports] = useState<Report[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [resolutionEvidence, setResolutionEvidence] = useState<ResolutionEvidence[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispatch modal
  const [showDispatch, setShowDispatch] = useState(false);

  // Priority edit state
  const [editingPriority, setEditingPriority] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<IncidentPriority>('HIGH');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>('HIGH');
  const [priorityReason, setPriorityReason] = useState('');
  const [savingPriority, setSavingPriority] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.incidents.get(incidentId);
      setIncident(res.incident);
      setRelatedReports(res.relatedReports);
      setAssignments(res.assignments);
      setWorkUpdates(res.workUpdates);
      setResolutionEvidence(res.resolutionEvidence);
      setHistory(res.history);
      setSelectedPriority(res.incident.priority);
      setSelectedSeverity(res.incident.severity);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [incidentId]);

  const handleUpdatePriority = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPriority(true);
    try {
      await api.incidents.updatePriority(incidentId, {
        priority: selectedPriority,
        severity: selectedSeverity,
        reason: priorityReason.trim() || undefined,
      });
      setEditingPriority(false);
      setPriorityReason('');
      fetchDetails();
    } catch (err: any) {
      alert('Failed to update priority: ' + err.message);
    } finally {
      setSavingPriority(false);
    }
  };

  const handleUnlinkReport = async (reportId: string) => {
    if (!window.confirm('Unlink this report from the work order?')) return;
    try {
      await api.incidents.unlinkReport(incidentId, reportId);
      fetchDetails();
    } catch (err: any) {
      alert('Failed to unlink report: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
        Loading operational work order records...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl border border-red-200 text-center space-y-3">
        <p className="text-sm font-bold text-red-700">{error || 'Incident not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Return to Work Orders
        </button>
      </div>
    );
  }

  const isReopened = incident.status === 'REOPENED';
  const isEmergency = incident.priority === 'EMERGENCY';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Work Orders</span>
        </button>
        <span className="text-xs font-mono text-slate-400">Incident #{incident.id}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        {isEmergency && (
          <SafetyBanner
            warning="EMERGENCY DISPATCH ACTIVE: High-voltage or public safety hazard requires priority isolation protocol before line work begins."
          />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={incident.priority} size="lg" />
              <StatusBadge status={incident.status} size="lg" />
              {isReopened && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-md animate-pulse">
                  <RotateCcw className="w-3.5 h-3.5" /> Reopened by Citizen
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
              {incident.title}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-slate-800 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {incident.locationName}, {incident.district}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-500">
                GPS: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
              </span>
              <span>•</span>
              <span>Radius: ~{incident.affectedRadiusMeters}m</span>
              <span>•</span>
              <span>Est. {incident.affectedCustomersEst} Customers</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setEditingPriority(!editingPriority)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Adjust Priority
            </button>
            <button
              onClick={() => setShowDispatch(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{incident.assignedEngineerId ? 'Reassign Crew' : 'Dispatch Technician'}</span>
            </button>
          </div>
        </div>

        {/* Priority Edit Drawer */}
        {editingPriority && (
          <form onSubmit={handleUpdatePriority} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Update Incident Priority &amp; Severity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value as IncidentPriority)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                >
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={e => setSelectedSeverity(e.target.value as IncidentSeverity)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Reclassification</label>
              <input
                type="text"
                value={priorityReason}
                onChange={e => setPriorityReason(e.target.value)}
                placeholder="e.g. Upgraded to Emergency due to high wind storm..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPriority(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPriority}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Save Classification
              </button>
            </div>
          </form>
        )}

        {/* Assigned Engineer Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Technician:</span>
            {incident.assignedEngineerName ? (
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {incident.assignedEngineerName}
              </span>
            ) : (
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Awaiting Dispatch
              </span>
            )}
          </div>
          {incident.assignedEngineerPhone && (
            <span className="text-slate-500 font-mono">Contact: {incident.assignedEngineerPhone}</span>
          )}
        </div>
      </div>

      {/* 2-Column Content Grid: Linked Reports & Technician Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Citizen Reports */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Linked Citizen Reports ({relatedReports.length})
            </h2>
            <span className="text-xs text-slate-400">Merged customer evidence</span>
          </div>

          <div className="divide-y divide-slate-100">
            {relatedReports.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No citizen reports linked yet.
              </div>
            ) : (
              relatedReports.map(rep => (
                <div key={rep.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{rep.categoryName}</span>
                      <span className="text-slate-400 text-[10px]">#{rep.id.slice(-6)}</span>
                    </div>
                    <button
                      onClick={() => handleUnlinkReport(rep.id)}
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                      title="Unlink from this work order"
                    >
                      Unlink
                    </button>
                  </div>
                  <p className="text-slate-600">{rep.locationName} • {rep.reporterName} ({rep.reporterPhone})</p>
                  {rep.description && (
                    <p className="text-slate-500 text-[11px] italic">&quot;{rep.description}&quot;</p>
                  )}
                  {rep.photoUrl && (
                    <a
                      href={rep.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold pt-0.5"
                    >
                      View Citizen Photo Evidence <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Technician Field Updates & Resolution Evidence */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              Field Technician Progress &amp; Evidence
            </h2>
            <span className="text-xs text-slate-400">{workUpdates.length} Updates</span>
          </div>

          {/* Resolution Evidence Card if Present */}
          {resolutionEvidence.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2 text-xs text-emerald-950">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolution Evidence Submitted
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 px-2 py-0.5 rounded">
                  {resolutionEvidence[0].outcome}
                </span>
              </div>
              <p className="text-emerald-900 font-medium">
                {resolutionEvidence[0].resolutionNote}
              </p>
              {resolutionEvidence[0].photoUrl && (
                <div className="pt-1">
                  <a
                    href={resolutionEvidence[0].photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    View Field Completion Photo <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Work Updates Stream */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {workUpdates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No field progress updates posted yet.
              </div>
            ) : (
              workUpdates.map(up => (
                <div key={up.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{up.engineerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(up.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {up.note && <p className="text-slate-600">{up.note}</p>}
                  {up.isBlocked && (
                    <div className="text-red-700 font-bold text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Blocked: {up.blockedReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full Audit & State Machine Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Work Order Lifecycle Audit Log
        </h2>
        <Timeline history={history} title="Dispatch & Response State History" />
      </div>

      {/* Dispatch Modal */}
      {showDispatch && (
        <DispatchModal
          incident={incident}
          isOpen={true}
          onClose={() => setShowDispatch(false)}
          onSuccess={() => {
            setShowDispatch(false);
            fetchDetails();
          }}
        />
      )}
    </div>
  );
};
