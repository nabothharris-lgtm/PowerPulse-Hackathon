import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { StatusHistory } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { 
  BarChart3, 
  AlertTriangle, 
  Layers, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Flame, 
  RotateCcw, 
  ArrowRight, 
  RefreshCw,
  Users,
  Radio,
  MapPin
} from 'lucide-react';

interface OperationsDashboardProps {
  onNavigate: (view: string) => void;
  onSelectIncident?: (id: string) => void;
  onSelectReport?: (id: string) => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  onNavigate,
  onSelectIncident,
  onSelectReport,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.dashboard.getOperationsMetrics();
      setData(res);
    } catch (err) {
      console.error('Failed to load operations metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
        Loading grid operations telemetry...
      </div>
    );
  }

  const m = data?.metrics || {
    totalReports: 0,
    unverifiedReports: 0,
    needsInfoReports: 0,
    linkedReports: 0,
    totalIncidents: 0,
    openIncidents: 0,
    emergencyIncidents: 0,
    inProgressIncidents: 0,
    resolutionPendingIncidents: 0,
    reopenedIncidents: 0,
    closedIncidents: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Grid Operations Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Regional Dispatch Desk • UEDCL Kigezi Network Operations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchMetrics}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('reports-queue')}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Triage Reports ({m.unverifiedReports})</span>
          </button>
          <button
            onClick={() => onNavigate('incidents')}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            <Layers className="w-4 h-4" />
            <span>Work Orders ({m.openIncidents + m.inProgressIncidents})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Unverified Reports */}
        <div 
          onClick={() => onNavigate('reports-queue')}
          className="bg-white rounded-2xl border border-amber-200 p-3 sm:p-4 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Pending Triage</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {m.unverifiedReports}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">New citizen reports</span>
        </div>

        {/* Emergency Hazards */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="bg-white rounded-2xl border border-red-200 p-4 shadow-xs hover:border-red-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Emergency</span>
            <Flame className="w-4 h-4 text-red-600 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 mt-2">
            {m.emergencyIncidents}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">High risk hazards</span>
        </div>

        {/* Active Work Orders */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>In Progress</span>
            <Wrench className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
            {m.inProgressIncidents}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Field crews on site</span>
        </div>

        {/* Resolution Pending */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Pending Verify</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {m.resolutionPendingIncidents}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Awaiting citizen check</span>
        </div>

        {/* Reopened Incidents */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Reopened</span>
            <RotateCcw className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {m.reopenedIncidents}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Citizen disputed</span>
        </div>

        {/* Restored & Closed */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Closed</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-700 mt-2">
            {m.closedIncidents}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Restored faults</span>
        </div>
      </div>

      {/* Main Grid: Technicians & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field Technician Deployment Board */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Field Technician Workload &amp; Availability
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {data?.workloadByEngineer?.length || 0} Technicians Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.workloadByEngineer?.map((eng: any) => (
              <div
                key={eng.engineerId}
                className="py-3.5 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-200">
                    {eng.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {eng.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{eng.phone}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">{eng.completedJobs} completed jobs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">
                      {eng.activeJobs} Active Work Orders
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        eng.activeJobs === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : eng.activeJobs > 2
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {eng.activeJobs === 0 ? 'AVAILABLE FOR DISPATCH' : 'DEPLOYED ON JOB'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fault Category Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Incident Distribution by Hazard
          </h2>

          <div className="space-y-3">
            {data?.categoryCounts?.map((cat: any) => {
              const isDanger = cat.hazardLevel === 'LIFE_THREATENING' || cat.hazardLevel === 'HIGH';
              return (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isDanger ? 'bg-red-500' : 'bg-amber-400'}`} />
                      {cat.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{cat.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isDanger ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{
                        width: `${Math.min(100, (cat.count / (m.totalReports || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('map')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Launch Live GIS Heatmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Operational Audit Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Live System Audit Log &amp; Event Stream
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Recent 10 State Changes</span>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recentHistory?.map((hist: StatusHistory) => (
            <div
              key={hist.id}
              className="py-3 flex items-start justify-between gap-4 flex-wrap text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{hist.actorName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {hist.actorRole}
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <StatusBadge status={hist.newStatus} size="sm" />
                </div>
                {hist.reason && (
                  <p className="text-xs text-slate-600 mt-1 font-medium">{hist.reason}</p>
                )}
              </div>
              <time className="text-[11px] text-slate-400 font-mono">
                {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
