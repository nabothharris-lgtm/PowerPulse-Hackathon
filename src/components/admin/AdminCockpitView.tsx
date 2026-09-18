import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Category, UserRole, AccountStatus } from '../../types';
import { DistrictPlanningExportPanel } from '../common/DistrictPlanningExportPanel';
import { 
  ShieldCheck, 
  Users, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  CheckCircle2, 
  Lock,
  Layers,
  Sparkles,
  UserPlus,
  UserX,
  AlertCircle,
  MapPin,
  Building2,
  Database
} from 'lucide-react';

export const AdminCockpitView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cockpitTab, setCockpitTab] = useState<'rbac' | 'database'>('rbac');

  // New User Provisioning Modal
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provName, setProvName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provRole, setProvRole] = useState<UserRole>('ENGINEER');
  const [provDistrict, setProvDistrict] = useState('Kabale');
  const [provSubArea, setProvSubArea] = useState('');
  const [provSubmitting, setProvSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [usersRes, catsRes] = await Promise.all([
        api.admin.getUsers(),
        api.references.getCategories(),
      ]);
      setUsers(usersRes.users || []);
      setCategories(catsRes.categories || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setActionError(err.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    setActionError(null);
    try {
      await api.admin.updateUser(userId, { role });
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role');
    }
  };

  const handleUpdateStatus = async (userId: string, status: AccountStatus) => {
    setActionError(null);
    try {
      await api.admin.updateUser(userId, { status });
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user status');
    }
  };

  const handleDeactivateUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.name} (${user.role})? Their active operational privileges will be revoked immediately while preserving all historical work records.`)) {
      return;
    }
    setActionError(null);
    try {
      await api.admin.updateUser(user.id, { status: 'DEACTIVATED' });
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to deactivate user');
    }
  };

  const handleReactivateUser = async (user: User) => {
    setActionError(null);
    try {
      await api.admin.updateUser(user.id, { status: 'ACTIVE' });
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reactivate user');
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setProvSubmitting(true);
    try {
      await api.admin.createUser({
        name: provName.trim(),
        email: provEmail.trim(),
        phone: provPhone.trim(),
        role: provRole,
        district: provDistrict,
        subArea: provSubArea.trim() || undefined
      });
      setShowProvisionModal(false);
      setProvName('');
      setProvEmail('');
      setProvPhone('');
      setProvRole('ENGINEER');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to provision staff member');
    } finally {
      setProvSubmitting(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset entire PowerPulse database back to initial factory demo seed state? All test reports will be restored to default.')) {
      return;
    }
    setResetting(true);
    try {
      await api.admin.resetDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
      loadData();
      window.location.reload();
    } catch (err: any) {
      setActionError('Demo reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Platform Administration Cockpit
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-200">
              System Administrator Scope
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Role-Based Access Control, staff provisioning, territorial governance, and audit operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-provision-btn"
            onClick={() => setShowProvisionModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Provision Staff Member</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting Grid...' : 'Reset Golden Demo Data'}</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold">Administrative Policy Violation</p>
            <p>{actionError}</p>
          </div>
        </div>
      )}

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Demo database restored to default seed state! Refreshing platform...</span>
        </div>
      )}

      {/* Cockpit Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setCockpitTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            cockpitTab === 'rbac'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Provisioning &amp; Territorial RBAC</span>
        </button>
        <button
          type="button"
          onClick={() => setCockpitTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            cockpitTab === 'database'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>National Database Store &amp; District Planning Records</span>
        </button>
      </div>

      {cockpitTab === 'database' ? (
        <DistrictPlanningExportPanel />
      ) : (
        <>
          {/* Users & RBAC Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              User Identity, Territorial Scope &amp; RBAC Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Policy enforcement: 1 Verifier per district • 1 Provider Manager per district • 1 System Administrator
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{users.length} Total Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Contact</th>
                <th className="pb-3 font-semibold">District Scope</th>
                <th className="pb-3 font-semibold">Assigned Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{u.name}</span>
                      {u.role === 'ADMIN' && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    {u.email && <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>}
                  </td>
                  <td className="py-3 font-mono text-slate-600">{u.phone}</td>
                  <td className="py-3 text-slate-700 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {u.district || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3">
                    <select
                      id={`user-role-select-${u.id}`}
                      value={u.role}
                      onChange={e => handleUpdateRole(u.id, e.target.value as UserRole)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="RESIDENT">RESIDENT</option>
                      <option value="VERIFIER">VERIFIER</option>
                      <option value="ENGINEER">ENGINEER</option>
                      <option value="MANAGER">MANAGER (Provider Manager)</option>
                      <option value="ADMIN">ADMIN (System Administrator)</option>
                    </select>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : u.status === 'DEACTIVATED'
                          ? 'bg-slate-100 text-slate-600 border-slate-300'
                          : u.status === 'SUSPENDED'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {u.status === 'DEACTIVATED' ? (
                      <button
                        id={`reactivate-btn-${u.id}`}
                        onClick={() => handleReactivateUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors"
                      >
                        Reactivate
                      </button>
                    ) : u.role !== 'ADMIN' ? (
                      <button
                        id={`deactivate-btn-${u.id}`}
                        onClick={() => handleDeactivateUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 transition-colors"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Provision Staff Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <span>Provision Privileged Operational Account</span>
              </div>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Staff Full Name
                </label>
                <input
                  id="prov-name-input"
                  type="text"
                  required
                  value={provName}
                  onChange={e => setProvName(e.target.value)}
                  placeholder="e.g. Eng. Sarah Mukasa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Phone Number
                  </label>
                  <input
                    id="prov-phone-input"
                    type="tel"
                    required
                    value={provPhone}
                    onChange={e => setProvPhone(e.target.value)}
                    placeholder="+256 7..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Email Address
                  </label>
                  <input
                    id="prov-email-input"
                    type="email"
                    required
                    value={provEmail}
                    onChange={e => setProvEmail(e.target.value)}
                    placeholder="staff@powerpulse.demo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Operational Role
                  </label>
                  <select
                    id="prov-role-select"
                    value={provRole}
                    onChange={e => setProvRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
                  >
                    <option value="VERIFIER">Verifier / Dispatcher</option>
                    <option value="ENGINEER">Engineer / Technician</option>
                    <option value="MANAGER">Provider Manager</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Assigned District Scope
                  </label>
                  <select
                    id="prov-district-select"
                    value={provDistrict}
                    onChange={e => setProvDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
                  >
                    <option value="Kabale">Kabale District</option>
                    <option value="Kisoro">Kisoro District</option>
                    <option value="Rukungiri">Rukungiri District</option>
                    <option value="Kanungu">Kanungu District</option>
                    <option value="Rubanda">Rubanda District</option>
                    <option value="Rukiga">Rukiga District</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>Policy Enforcement Notice:</strong> Verifiers and Provider Managers are scoped strictly to one active official per district. Re-provisioning an active territory without deactivating the prior officer will trigger a duplicate conflict rejection.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="prov-submit-btn"
                  type="submit"
                  disabled={provSubmitting}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm disabled:opacity-50"
                >
                  {provSubmitting ? 'Provisioning...' : 'Confirm & Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Schema */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          Configured Incident Taxonomy &amp; Safety Protocols
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{cat.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    cat.hazardLevel === 'LIFE_THREATENING'
                      ? 'bg-red-600 text-white'
                      : cat.hazardLevel === 'HIGH'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {cat.hazardLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{cat.safetyWarning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
