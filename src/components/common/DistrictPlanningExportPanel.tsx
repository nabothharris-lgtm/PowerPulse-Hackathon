import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { SecureFileLock } from './SecureFileLock';
import { 
  Database, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  ShieldCheck, 
  Building2, 
  Table, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const DATASET_OPTIONS = [
  {
    id: 'district_planning',
    name: 'District Planning Master Summary',
    desc: 'Aggregate metrics by district for utility infrastructure planning, substation budgeting & MTTR benchmarking'
  },
  {
    id: 'incidents',
    name: 'Grid Incidents & Outages Dataset',
    desc: 'Full log of technical faults, severities, repair timestamps, engineer dispatches and customer resolution status'
  },
  {
    id: 'reports',
    name: 'Citizen Outage Reports (Privacy Protected)',
    desc: 'Field issue reports with PII privacy masking (names and phone numbers redacted for confidentiality)'
  },
  {
    id: 'personnel',
    name: 'Personnel & Field Performance Dataset',
    desc: 'District manager and field engineer assignments, resolution completion rate and operational status'
  }
];

const UGANDA_DISTRICTS = ['Kabale', 'Kisoro', 'Rukungiri', 'Kanungu', 'Ntungamo', 'Rubanda'];

export const DistrictPlanningExportPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const isGlobalAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SYSTEM_ADMINISTRATOR';
  
  const [selectedDataset, setSelectedDataset] = useState('district_planning');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    isGlobalAdmin ? 'ALL' : (currentUser?.district || 'Kabale')
  );
  const [dataPreview, setDataPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Fetch preview when dataset or district changes
  const loadPreview = async () => {
    setLoading(true);
    setExportNotice(null);
    try {
      const res = await api.export.getDataset(
        selectedDataset, 
        'json', 
        selectedDistrict === 'ALL' ? undefined : selectedDistrict
      );
      setDataPreview(res);
    } catch (err: any) {
      console.error('Failed to load dataset preview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [selectedDataset, selectedDistrict]);

  const handleDownload = async (format: 'csv' | 'json') => {
    setDownloading(true);
    try {
      if (format === 'csv') {
        const csvContent = await api.export.getDataset(
          selectedDataset, 
          'csv', 
          selectedDistrict === 'ALL' ? undefined : selectedDistrict
        ) as string;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `powerpulse_${selectedDataset}_${selectedDistrict}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify(dataPreview, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `powerpulse_${selectedDataset}_${selectedDistrict}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setExportNotice(`Successfully exported ${selectedDataset} dataset (${format.toUpperCase()}) for ${selectedDistrict} district.`);
    } catch (err: any) {
      setExportNotice(`Export failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            District Planning &amp; National Records Store
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            System Records &amp; Analytical Datasets
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Direct access to verified electrical grid metrics, outage history, and technical response logs.
            Structured for district local government planning, ERA utility audits, and NGO energy access research.
          </p>
        </div>
      </div>

      {/* Dataset Selection Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              1. Select Planning Dataset
            </h3>
            <div className="space-y-2">
              {DATASET_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDataset(opt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedDataset === opt.id
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{opt.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                2. District Scope
              </label>
              {isGlobalAdmin ? (
                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Districts (National Master Database)</option>
                  {UGANDA_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d} District</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{currentUser?.district || 'Kabale'} District</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Manager Scope</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                3. Export File Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => handleDownload('csv')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV (Excel)</span>
                </button>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => handleDownload('json')}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileJson className="w-4 h-4" />
                  <span>JSON File</span>
                </button>
              </div>
            </div>

            {exportNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Secure Preview Table with 3-Minute File Lock */}
        <div className="lg:col-span-2">
          <SecureFileLock
            title={`District Dataset: ${selectedDataset.toUpperCase()}`}
            documentId={`${selectedDistrict}-RECORDS-${new Date().toISOString().slice(0, 10)}`}
            timeoutSeconds={180}
          >
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-500" />
                    Live Record Store Preview
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Showing {dataPreview?.records?.length || 0} records • District: {selectedDistrict}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadPreview}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
                {loading ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    Querying records from storage...
                  </div>
                ) : !dataPreview?.records?.length ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No records found for the selected scope.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        {Object.keys(dataPreview.records[0] || {}).slice(0, 6).map(header => (
                          <th key={header} className="px-3 py-2.5 whitespace-nowrap uppercase tracking-wider text-[10px]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataPreview.records.slice(0, 15).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors font-mono text-[11px]">
                          {Object.keys(dataPreview.records[0] || {}).slice(0, 6).map(header => (
                            <td key={header} className="px-3 py-2 text-slate-800 max-w-xs truncate">
                              {typeof row[header] === 'boolean' ? (row[header] ? 'true' : 'false') : String(row[header] || '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Confidential Data Masking Active • Names &amp; Phones Anonymized</span>
                </div>
                <span>Government &amp; Utility Compliant</span>
              </div>
            </div>
          </SecureFileLock>
        </div>
      </div>
    </div>
  );
};
