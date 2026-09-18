import React, { useState } from 'react';
import { Assignment, Incident, ResolutionOutcome } from '../../types';
import { api } from '../../lib/api';
import { 
  X, 
  FileCheck, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Camera 
} from 'lucide-react';

interface ResolveJobModalProps {
  assignment: Assignment;
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolveJobModal: React.FC<ResolveJobModalProps> = ({
  assignment,
  incident,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<ResolutionOutcome>('RESTORED');
  const [note, setNote] = useState(
    'Fault cleared. Reconnected overhead conductor, re-tensioned stay wires, and closed 11kV feeder cutout. Voltage tested normal at 235V.'
  );
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'
  );
  const [additionalNotes, setAdditionalNotes] = useState('All phase lines tested clear of tree limbs.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide technical resolution notes detailing what work was executed.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.assignments.resolve(assignment.id, {
        outcome,
        note: note.trim(),
        photoUrl: photoUrl.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit job resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Technician Completion Protocol
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Submit Job Resolution &amp; Evidence
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 line-clamp-1">
            Order: {incident.title} ({incident.locationName})
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Two-Way Citizen Confirmation Protocol
            </p>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Submitting this sets the incident status to <strong>RESOLUTION_PENDING</strong>. PowerPulse automatically prompts neighborhood residents to confirm electricity restoration before final closeout.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Technical Outcome *
            </label>
            <select
              value={outcome}
              onChange={e => setOutcome(e.target.value as ResolutionOutcome)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="RESTORED">RESTORED — Full power energized and stable</option>
              <option value="REPLACED_COMPONENT">REPLACED_COMPONENT — Snapped wire/cutout fuse replaced</option>
              <option value="ISOLATED_SAFE">ISOLATED_SAFE — Hazard cleared and isolated</option>
              <option value="TEMPORARY_BYPASS">TEMPORARY_BYPASS — Temporary feeder bypass enabled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Resolution Narrative &amp; Work Executed *
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Photo Evidence URL (Mandatory Completion Audit)
            </label>
            <div className="relative">
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/restored-line.jpg"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Provides proof of clearance and repaired apparatus for utility archives.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Follow-up Maintenance Notes (Optional)
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Schedule bush clearing around pole #14 next week..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Transmitting Evidence...' : 'Submit Resolution to Grid'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
