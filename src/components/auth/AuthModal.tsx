import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap,
  Shield,
  Wrench,
  Users,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  User as UserIcon,
  MapPin,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building,
  KeyRound,
  X
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'LOGIN' | 'REGISTER_RESIDENT' | 'APPLY_ENGINEER';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN'
}) => {
  const { login, registerResident, applyEngineer, demoUsers, switchUser } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER_RESIDENT' | 'APPLY_ENGINEER'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Resident registration form state
  const [residentName, setResidentName] = useState('');
  const [residentPhone, setResidentPhone] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [residentDistrict, setResidentDistrict] = useState('Kabale');
  const [residentSubArea, setResidentSubArea] = useState('');
  const [residentPassword, setResidentPassword] = useState('');
  const [residentTerms, setResidentTerms] = useState(true);

  // Engineer application form state
  const [engName, setEngName] = useState('');
  const [engPhone, setEngPhone] = useState('');
  const [engEmail, setEngEmail] = useState('');
  const [engLicense, setEngLicense] = useState('');
  const [engOrg, setEngOrg] = useState('org-uedcl-kigezi');
  const [engServiceArea, setEngServiceArea] = useState('Kabale Municipality & Greater Kigezi');
  const [engNotes, setEngNotes] = useState('');
  const [engTerms, setEngTerms] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError('Please enter your phone number or email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName.trim() || !residentPhone.trim()) {
      setError('Please provide your full name and phone number.');
      return;
    }
    if (!residentTerms) {
      setError('Please agree to the service terms to continue.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await registerResident({
        name: residentName.trim(),
        phone: residentPhone.trim(),
        email: residentEmail.trim() || undefined,
        district: residentDistrict,
        subArea: residentSubArea.trim() || undefined,
        password: residentPassword
      });
      setSuccessMsg('Welcome! Your community member account is active.');
      if (onClose) setTimeout(onClose, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engName.trim() || !engPhone.trim() || !engLicense.trim()) {
      setError('Full name, phone number, and ERA/Utility wireman license number are required.');
      return;
    }
    if (!engTerms) {
      setError('Please certify that your professional credentials are valid.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await applyEngineer({
        name: engName.trim(),
        phone: engPhone.trim(),
        email: engEmail.trim() || undefined,
        professionalId: engLicense.trim(),
        organizationId: engOrg,
        serviceArea: engServiceArea.trim(),
        applicationNotes: engNotes.trim() || undefined
      });
      setSuccessMsg('Your field application has been submitted for management review!');
      if (onClose) setTimeout(onClose, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (userId: string) => {
    setError(null);
    setLoading(true);
    try {
      await switchUser(userId);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to switch persona.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="bg-slate-900 text-white p-6 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                PowerPulse
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase tracking-wider">
                  Uganda
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Coordinated Grid Incident &amp; Outage Resolution Platform
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl mt-4 border border-slate-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setError(null); }}
              className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('REGISTER_RESIDENT'); setError(null); }}
              className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'REGISTER_RESIDENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Resident Signup
            </button>
            <button
              type="button"
              onClick={() => { setMode('APPLY_ENGINEER'); setError(null); }}
              className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
                mode === 'APPLY_ENGINEER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Apply as Engineer
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'LOGIN' && (
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number or Email Address
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="+256 772 100 201 or resident@powerpulse.demo"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">
                      (Demo default: any / blank)
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to PowerPulse'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* One-Click Evaluation Personas */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Instant Evaluation Personas
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click to test any role
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {demoUsers.slice(0, 6).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickPersona(u.id)}
                      className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 group-hover:bg-amber-200 group-hover:text-amber-900">
                          {u.role}
                        </span>
                        {u.status === 'PENDING_APPROVAL' && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 rounded">
                            Pending
                          </span>
                        )}
                        {u.status === 'SUSPENDED' && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1 rounded">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {u.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: REGISTER AS COMMUNITY MEMBER */}
          {mode === 'REGISTER_RESIDENT' && (
            <div>
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Community Member Registration
                </p>
                <p className="text-emerald-700 text-[11px] leading-relaxed">
                  Public accounts are verified for neighborhood electricity outage reporting, safety hazard dispatch tracking, and restoration updates.
                </p>
              </div>

              <form onSubmit={handleRegisterResident} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={residentName}
                    onChange={e => setResidentName(e.target.value)}
                    placeholder="e.g. Florence Ainembabazi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={residentPhone}
                      onChange={e => setResidentPhone(e.target.value)}
                      placeholder="+256 772 000 000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (optional)
                    </label>
                    <input
                      type="email"
                      value={residentEmail}
                      onChange={e => setResidentEmail(e.target.value)}
                      placeholder="resident@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      District
                    </label>
                    <select
                      value={residentDistrict}
                      onChange={e => setResidentDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Kabale">Kabale</option>
                      <option value="Kisoro">Kisoro</option>
                      <option value="Rukungiri">Rukungiri</option>
                      <option value="Kanungu">Kanungu</option>
                      <option value="Rubanda">Rubanda</option>
                      <option value="Rukiga">Rukiga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sub-County / Area
                    </label>
                    <input
                      type="text"
                      value={residentSubArea}
                      onChange={e => setResidentSubArea(e.target.value)}
                      placeholder="e.g. Central Division / Kikungiri"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password (Optional for demo)
                  </label>
                  <input
                    type="password"
                    value={residentPassword}
                    onChange={e => setResidentPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-resident"
                    checked={residentTerms}
                    onChange={e => setResidentTerms(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="terms-resident" className="text-[11px] text-slate-600">
                    I confirm I am a resident in the service area and agree to report genuine grid hazards.
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Registering Account...' : 'Complete Resident Registration'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* MODE 3: APPLY AS FIELD ENGINEER */}
          {mode === 'APPLY_ENGINEER' && (
            <div>
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-950 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Professional Field Engineer Onboarding
                </p>
                <p className="text-blue-700 text-[11px] leading-relaxed">
                  Field engineer privileges are restricted to licensed technicians. Applications are placed in <strong>PENDING_APPROVAL</strong> state until validated against the ERA wireman registry by a Provider Manager.
                </p>
              </div>

              <form onSubmit={handleApplyEngineer} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={engName}
                      onChange={e => setEngName(e.target.value)}
                      placeholder="e.g. Apollo Katembeko"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={engPhone}
                      onChange={e => setEngPhone(e.target.value)}
                      placeholder="+256 782 000 000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={engEmail}
                      onChange={e => setEngEmail(e.target.value)}
                      placeholder="engineer@domain.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ERA Wireman License / ID *
                    </label>
                    <input
                      type="text"
                      value={engLicense}
                      onChange={e => setEngLicense(e.target.value)}
                      placeholder="e.g. ERA-CERT-2024-8819"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Distribution Utility / Org
                    </label>
                    <select
                      value={engOrg}
                      onChange={e => setEngOrg(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="org-uedcl-kigezi">UEDCL (Kigezi Sub-region)</option>
                      <option value="org-uedcl-kbl">UEDCL Kabale Station</option>
                      <option value="org-contractor">Approved Utility Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Service Area
                    </label>
                    <input
                      type="text"
                      value={engServiceArea}
                      onChange={e => setEngServiceArea(e.target.value)}
                      placeholder="e.g. Kabale Municipality & Rubanda"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Qualifications &amp; Experience Notes
                  </label>
                  <textarea
                    value={engNotes}
                    onChange={e => setEngNotes(e.target.value)}
                    rows={2}
                    placeholder="Briefly state your wireman class (Class A, B, C, Z), HV/LV certifications, and years of distribution network experience..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-engineer"
                    checked={engTerms}
                    onChange={e => setEngTerms(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms-engineer" className="text-[11px] text-slate-600">
                    I certify that I hold an active ERA electrical installation permit and agree to follow all safety isolation protocols.
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Submitting Application...' : 'Submit Application for Manager Review'}
                  <FileCheck className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
