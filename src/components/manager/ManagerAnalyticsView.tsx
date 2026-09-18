import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DistrictPlanningExportPanel } from '../common/DistrictPlanningExportPanel';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Flame,
  ShieldCheck,
  Zap,
  Database
} from 'lucide-react';

export const ManagerAnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'export'>('analytics');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.dashboard.getOperationsMetrics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
        Compiling grid analytics &amp; SLA benchmarks...
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Grid Reliability &amp; Outage Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key Performance Indicators, SAIDI / SAIFI Outage Benchmarks &amp; Resolution Rates
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Summary Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Grid Outage Analytics &amp; KPIs</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'export'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>District Planning Datasets &amp; Record Store</span>
        </button>
      </div>

      {activeTab === 'export' ? (
        <DistrictPlanningExportPanel />
      ) : (
        <>
          {/* 4 Big Benchmark Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Mean Time To Dispatch</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">18.4 min</div>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 24% faster than Q2 benchmark
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Mean Time To Repair (MTTR)</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">2.1 hrs</div>
          <span className="text-[11px] text-slate-500 font-medium">Standard LV feeder baseline</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Citizen Verification Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">92.8%</div>
          <span className="text-[11px] text-emerald-700 font-bold">Closed via citizen confirmation</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Dispute &amp; Reopen Rate</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600">7.2%</div>
          <span className="text-[11px] text-slate-500 font-medium">Secondary faults caught before closeout</span>
        </div>
      </div>

      {/* Charts / Distribution Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outage Causes */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Outage Frequency by Fault Category
          </h2>

          <div className="space-y-3">
            {data?.categoryCounts?.map((c: any) => (
              <div key={c.categoryId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span className="font-mono text-slate-600 font-bold">{c.count} Incidents</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (c.count / (m.totalReports || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Efficiency */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            Field Technician Performance
          </h2>

          <div className="divide-y divide-slate-100">
            {data?.workloadByEngineer?.map((eng: any) => (
              <div key={eng.engineerId} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{eng.name}</div>
                  <div className="text-[11px] text-slate-500">{eng.phone}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">{eng.completedJobs} Jobs Resolved</span>
                  <div className="text-[11px] text-emerald-700 font-semibold">100% Quality Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
