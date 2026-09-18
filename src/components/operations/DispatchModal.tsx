import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Incident, User } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { 
  X, 
  Wrench, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  MapPin 
} from 'lucide-react';

interface DispatchModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  incident,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [engineers, setEngineers] = useState<User[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('Immediate dispatch. Ensure complete line isolation before ascension.');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEngineers() {
      setLoading(true);
      try {
        const { users } = await api.auth.getDemoUsers();
        const engs = users.filter(u => u.role === 'ENGINEER' && u.status === 'ACTIVE');
        setEngineers(engs);
        if (engs.length > 0) {
          setSelectedEngineerId(engs[0].id);
        }
      } catch (err) {
        console.error('Failed to load engineers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEngineers();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngineerId) {
      setError('Please select a field engineer.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.incidents.assign(incident.id, {
        engineerId: selectedEngineerId,
        notes: dispatchNotes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch work order.');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Operations Dispatch Desk
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Assign Technical Field Crew
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 line-clamp-1">
            {incident.title} ({incident.locationName})
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Field Technician *
            </label>
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading active field personnel...</div>
            ) : engineers.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                No active engineers found. Please ensure at least one engineer application is approved.
              </div>
            ) : (
              <div className="space-y-2">
                {engineers.map(eng => {
                  const isSelected = eng.id === selectedEngineerId;
                  return (
                    <div
                      key={eng.id}
                      onClick={() => setSelectedEngineerId(eng.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                          {eng.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{eng.name}</div>
                          <div className="text-[11px] text-slate-500">{eng.phone} • {eng.district || 'Kabale'}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Dispatch Instructions &amp; Safety Orders
            </label>
            <textarea
              value={dispatchNotes}
              onChange={e => setDispatchNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Bring safety climbing harness, pole isolation kit, and replacement 50kVA cutout fuses..."
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
              disabled={submitting || !selectedEngineerId}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting Dispatch...' : 'Authorize & Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
