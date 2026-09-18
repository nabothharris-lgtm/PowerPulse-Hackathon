import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Building, 
  Phone, 
  Mail, 
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';

export const ManagerApplicationsView: React.FC = () => {
  const [applications, setApplications] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getApplications();
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleReview = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    let rejectionReason: string | undefined = undefined;
    if (decision === 'REJECT') {
      const promptReason = prompt('Please enter reason for rejecting application:');
      if (!promptReason) return;
      rejectionReason = promptReason;
    }

    setActionLoading(id);
    try {
      await api.admin.reviewApplication(id, decision, {
        teamId: 'team-uedcl-kbl-alpha',
        rejectionReason,
      });
      loadApplications();
    } catch (err: any) {
      alert('Review action failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Field Technician Applications
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
              {applications.length} Pending Approval
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ERA wireman license verification &amp; field technician service provisioning
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="p-2 self-start sm:self-auto rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          title="Refresh applications"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Loading engineer applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">All applications processed</h3>
          <p className="text-xs text-slate-500">
            No pending field technician onboarding applications at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      PENDING REVIEW
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{app.name}</h2>
                  <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {app.phone}
                    </span>
                    {app.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {app.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Area: {app.serviceArea || app.district || 'Kabale'}
                    </span>
                  </div>
                </div>

                {/* Review Actions */}
                <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                  <button
                    onClick={() => handleReview(app.id, 'REJECT')}
                    disabled={actionLoading === app.id}
                    className="px-3.5 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 inline mr-1" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleReview(app.id, 'APPROVE')}
                    disabled={actionLoading === app.id}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Grant Field Access</span>
                  </button>
                </div>
              </div>

              {/* License Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Electricity Regulatory Authority License:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {app.professionalId || 'ERA-CERT-PENDING'}
                  </span>
                </div>
                {app.applicationNotes && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Experience &amp; Certifications:</span>
                    <p className="text-slate-700 italic">&quot;{app.applicationNotes}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
