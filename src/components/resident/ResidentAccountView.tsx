import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  CheckCircle2,
  LogOut,
  Bell,
  Building
} from 'lucide-react';

interface ResidentAccountViewProps {
  onNavigateReports: () => void;
  onNavigateNewReport: () => void;
}

export const ResidentAccountView: React.FC<ResidentAccountViewProps> = ({
  onNavigateReports,
  onNavigateNewReport
}) => {
  const { currentUser, logout } = useAuth();
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [hazardAlerts, setHazardAlerts] = useState(true);

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-900 font-bold text-2xl flex items-center justify-center border-2 border-emerald-300 shadow-inner">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Community Member
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Member ID: <span className="font-mono text-slate-700 font-semibold">{currentUser.id}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.phone}
                </span>
                {currentUser.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {currentUser.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.district || 'Kabale'}, Kigezi
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer border border-red-200 self-stretch sm:self-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Settings & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coverage & Utility Details */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-500" />
            Assigned Grid Service Provider
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Distribution Utility:</span>
              <span className="font-bold text-slate-900">UEDCL (Uganda Electricity Distribution)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Territory:</span>
              <span className="font-bold text-slate-900">Kigezi Sub-Region (Kabale Depot)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">24/7 Emergency Dispatch:</span>
              <span className="font-mono font-bold text-emerald-700">0800 285 285</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active &amp; Verified
              </span>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onNavigateNewReport}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              Report a Fault
            </button>
            <button
              onClick={onNavigateReports}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              My History
            </button>
          </div>
        </div>

        {/* Notifications & Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            Outage Alerts &amp; Preferences
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">SMS Incident Updates</span>
                <span className="text-slate-500 text-[11px]">Receive SMS when repair crew arrives at verified fault</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={e => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Critical Hazard Broadcasts</span>
                <span className="text-slate-500 text-[11px]">Receive emergency alerts for fallen live conductors near your area</span>
              </div>
              <input
                type="checkbox"
                checked={hazardAlerts}
                onChange={e => setHazardAlerts(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
            </label>
          </div>
          <div className="pt-2 text-slate-400 text-[11px] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>PowerPulse Uganda • Certified by Electricity Regulatory Authority</span>
          </div>
        </div>
      </div>
    </div>
  );
};
