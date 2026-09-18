import React, { useState } from 'react';
import { Assignment } from '../../types';
import { api } from '../../lib/api';
import { 
  X, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Camera 
} from 'lucide-react';

interface WorkUpdateModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorkUpdateModal: React.FC<WorkUpdateModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [note, setNote] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && !isBlocked) {
      setError('Please provide a progress update note or indicate what is blocking work.');
      return;
    }
    if (isBlocked && !blockedReason.trim()) {
      setError('Please describe the blocker encountered (e.g. tree obstruction, heavy downpour, missing spares).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.assignments.addWorkUpdate(assignment.id, {
        note: note.trim() || undefined,
        isBlocked,
        blockedReason: isBlocked ? blockedReason.trim() : undefined,
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to post work update.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-base text-white">Post Field Work Update</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Logs an operational progress milestone or safety blocker to control room
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Field Progress Notes
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. High-voltage fuse link replaced. Testing transformer insulation resistance..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="blocker-check"
                checked={isBlocked}
                onChange={e => setIsBlocked(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <label htmlFor="blocker-check" className="text-xs font-bold text-red-900 cursor-pointer">
                Work is currently blocked / hindered
              </label>
            </div>

            {isBlocked && (
              <input
                type="text"
                value={blockedReason}
                onChange={e => setBlockedReason(e.target.value)}
                placeholder="Reason (e.g. Torrential rain, requires chainsaw crew, awaiting 11kV crossarm)..."
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Optional Photo URL
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://example.com/site-photo.jpg"
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
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Update'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
