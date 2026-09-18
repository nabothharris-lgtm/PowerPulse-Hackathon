import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  LogOut,
  Shield,
  FileText,
  Building,
  UserCheck,
  Phone,
  Sparkles
} from 'lucide-react';

export const ApplicantStatusView: React.FC = () => {
  const { currentUser, refreshUser, switchUser, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const isRejected = currentUser.status === 'REJECTED';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMsg(null);
    try {
      await refreshUser();
      setMsg('Status refreshed.');
    } catch {
      setMsg('Could not refresh status.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSwitchToManager = () => {
    switchUser('usr-mgr-1');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className={`p-6 text-white ${isRejected ? 'bg-red-900' : 'bg-slate-900'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isRejected ? 'bg-red-700' : 'bg-amber-500 text-slate-950'
            }`}>
              {isRejected ? (
                <AlertCircle className="w-6 h-6 text-white" />
              ) : (
                <Clock className="w-6 h-6 fill-current" />
              )}
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isRejected 
                  ? 'bg-red-800 text-red-200 border-red-700' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {isRejected ? 'Application Rejected' : 'Credentials Under Review'}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Field Engineer Onboarding
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser.name} • {currentUser.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {isRejected ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 text-xs">
              <h4 className="font-bold mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Application Declined
              </h4>
              <p className="text-red-700 leading-relaxed mb-2">
                {currentUser.rejectionReason || 'Your professional qualifications could not be verified with the regulatory authority.'}
              </p>
              <p className="text-[11px] text-red-600 font-medium">
                Reviewed by: {currentUser.applicationReviewedBy || 'Regional Manager'} on{' '}
                {currentUser.applicationReviewedAt ? new Date(currentUser.applicationReviewedAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs">
              <h4 className="font-bold mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Provider Authorization
              </h4>
              <p className="text-amber-800 leading-relaxed">
                Your application for Field Engineer access is currently being evaluated by UEDCL Kigezi operations management. Until approved, you cannot view restricted dispatch incidents or take field assignments.
              </p>
            </div>
          )}

          {/* Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">
              Verification Progress
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Application Submitted</div>
                  <div className="text-[11px] text-slate-500">
                    Received on {new Date(currentUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isRejected 
                    ? 'bg-red-500 text-white' 
                    : 'bg-amber-500 text-slate-950 animate-pulse'
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">ERA License Validation</div>
                  <div className="text-[11px] text-slate-500">
                    License #{currentUser.professionalId || 'ERA-PENDING'} • Checking installation permit database
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">Manager Team Assignment</div>
                  <div className="text-[11px] text-slate-400">
                    Regional Manager reviews service area &amp; provisions field team
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details Summary */}
          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Applicant</span>
              <span className="font-semibold text-slate-800">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Contact</span>
              <span className="font-semibold text-slate-800">{currentUser.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Service Area</span>
              <span className="font-semibold text-slate-800">{currentUser.serviceArea || 'Kabale & Rubanda'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Organization</span>
              <span className="font-semibold text-slate-800">UEDCL Kigezi Sub-region</span>
            </div>
          </div>

          {/* Shortcut Helper */}
          {!isRejected && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 text-purple-900">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Review Demonstration Shortcut
                  </p>
                  <p className="text-[11px] text-purple-700 leading-snug">
                    Switch to Manager Arthur to approve this application and unlock field engineer workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToManager}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Switch to Manager
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Check Review Status
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {msg && (
            <p className="text-center text-xs text-slate-500 animate-fade-in">{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
};
