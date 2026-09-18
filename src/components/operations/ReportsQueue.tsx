import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Report } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ReportTriageModal } from './ReportTriageModal';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface ReportsQueueProps {
  onSelectReport?: (reportId: string) => void;
  onSelectIncident?: (incidentId: string) => void;
}

export const ReportsQueue: React.FC<ReportsQueueProps> = ({
  onSelectReport,
  onSelectIncident,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Triage modal state
  const [selectedTriageReport, setSelectedTriageReport] = useState<Report | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.reports.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        district: districtFilter === 'ALL' ? undefined : districtFilter,
        search: search.trim() || undefined,
      });
      setReports(res.reports);
    } catch (err) {
      console.error('Failed to load reports queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, districtFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Incoming Reports Queue
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {reports.length} Reports
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Citizen fault stream triage, verification, deduplication, and work order grouping
          </p>
        </div>

        <button
          onClick={loadReports}
          className="p-2 self-start sm:self-auto rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reports by location, citizen name, phone, or keyword..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-[140px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Pending Verification (Submitted)</option>
            <option value="NEEDS_INFORMATION">Needs Information</option>
            <option value="VERIFIED">Verified (Unlinked)</option>
            <option value="LINKED_TO_INCIDENT">Linked to Work Order</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-[110px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Districts</option>
            <option value="Kabale">Kabale</option>
            <option value="Kisoro">Kisoro</option>
            <option value="Rukungiri">Rukungiri</option>
            <option value="Kanungu">Kanungu</option>
            <option value="Rubanda">Rubanda</option>
          </select>
        </div>
      </div>

      {/* Reports Table / Card List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading reports queue...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No reports found</h3>
          <p className="text-xs text-slate-500">
            There are currently no reports matching this filter criteria in the triage queue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const isSubmitted = report.status === 'SUBMITTED';
            const isDanger = report.categoryName.toLowerCase().includes('wire') || report.categoryName.toLowerCase().includes('fallen');

            return (
              <div
                key={report.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  isDanger
                    ? 'border-red-300 bg-red-50/20'
                    : isSubmitted
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={report.status} />
                      <span className="font-mono text-xs text-slate-400">#{report.id.slice(-6)}</span>
                      <span className="font-bold text-sm text-slate-900">
                        {report.categoryName}
                      </span>
                      {isDanger && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                          <Flame className="w-3 h-3" /> Urgent Hazard
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {report.locationName}, {report.district}
                      </span>
                      {report.landmark && (
                        <span className="text-slate-500">Landmark: {report.landmark}</span>
                      )}
                      <span>•</span>
                      <span className="text-slate-500">
                        Reporter: <strong className="text-slate-700">{report.reporterName}</strong> ({report.reporterPhone})
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    {/* Triage Button: Open Modal for Verification & Incident creation */}
                    <button
                      onClick={() => setSelectedTriageReport(report)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isSubmitted
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isSubmitted ? 'Triage & Group' : 'Review & Group'}</span>
                    </button>

                    {report.incidentId && onSelectIncident && (
                      <button
                        onClick={() => onSelectIncident(report.incidentId!)}
                        className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="View linked incident"
                      >
                        <span>Incident &rarr;</span>
                      </button>
                    )}

                    {onSelectReport && (
                      <button
                        onClick={() => onSelectReport(report.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Triage Modal */}
      {selectedTriageReport && (
        <ReportTriageModal
          report={selectedTriageReport}
          isOpen={true}
          onClose={() => setSelectedTriageReport(null)}
          onActionComplete={() => {
            setSelectedTriageReport(null);
            loadReports();
          }}
          onNavigateToIncident={incidentId => {
            setSelectedTriageReport(null);
            if (onSelectIncident) onSelectIncident(incidentId);
          }}
        />
      )}
    </div>
  );
};
