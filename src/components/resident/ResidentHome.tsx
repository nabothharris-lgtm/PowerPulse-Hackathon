import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Report, Incident } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CitizenRestorationModal } from './CitizenRestorationModal';
import { 
  PlusCircle, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  Zap, 
  ArrowRight, 
  ShieldAlert,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface ResidentHomeProps {
  onNavigate: (view: string) => void;
  onSelectReport: (reportId: string) => void;
  onOpenRestorationConfirm?: (incident: Incident) => void;
}

export const ResidentHome: React.FC<ResidentHomeProps> = ({
  onNavigate,
  onSelectReport,
  onOpenRestorationConfirm
}) => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingRestorationIncidents, setPendingRestorationIncidents] = useState<Incident[]>([]);
  const [selectedConfirmIncident, setSelectedConfirmIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResidentData() {
      setLoading(true);
      try {
        // Fetch reports
        const { reports: allReports } = await api.reports.list();
        const userReports = allReports.filter(r => r.reporterId === currentUser?.id);
        setReports(userReports);

        // Check if any active incidents are waiting for resolution confirmation
        const { incidents: allIncidents } = await api.incidents.list({ status: 'RESOLUTION_PENDING' });
        // Match incidents that are in same district or linked to this user's reports
        const userReportIds = new Set(userReports.map(r => r.id));
        const matched = allIncidents.filter(inc => 
          inc.relatedReportIds?.some(id => userReportIds.has(id)) || 
          inc.district === currentUser?.district
        );
        setPendingRestorationIncidents(matched);
      } catch (err) {
        console.error('Failed to load resident dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResidentData();
  }, [currentUser]);

  const activeReports = reports.filter(r => !['CLOSED', 'REJECTED'].includes(r.status));
  const resolvedCount = reports.filter(r => r.status === 'CLOSED').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Golden Demo Prompt: If an incident is pending confirmation, highlight it! */}
      {pendingRestorationIncidents.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-500 animate-pulse">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Action Needed: Field Crew Reported Power Restored
              </span>
              <h3 className="text-base sm:text-lg font-black">
                {pendingRestorationIncidents[0].title}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                The technical crew has marked this outage as resolved. Can you verify if power has actually been restored to your premises in {currentUser?.district || 'Kabale'}?
              </p>
            </div>
            <button
              onClick={() => {
                if (onOpenRestorationConfirm) {
                  onOpenRestorationConfirm(pendingRestorationIncidents[0]);
                } else {
                  setSelectedConfirmIncident(pendingRestorationIncidents[0]);
                }
              }}
              className="px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-black shadow-md cursor-pointer transition-all self-center"
            >
              Verify Restoration Now &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Kigezi Electricity Response Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {currentUser?.name?.split(' ')[0] || 'Neighbor'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Report electricity blackouts, fallen power lines, sparking transformers, and track official UEDCL utility restoration in real time across Kabale, Kisoro, and greater Kigezi.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('resident-report')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer group"
            >
              <PlusCircle className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span>Report Outage or Hazard</span>
            </button>
            <button
              onClick={() => onNavigate('resident-reports')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>My Reports ({reports.length})</span>
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Live Outage Map</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid Graphic */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-gradient-to-br from-amber-100 to-amber-200/30 rounded-full blur-2xl opacity-60 pointer-events-none" />
      </div>

      {/* Emergency Hotline Notice */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-950 uppercase tracking-wider">
              Life-Threatening Emergency?
            </div>
            <div className="text-xs text-red-800">
              For active fires, fallen live high-voltage conductors, or electrocution risks, call UEDCL Emergency Hotline immediately.
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-base font-black text-red-700 block">
            0800 285 285
          </span>
          <span className="text-[10px] text-red-600 uppercase font-semibold">
            Toll-Free 24/7 Dispatch
          </span>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Reports</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeReports.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Under dispatch or technical review</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Restored Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{resolvedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed electricity restorations</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Sub-Region</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 truncate">{currentUser?.district || 'Kabale'}</div>
          <p className="text-[11px] text-slate-500 mt-1">UEDCL Distribution Feeder Zone</p>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Recent Reports</h2>
          <button
            onClick={() => onNavigate('resident-reports')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your submissions...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No power reports filed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Experiencing a blackout or notice an electrical danger in your neighborhood? Submit a verified report.
            </p>
            <button
              onClick={() => onNavigate('resident-report')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Report Problem Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.slice(0, 4).map(report => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.status} size="sm" />
                    <span className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                      {report.categoryName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{report.locationName}</span>
                    <span>•</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Citizen Restoration Verification Modal */}
      {selectedConfirmIncident && (
        <CitizenRestorationModal
          isOpen={!!selectedConfirmIncident}
          incident={selectedConfirmIncident}
          onClose={() => setSelectedConfirmIncident(null)}
          onSuccess={() => {
            setSelectedConfirmIncident(null);
            // Refresh home data
            api.reports.list().then(({ reports: allReports }) => {
              setReports(allReports.filter(r => r.reporterId === currentUser?.id));
            }).catch(() => {});
            api.incidents.list({ status: 'RESOLUTION_PENDING' }).then(({ incidents: allIncidents }) => {
              setPendingRestorationIncidents(allIncidents);
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
};
