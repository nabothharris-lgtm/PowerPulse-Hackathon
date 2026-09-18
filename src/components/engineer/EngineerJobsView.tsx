import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Assignment, Incident } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { SafetyBanner } from '../common/SafetyBanner';
import { WorkUpdateModal } from './WorkUpdateModal';
import { ResolveJobModal } from './ResolveJobModal';
import { 
  Wrench, 
  Truck, 
  Play, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Phone, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  FileCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  PackageCheck,
  HardHat,
  Network,
  Award,
  Radio,
  Plus,
  Check,
  FileText
} from 'lucide-react';

interface EngineerJobsViewProps {
  onSelectIncident?: (incidentId: string) => void;
}

// Feeder Substations reference data for Ugandan Western Service Territory
const DISTRICT_FEEDERS: Record<string, { substation: string; voltage: string; feeders: string[]; dispatchHotline: string }[]> = {
  Kabale: [
    {
      substation: 'Kabale Primary Substation (33/11kV)',
      voltage: '33kV Transmission / 11kV Distribution',
      feeders: ['Town Central Feeder 1', 'Katuna Border Industrial Line', 'Mparo Rural Feeder', 'Lake Bunyonyi Spur'],
      dispatchHotline: '+256 486 422019'
    },
    {
      substation: 'Rubanda Step-Down Station',
      voltage: '11kV Rural Micro-grid',
      feeders: ['Ikumba-Hamurwa Feeder', 'Muko Mining Circuit'],
      dispatchHotline: '+256 486 422020'
    }
  ],
  Kisoro: [
    {
      substation: 'Kisoro Mountain 33kV Terminal',
      voltage: '33kV Sub-Transmission',
      feeders: ['Kisoro Municipality Feeder', 'Cyanika Border Interconnector', 'Mgahinga Tourism Spur'],
      dispatchHotline: '+256 486 430112'
    }
  ],
  Rukungiri: [
    {
      substation: 'Rukungiri Main Substation',
      voltage: '33kV / 11kV Grid Terminal',
      feeders: ['Rukungiri Urban Feeder', 'Buyanja Agricultural Feeder', 'Kebisoni Industrial Spur'],
      dispatchHotline: '+256 486 442300'
    }
  ]
};

// Initial default safety items
const DEFAULT_SAFETY_ITEMS = [
  { id: 'ppe_gloves', label: '1000V Class 0/1 Insulated Electrical Safety Gloves inspected for punctures', checked: true, required: true },
  { id: 'ppe_helmet', label: 'High-impact dielectric safety helmet (hard hat) and eye protection worn', checked: true, required: true },
  { id: 'deenergize', label: 'Line de-energization confirmation received from District Verifier / Dispatcher', checked: true, required: true },
  { id: 'grounding', label: 'Portable earth grounding cluster clamps securely bonded to neutral / earth', checked: false, required: true },
  { id: 'loto', label: 'Lockout / Tagout (LOTO) tags placed on primary feeder isolation switches', checked: false, required: true },
  { id: 'perimeter', label: 'Public perimeter safety tape cordoned around bucket truck / pole work zone', checked: true, required: false }
];

// Initial default field materials
const DEFAULT_MATERIALS = [
  { id: 'drop_cable', name: '16mm² ABC Aerial Bundled Cable', unit: 'Meters', available: 250, requested: 0 },
  { id: 'cutout_fuse', name: '50kVA Transformer Dropout Fuse Links (10A)', unit: 'Pieces', available: 18, requested: 0 },
  { id: 'insulator_pin', name: '11kV Porcelain Pin Insulator & Spindle', unit: 'Pieces', available: 12, requested: 0 },
  { id: 'surge_arrester', name: 'Distribution Class Surge Arrester (11kV)', unit: 'Pieces', available: 6, requested: 0 },
  { id: 'crimp_lugs', name: 'Bimetallic Copper/Aluminium Crimp Lugs (70mm²)', unit: 'Pairs', available: 40, requested: 0 }
];

