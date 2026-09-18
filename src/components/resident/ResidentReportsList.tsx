import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Report } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  Filter 
} from 'lucide-react';

interface ResidentReportsListProps {
  onNavigateNewReport: () => void;
  onSelectReport: (reportId: string) => void;
}

export const ResidentReportsList: React.FC<ResidentReportsListProps> = ({
  onNavigateNewReport,
  onSelectReport
}) => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadReports = async () => {
    setLoading(true);
    try {
      const { reports: allReports } = await api.reports.list();
      const userReports = allReports.filter(r => r.reporterId === currentUser?.id);
      setReports(userReports);
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.locationName.toLowerCase().includes(search.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Filed Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time status tracking for all power outages and hazards you have submitted
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateNewReport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by neighborhood, street, or problem..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="LINKED_TO_INCIDENT">Linked to Work Order</option>
            <option value="CLOSED">Restored &amp; Closed</option>
          </select>
        </div>
      </div>

      {/* List Output */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading your reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">No reports matched your filters</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new electricity problem report.
          </p>
          <button
            onClick={onNavigateNewReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-amber-400 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Submit Report
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={report.status} />
                    <span className="font-mono text-xs text-slate-400">
                      #{report.id.slice(-6)}
                    </span>
                    <span className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                      {report.categoryName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {report.locationName}, {report.district}
                    </span>
                    {report.landmark && (
                      <span className="text-slate-400">({report.landmark})</span>
                    )}
                  </p>

                  {report.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                      {report.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                    {report.incidentId && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        Dispatched
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-amber-100 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
