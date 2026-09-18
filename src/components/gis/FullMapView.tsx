import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { 
  MapPin, 
  Layers, 
  RefreshCw, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  Flame,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface FullMapViewProps {
  onSelectIncident?: (incidentId: string) => void;
  onSelectReport?: (reportId: string) => void;
}

export const FullMapView: React.FC<FullMapViewProps> = ({
  onSelectIncident,
  onSelectReport,
}) => {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ type: 'incident' | 'report'; item: any } | null>(null);

  const loadMapData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the open GIS map endpoint that aggregates markers without requiring authentication
      const mapRes = await api.dashboard.getMapPins();
      setIncidents(mapRes.incidents || []);
      setReports(mapRes.unlinkedReports || []);
    } catch (err: any) {
      console.error('Failed to load GIS data:', err);
      setError(err?.message || 'Failed to load GIS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const markers: any[] = [];

  if (showIncidents) {
    incidents.forEach(inc => {
      const isEmergency = inc.priority === 'EMERGENCY';
      const isResolved = inc.status === 'CLOSED' || inc.status === 'RESOLVED';
      markers.push({
        id: `inc-${inc.id}`,
        type: 'INCIDENT',
        latitude: inc.latitude,
        longitude: inc.longitude,
        title: `[WORK ORDER] ${inc.title || 'Power Issue'}`,
        categoryName: inc.categoryName || 'Outage',
        priority: inc.priority || 'NORMAL',
        status: inc.status || 'OPEN',
        locationName: inc.locationName || `${inc.district || 'Kabale'}`,
        description: `Status: ${inc.status || 'OPEN'} | Priority: ${inc.priority || 'NORMAL'} | Crew: ${inc.engineerName || 'Unassigned'}`,
        color: isEmergency ? '#dc2626' : isResolved ? '#16a34a' : '#f59e0b',
        affectedRadiusMeters: inc.affectedRadiusMeters || 300,
        engineerName: inc.engineerName,
        relatedReportsCount: inc.relatedReportsCount || inc.relatedReportIds?.length || 0,
      });
    });
  }

  if (showReports) {
    reports.forEach(rep => {
      markers.push({
        id: `rep-${rep.id}`,
        type: 'REPORT',
        latitude: rep.latitude,
        longitude: rep.longitude,
        title: `[CITIZEN REPORT] ${rep.categoryName || rep.title || 'Outage'}`,
        categoryName: rep.categoryName || 'Citizen Report',
        priority: rep.isSafetyCritical || rep.severity === 'SAFETY_CRITICAL' ? 'CRITICAL' : 'NORMAL',
        status: rep.status || 'SUBMITTED',
        locationName: rep.locationName || `${rep.district || 'Kabale'}`,
        description: `${rep.locationName} - Reported by ${rep.reporterName || 'Resident'}`,
        color: rep.isSafetyCritical || rep.severity === 'SAFETY_CRITICAL' ? '#ef4444' : '#f97316',
      });
    });
  }

  // Determine if current user can view full work order dossier
  const canAccessIncident = (inc: any) => {
    if (!currentUser) return false;
    const privilegedRoles = ['ADMIN', 'SYSTEM_ADMINISTRATOR', 'MANAGER', 'PROVIDER_MANAGER', 'VERIFIER'];
    if (privilegedRoles.includes(currentUser.role)) return true;
    if (currentUser.role === 'ENGINEER') {
      // Engineer can view if assigned or in same district
      if (currentUser.id === inc.engineerId) return true;
      if (!currentUser.district || !inc.district || currentUser.district.toLowerCase() === inc.district.toLowerCase()) return true;
    }
    return false;
  };

  const canAccessReport = (rep: any) => {
    if (!currentUser) return false;
    const privilegedRoles = ['ADMIN', 'SYSTEM_ADMINISTRATOR', 'MANAGER', 'PROVIDER_MANAGER', 'VERIFIER'];
    if (privilegedRoles.includes(currentUser.role)) return true;
    if (currentUser.id === rep.reporterId) return true;
    return false;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            Kigezi Feeder GIS &amp; Outage Heatmap
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial distribution of faults, work orders, and feeder coverage zones
          </p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={e => setShowIncidents(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <span>Work Orders ({incidents.length})</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showReports}
              onChange={e => setShowReports(e.target.checked)}
              className="w-4 h-4 text-orange-500 rounded"
            />
            <span>Pending Reports ({reports.length})</span>
          </label>

          <button
            onClick={loadMapData}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
            title="Refresh map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={loadMapData}
            className="font-bold underline hover:text-amber-950 cursor-pointer ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
        <InteractiveMap
          centerLat={-1.2505}
          centerLng={29.9895}
          zoom={13}
          heightClass="h-[380px] sm:h-[480px] lg:h-[580px]"
          markers={markers}
          onMarkerClick={marker => {
            const rawId = typeof marker === 'string' ? marker : (marker?.id || '');
            if (rawId.startsWith('inc-')) {
              const id = rawId.replace('inc-', '');
              const inc = incidents.find(i => i.id === id);
              if (inc) setSelectedItem({ type: 'incident', item: inc });
            } else if (rawId.startsWith('rep-')) {
              const id = rawId.replace('rep-', '');
              const rep = reports.find(r => r.id === id);
              if (rep) setSelectedItem({ type: 'report', item: rep });
            }
          }}
        />

        {/* Floating Pin Inspector */}
        {selectedItem && (
          <div className="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  selectedItem.type === 'incident' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}>
                  {selectedItem.type === 'incident' ? 'Work Order' : 'Citizen Report'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {selectedItem.item.district || 'Kabale'}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1">
              {selectedItem.item.title || selectedItem.item.categoryName || 'Grid Outage'}
            </h3>
            <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{selectedItem.item.locationName}</span>
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Status</span>
                <span className="font-bold text-slate-800">
                  {(selectedItem.item.status || 'OPEN').replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Priority</span>
                <span className={`font-bold ${
                  selectedItem.item.priority === 'EMERGENCY' ? 'text-red-600' : 'text-slate-800'
                }`}>
                  {selectedItem.item.priority || 'NORMAL'}
                </span>
              </div>
              {selectedItem.item.engineerName && (
                <div className="col-span-2 border-t border-slate-200/60 pt-1.5 mt-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Dispatched Crew</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Wrench className="w-2.5 h-2.5 text-blue-600" />
                    {selectedItem.item.engineerName}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-1">
              {selectedItem.type === 'incident' && canAccessIncident(selectedItem.item) && onSelectIncident && (
                <button
                  onClick={() => onSelectIncident(selectedItem.item.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Open Work Order Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {selectedItem.type === 'report' && canAccessReport(selectedItem.item) && onSelectReport && (
                <button
                  onClick={() => onSelectReport(selectedItem.item.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Open Report Status</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {/* Read-only notification badge for guests or non-operational roles */}
              {((selectedItem.type === 'incident' && !canAccessIncident(selectedItem.item)) ||
                (selectedItem.type === 'report' && !canAccessReport(selectedItem.item))) && (
                <div className="text-[10px] text-slate-500 bg-slate-100 rounded-lg p-1.5 text-center font-medium">
                  Public Outage Telemetry • High Voltage Safety Radius Protected
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