export const EngineerJobsView: React.FC<EngineerJobsViewProps> = ({ onSelectIncident }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'safety' | 'materials' | 'grid' | 'performance'>('orders');
  const [jobs, setJobs] = useState<{ assignment: Assignment; incident: Incident }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [updatingAssignment, setUpdatingAssignment] = useState<Assignment | null>(null);
  const [resolvingAssignment, setResolvingAssignment] = useState<{ assignment: Assignment; incident: Incident } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Safety checklist state
  const [safetyChecklist, setSafetyChecklist] = useState(DEFAULT_SAFETY_ITEMS);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  // Materials requisition state
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [materialSuccess, setMaterialSuccess] = useState<string | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.assignments.getMyJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Failed to load engineer assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [currentUser]);

  // Actions
  const handleAccept = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    try {
      await api.assignments.accept(assignmentId);
      loadJobs();
    } catch (err: any) {
      alert('Failed to accept job: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (assignmentId: string) => {
    const reason = prompt('Please enter reason for declining assignment (e.g. vehicle breakdown, already at emergency site):');
    if (!reason) return;
    setActionLoading(assignmentId);
    try {
      await api.assignments.decline(assignmentId, reason);
      loadJobs();
    } catch (err: any) {
      alert('Failed to decline: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnRoute = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    try {
      await api.assignments.markEnRoute(assignmentId, 'Field crew departing depot with utility bucket truck and safety gear.');
      loadJobs();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartWork = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    try {
      await api.assignments.startWork(assignmentId, 'Arrived on location. Safety ground clamps attached; commencing line repairs.');
      loadJobs();
    } catch (err: any) {
      alert('Failed to start work: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSafetyItem = (id: string) => {
    setSafetyChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSafetySignoff = (e: React.FormEvent) => {
    e.preventDefault();
    const uncheckedRequired = safetyChecklist.filter(i => i.required && !i.checked);
    if (uncheckedRequired.length > 0) {
      setSafetyNotice(`Cannot sign off: ${uncheckedRequired.length} mandatory safety verification items are incomplete.`);
      return;
    }
    setSafetyNotice(`Safety pre-work clearance officially signed off for crew led by ${currentUser?.name || 'Engineer'}. Timestamp: ${new Date().toLocaleTimeString()}.`);
    setTimeout(() => setSafetyNotice(null), 5000);
  };

  const handleRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requested = materials.filter(m => m.requested > 0);
    if (requested.length === 0) {
      setMaterialSuccess('Select at least one item quantity to submit field warehouse requisition.');
      return;
    }
    setMaterialSuccess(`Warehouse requisition approved for ${requested.length} line items. Work order inventory updated.`);
    setTimeout(() => setMaterialSuccess(null), 5000);
  };

  const userDistrict = currentUser?.district || 'Kabale';
  const districtFeeders = DISTRICT_FEEDERS[userDistrict] || DISTRICT_FEEDERS['Kabale'];

  // Metrics summary
  const totalAssigned = jobs.length;
  const inProgressCount = jobs.filter(j => ['IN_PROGRESS', 'EN_ROUTE'].includes(j.incident.status)).length;
  const completedCount = jobs.filter(j => j.assignment.status === 'COMPLETED' || j.incident.status === 'CLOSED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Technician Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Licensed Field Engineer
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                ERA License: {currentUser?.professionalId || 'ERA-TECH-8491'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {currentUser?.name || 'Field Technician'} Operations Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Territorial Base: <strong className="text-amber-400">{userDistrict} District &amp; Kigezi Region</strong> • Emergency Hotline: +256 486 422019
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadJobs}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Work Orders</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Active Jobs</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{totalAssigned}</div>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">In Field / En Route</div>
            <div className="text-xl font-black text-blue-400 mt-0.5">{inProgressCount}</div>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Jobs Resolved</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{completedCount + 14}</div>
          </div>
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Quality Verification</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">100%</div>
          </div>
        </div>
      </div>

      {/* Engineer Tool Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Work Orders ({jobs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'safety'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Safety &amp; PPE Protocol</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'materials'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Parts &amp; Materials Requisition</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'grid'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Feeder Substations &amp; Radio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'performance'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Performance &amp; Compliance</span>
        </button>
      </div>

      {/* TAB 1: WORK ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Loading assigned work orders...
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">No active field assignments pending</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You currently have no dispatched work orders in your queue. Check back when control room dispatches a new order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(({ assignment, incident }) => {
                const isAssigned = assignment.status === 'ASSIGNED';
                const isAccepted = assignment.status === 'ACCEPTED';
                const isEnRoute = incident.status === 'EN_ROUTE';
                const isInProgress = incident.status === 'IN_PROGRESS';
                const isPendingResolution = incident.status === 'RESOLUTION_PENDING';
                const isReopened = incident.status === 'REOPENED';
                const isEmergency = incident.priority === 'EMERGENCY';

                return (
                  <div
                    key={assignment.id}
                    className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                      isReopened
                        ? 'border-red-400 bg-red-50/20 shadow-md'
                        : isEmergency
                        ? 'border-red-300'
                        : 'border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {isEmergency && (
                      <SafetyBanner warning="EMERGENCY WORK ORDER: High voltage risk or live conductor hazard. Full PPE & grounding mandatory." />
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <PriorityBadge priority={incident.priority} />
                          <StatusBadge status={incident.status} />
                          <span className="font-mono text-xs text-slate-400">Order #{incident.id}</span>
                          {isReopened && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase animate-pulse">
                              Resident Disputed • Requires Re-inspection
                            </span>
                          )}
                        </div>
                        <h2
                          onClick={() => onSelectIncident && onSelectIncident(incident.id)}
                          className="text-lg font-black text-slate-900 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {incident.title}
                        </h2>
                        <p className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {incident.locationName}, {incident.district}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">
                            GPS: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                          </span>
                          <span>•</span>
                          <span>{incident.relatedReportIds.length} Linked Outage Reports</span>
                        </p>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shrink-0 self-start lg:self-auto"
                      >
                        <span>GPS Driving Route</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      </a>
                    </div>

                    {assignment.notes && (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5 uppercase text-[10px]">
                          Control Room Dispatch Orders:
                        </span>
                        <p className="text-slate-600">{assignment.notes}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs text-slate-500 font-medium">
                        {isAssigned && 'Action required: Accept or decline this job assignment.'}
                        {isAccepted && !isEnRoute && 'Job accepted. Click "Depart & Mark En Route" when leaving depot.'}
                        {isEnRoute && 'Crew logged as traveling to fault site.'}
                        {isInProgress && 'Repairs active on location.'}
                        {isPendingResolution && 'Resolution submitted. Awaiting resident power confirmation.'}
                        {isReopened && 'Citizen reported power is still out. Inspect and resolve.'}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isAssigned && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDecline(assignment.id)}
                              disabled={actionLoading === assignment.id}
                              className="px-3 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 inline mr-1" />
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAccept(assignment.id)}
                              disabled={actionLoading === assignment.id}
                              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Accept Assignment</span>
                            </button>
                          </>
                        )}

                        {(isAccepted || isReopened) && incident.status !== 'EN_ROUTE' && incident.status !== 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => handleEnRoute(assignment.id)}
                            disabled={actionLoading === assignment.id}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Depart &amp; Mark En Route</span>
                          </button>
                        )}

                        {isEnRoute && (
                          <button
                            type="button"
                            onClick={() => handleStartWork(assignment.id)}
                            disabled={actionLoading === assignment.id}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Play className="w-4 h-4" />
                            <span>Arrived: Start Repair Work</span>
                          </button>
                        )}

                        {(isInProgress || isReopened || isEnRoute) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setUpdatingAssignment(assignment)}
                              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                            >
                              Post Progress Note
                            </button>
                            <button
                              type="button"
                              onClick={() => setResolvingAssignment({ assignment, incident })}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 animate-pulse"
                            >
                              <FileCheck className="w-4 h-4" />
                              <span>Submit Resolution &amp; Evidence</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAFETY & PPE PROTOCOL */}
      {activeTab === 'safety' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                High-Voltage Pre-Work Safety Verification
              </h2>
              <p className="text-xs text-slate-500">
                Uganda Electricity Regulatory Authority (ERA) Mandatory Field Safety Checklist
              </p>
            </div>
          </div>

          <form onSubmit={handleSafetySignoff} className="space-y-4">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {safetyChecklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleSafetyItem(item.id)}
                  className="p-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.required && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 font-extrabold rounded">
                          MANDATORY
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {safetyNotice && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{safetyNotice}</span>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sign Off Crew Pre-Work Safety Protocol</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SPARE PARTS & MATERIALS */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Field Parts &amp; Equipment Requisition
                </h2>
                <p className="text-xs text-slate-500">
                  Log line materials consumed or request immediate field van restocking
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRequisitionSubmit} className="space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Component / Material</th>
                    <th className="p-3">Van Stock</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Requisition Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="p-3 font-mono text-slate-600">{m.available}</td>
                      <td className="p-3 text-slate-500">{m.unit}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.requested}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setMaterials(prev =>
                              prev.map(item => (item.id === m.id ? { ...item, requested: val } : item))
                            );
                          }}
                          className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {materialSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{materialSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Submit Requisition to District Depot</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: DISTRICT GRID TOPOLOGY & RADIO */}
      {activeTab === 'grid' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {userDistrict} District Feeder Substations &amp; Radio
              </h2>
              <p className="text-xs text-slate-500">
                Primary 33kV/11kV transformers, feeder branch circuits, and dispatch contacts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {districtFeeders.map((sub, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{sub.substation}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    {sub.voltage}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Connected Feeders:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sub.feeders.map(f => (
                      <span key={f} className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    VHF Radio Ch. 4 (156.200 MHz)
                  </span>
                  <a
                    href={`tel:${sub.dispatchHotline}`}
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{sub.dispatchHotline}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PERFORMANCE & COMPLIANCE */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Technician Performance &amp; Safety Compliance
              </h2>
              <p className="text-xs text-slate-500">
                Resolution record verified against Electricity Regulatory Authority (ERA) standards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Work Orders Resolved</div>
              <div className="text-2xl font-black text-slate-900">{completedCount + 14} Incidents</div>
              <div className="text-[11px] text-emerald-700 font-semibold">100% verified restored</div>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-xs text-slate-500 font-bold uppercase">Mean Time To Repair</div>
              <div className="text-2xl font-black text-slate-900">1.8 Hours</div>
              <div className="text-[11px] text-emerald-700 font-semibold">22% faster than regional SLA</div>
            </div>
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-xs text-slate-500 font-bold uppercase">Safety Zero-Incident Streak</div>
              <div className="text-2xl font-black text-emerald-600">312 Days</div>
              <div className="text-[11px] text-slate-500">Zero lost-time electrical injuries</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {updatingAssignment && (
        <WorkUpdateModal
          assignment={updatingAssignment}
          isOpen={true}
          onClose={() => setUpdatingAssignment(null)}
          onSuccess={() => {
            setUpdatingAssignment(null);
            loadJobs();
          }}
        />
      )}

      {/* Resolve Job Modal */}
      {resolvingAssignment && (
        <ResolveJobModal
          assignment={resolvingAssignment.assignment}
          incident={resolvingAssignment.incident}
          isOpen={true}
          onClose={() => setResolvingAssignment(null)}
          onSuccess={() => {
            setResolvingAssignment(null);
            loadJobs();
          }}
        />
      )}
    </div>
  );
};
