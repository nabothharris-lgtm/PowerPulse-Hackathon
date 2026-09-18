import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertOctagon, LogOut, Phone, ShieldAlert, Sparkles } from 'lucide-react';

export const SuspendedAccountView: React.FC = () => {
  const { currentUser, logout, switchUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-red-900 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-800 flex items-center justify-center shadow-lg border border-red-700">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-800 text-red-200 border border-red-700">
                Account Suspended
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Access Restricted
              </h2>
              <p className="text-xs text-red-200">
                {currentUser.name} ({currentUser.role})
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Operational Authorization Revoked
            </p>
            <p className="text-red-700">
              Your PowerPulse account has been suspended by regional utility operations due to an administrative review or safety investigation. While suspended, you are strictly blocked from submitting reports or viewing protected grid operational data.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 space-y-2 text-xs bg-slate-50">
            <div className="font-bold text-slate-800">Assistance &amp; Appeals</div>
            <p className="text-slate-600 leading-relaxed">
              If you believe this suspension is in error, please contact the UEDCL Kigezi Customer Care &amp; Dispatch Center:
            </p>
            <div className="flex items-center gap-2 text-slate-700 font-semibold pt-1">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Toll Free: 0800 285 285 • Kabale Office: +256 486 422 100</span>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-950 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Testing Suspended Guard
                </p>
                <p className="text-[11px] text-amber-800">
                  Switch to Florence (Resident) or Sarah (Dispatcher) to continue testing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchUser('usr-res-1')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs"
              >
                Switch to Florence
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer border border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
