import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Incident, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { DispatchModal } from './DispatchModal';
import { 
  Layers, 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Wrench, 
  Users, 
  RotateCcw, 
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface IncidentsListProps {
  onSelectIncident: (incidentId: string) => void;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({ onSelectIncident }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Quick Dispatch modal state
  const [dispatchIncident, setDispatchIncident] = useState<Incident | null>(null);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.incidents.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        district: districtFilter === 'ALL' ? undefined : districtFilter,
        search: search.trim() || undefined,
      });
      setIncidents(res.incidents);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [statusFilter, priorityFilter, districtFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIncidents();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Grid Incident Work Orders
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400">
              {incidents.length} Work Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational field dispatch, technician tracking, and resolution management
          </p>
        </div>

        <button
          onClick={loadIncidents}
          className="p-2 self-start sm:self-auto rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          title="Refresh incidents"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search work orders by title, location, or assigned engineer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open (Unassigned)</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="EN_ROUTE">Crew En Route</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLUTION_PENDING">Resolution Pending</option>
            <option value="REOPENED">Reopened (Disputed)</option>
            <option value="CLOSED">Restored &amp; Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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

      {/* Incidents List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No work orders match filter criteria</h3>
          <p className="text-xs text-slate-500">
            Adjust the filter dropdowns or create an incident from the Reports Queue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => {
            const isEmergency = inc.priority === 'EMERGENCY';
            const isReopened = inc.status === 'REOPENED';
            const isPendingResolution = inc.status === 'RESOLUTION_PENDING';
            const isUnassigned = !inc.assignedEngineerId;

            return (
              <div
                key={inc.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
                  isReopened
                    ? 'border-red-400 bg-red-50/20'
                    : isEmergency
                    ? 'border-red-300'
                    : 'border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={inc.priority} />
                      <StatusBadge status={inc.status} />
                      <span className="font-mono text-xs text-slate-400">#{inc.id}</span>
                      {isReopened && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase animate-pulse">
                          <RotateCcw className="w-3 h-3" /> Citizen Disputed
                        </span>
                      )}
                    </div>

                    <h2
                      onClick={() => onSelectIncident(inc.id)}
                      className="font-black text-base text-slate-900 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      {inc.title}
                    </h2>

                    <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {inc.locationName}, {inc.district}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        {inc.relatedReportIds.length} Linked Citizen Reports
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        Est. {inc.affectedCustomersEst || 40} Customers Affected
                      </span>
                    </div>

                    {/* Assigned Engineer Bar */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Technician:</span>
                      {inc.assignedEngineerName ? (
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {inc.assignedEngineerName}
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unassigned (Needs Dispatch)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    {isUnassigned && inc.status !== 'CLOSED' && (
                      <button
                        onClick={() => setDispatchIncident(inc)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Dispatch Crew</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectIncident(inc.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Inspect Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchIncident && (
        <DispatchModal
          incident={dispatchIncident}
          isOpen={true}
          onClose={() => setDispatchIncident(null)}
          onSuccess={() => {
            setDispatchIncident(null);
            loadIncidents();
          }}
        />
      )}
    </div>
  );
};
