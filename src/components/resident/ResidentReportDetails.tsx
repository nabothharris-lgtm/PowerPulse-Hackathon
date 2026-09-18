import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Report, Incident, StatusHistory } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Timeline } from '../common/Timeline';
import { SafetyBanner } from '../common/SafetyBanner';
import { CitizenRestorationModal } from './CitizenRestorationModal';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Phone, 
  Send, 
  AlertCircle, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Truck,
  Sparkles
} from 'lucide-react';

interface ResidentReportDetailsProps {
  reportId: string;
  onBack: () => void;
  onOpenRestorationConfirm?: (incident: Incident) => void;
}

export const ResidentReportDetails: React.FC<ResidentReportDetailsProps> = ({
  reportId,
  onBack,
  onOpenRestorationConfirm
}) => {
  const [report, setReport] = useState<Report | null>(null);
  const [linkedIncident, setLinkedIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Provide additional info state
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [showRestorationModal, setShowRestorationModal] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await api.reports.get(reportId);
        setReport(res.report);
        setLinkedIncident(res.linkedIncident);
        setHistory(res.history);
      } catch (err: any) {
        setError(err.message || 'Failed to load report details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [reportId]);

  const handleProvideInformation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!additionalInfo.trim()) return;

    setSubmittingInfo(true);
    try {
      const res = await api.reports.provideInfo(reportId, additionalInfo.trim());
      setReport(res.report);
      setInfoSuccess(true);
      setAdditionalInfo('');
      // refresh history
      const updated = await api.reports.get(reportId);
      setHistory(updated.history);
    } catch (err: any) {
      alert('Error updating report: ' + err.message);
    } finally {
      setSubmittingInfo(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
        Retrieving report tracking records...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl border border-red-200 text-center space-y-3">
        <p className="text-sm font-bold text-red-700">{error || 'Report not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Return to Reports
        </button>
      </div>
    );
  }

  const isNeedsInfo = report.status === 'NEEDS_INFORMATION';
  const isLinked = !!report.incidentId && !!linkedIncident;
  const isPendingRestoration = linkedIncident?.status === 'RESOLUTION_PENDING';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </button>
        <span className="text-xs font-mono text-slate-400">Report #{report.id}</span>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={report.status} size="lg" />
              {linkedIncident && (
                <PriorityBadge priority={linkedIncident.priority} size="sm" />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
              {report.categoryName}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {report.locationName}, {report.district}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Submitted {new Date(report.createdAt).toLocaleString()}
              </span>
            </p>
          </div>

          {/* Action to confirm resolution if linked incident is pending */}
          {isPendingRestoration && (
            <button
              onClick={() => {
                if (onOpenRestorationConfirm && linkedIncident) {
                  onOpenRestorationConfirm(linkedIncident);
                } else {
                  setShowRestorationModal(true);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md transition-all animate-bounce cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Verify Power Restoration</span>
            </button>
          )}
        </div>

        {/* Dispatch banner if linked to live operational work order */}
        {isLinked && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Linked to Active Work Order: {linkedIncident.title}
                </h4>
                <StatusBadge status={linkedIncident.status} size="sm" />
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Your report has been verified and grouped into an official utility response work order.
                {linkedIncident.assignedEngineerName
                  ? ` Assigned Engineer: ${linkedIncident.assignedEngineerName}.`
                  : ' A technical crew will be dispatched shortly.'}
              </p>
            </div>
          </div>
        )}

        {/* Needs Information Alert Prompt */}
        {isNeedsInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-purple-950">
                  Operations Needs More Details
                </h4>
                <p className="text-xs text-purple-800 mt-0.5">
                  The control room requested clarifying details before field technicians can be safely dispatched.
                </p>
              </div>
            </div>

            <form onSubmit={handleProvideInformation} className="space-y-3 pt-2">
              <textarea
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                rows={2}
                placeholder="Type additional details (e.g., exact pole number, nearby shop name, meter number)..."
                className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingInfo}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingInfo ? 'Submitting...' : 'Send Clarification to Operations'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Report Details Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Location</span>
              <span className="text-slate-800 font-medium">{report.locationName}</span>
              {report.landmark && (
                <span className="text-slate-500 block text-[11px]">Landmark: {report.landmark}</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Scope</span>
              <span className="text-slate-800 font-medium capitalize">
                {report.affectedAreaType ? report.affectedAreaType.replace(/_/g, ' ').toLowerCase() : 'Not specified'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Reporter</span>
              <span className="text-slate-800 font-medium">{report.reporterName}</span>
              <span className="text-slate-500 block text-[11px]">{report.reporterPhone}</span>
            </div>
            {report.photoUrl && (
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Attached Photo</span>
                <a
                  href={report.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  View full resolution photo <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {report.description && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
              Incident Notes
            </span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              {report.description}
            </p>
          </div>
        )}
      </div>

      {/* Audit Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Official Tracking &amp; Dispatch Timeline</h3>
        <Timeline history={history} title="Status Event Log" />
      </div>

      {/* Citizen Restoration Verification Modal */}
      {showRestorationModal && linkedIncident && (
        <CitizenRestorationModal
          isOpen={showRestorationModal}
          incident={linkedIncident}
          onClose={() => setShowRestorationModal(false)}
          onSuccess={updated => {
            setLinkedIncident(updated);
            setShowRestorationModal(false);
            // Refresh details
            api.reports.get(reportId).then(res => {
              setReport(res.report);
              setLinkedIncident(res.linkedIncident);
              setHistory(res.history);
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
};
