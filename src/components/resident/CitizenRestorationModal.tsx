import React, { useState } from 'react';
import { Incident } from '../../types';
import { api } from '../../lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Star, 
  AlertTriangle, 
  RotateCcw, 
  Zap, 
  Send,
  X
} from 'lucide-react';

interface CitizenRestorationModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedIncident: Incident) => void;
}

export const CitizenRestorationModal: React.FC<CitizenRestorationModalProps> = ({
  incident,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'CONFIRM' | 'DISPUTE' | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [confirmComment, setConfirmComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.incidents.confirmRestoration(incident.id, {
        rating,
        comment: confirmComment.trim() || undefined,
      });
      onSuccess(res.incident);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm power restoration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setError('Please provide a reason why you are disputing restoration (e.g., power still off, voltage too low).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.incidents.disputeRestoration(incident.id, {
        reason: disputeReason.trim(),
      });
      onSuccess(res.incident);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Citizen Verification Protocol
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Has your power been restored?
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Work Order: <span className="font-semibold text-white">{incident.title}</span> ({incident.locationName})
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {decision === null && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                The technical field crew reported that repairs at <strong>{incident.locationName}</strong> have been concluded. In PowerPulse, an outage is only permanently marked closed after neighborhood residents confirm electricity is back on.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDecision('CONFIRM')}
                  className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-950 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm">YES, Power is Back On</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Confirm restoration &amp; rate service
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('DISPUTE')}
                  className="p-4 rounded-2xl border-2 border-red-400 bg-red-50/60 hover:bg-red-100/60 text-red-950 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm">NO, Still Without Power</div>
                    <div className="text-[11px] text-red-800 mt-0.5">
                      Reopen incident for re-dispatch
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* CONFIRM FLOW */}
          {decision === 'CONFIRM' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Confirming Grid Restoration
                </p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Thank you! Your confirmation marks this incident as officially restored and closed in the utility record.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Rate the Repair Crew Service Quality:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Comments or Feedback (Optional)
                </label>
                <textarea
                  value={confirmComment}
                  onChange={e => setConfirmComment(e.target.value)}
                  rows={2}
                  placeholder="Power came back on smoothly; appreciate the fast response..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDecision(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Final Confirmation'}</span>
                </button>
              </div>
            </form>
          )}

          {/* DISPUTE FLOW */}
          {decision === 'DISPUTE' && (
            <form onSubmit={handleDispute} className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  Disputing Restoration &rarr; Automatic Reopen
                </p>
                <p className="text-red-800 text-[11px] leading-relaxed">
                  Submitting this will immediately revert the incident to <strong>REOPENED</strong> status, flag an alert in the operations dispatch queue, and notify the engineer supervisor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Explain Current Grid Condition *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Power is still completely blacked out on our lane, or lights are dim with heavy flickering..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDecision(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{submitting ? 'Reopening...' : 'Reopen Incident for Crew'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
