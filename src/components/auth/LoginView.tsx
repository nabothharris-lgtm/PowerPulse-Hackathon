import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound
} from 'lucide-react';

interface LoginViewProps {
  onNavigate: (view: string) => void;
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your phone number or email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      if (onSuccess) onSuccess();
      // Role-based routing is handled by App.tsx when currentUser updates
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your phone/email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (demoIdentifier: string, label: string) => {
    setIdentifier(demoIdentifier);
    setPassword('demo1234');
    setError(null);
    setLoading(true);
    try {
      await login(demoIdentifier, 'demo1234');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to sign in as ${label}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
            <Zap className="w-8 h-8 fill-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-500">
            Sign in to PowerPulse Uganda operational network
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Sign in failed</p>
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {forgotMsg && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{forgotMsg}</span>
          </div>
        )}

        {/* Real Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Phone Number or Email
            </label>
            <div className="relative">
              <input
                id="login-identifier-input"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="+256 7... or user@powerpulse.demo"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-slate-50/50"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotMsg('If your account exists, password recovery instructions have been recorded. For demo accounts, use password "demo1234".')}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-slate-50/50"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Community Registration Link */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Resident or Community Member without an account?
          </p>
          <button
            id="login-goto-register-btn"
            type="button"
            onClick={() => onNavigate('register')}
            className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
          >
            Create Community Account
          </button>
        </div>

        {/* Demo Credentials Section for Evaluators */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Evaluation Demo Accounts (One-Click)
            </span>
            <span className="text-[10px] font-medium text-slate-400">Pass: demo1234</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              id="demo-fill-resident"
              type="button"
              disabled={loading}
              onClick={() => handleQuickFill('resident@powerpulse.demo', 'Florence (Resident)')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900">Florence Ainembabazi</p>
                <p className="text-[11px] text-slate-500">Resident • Kabale</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Resident
              </span>
            </button>

            <button
              id="demo-fill-verifier"
              type="button"
              disabled={loading}
              onClick={() => handleQuickFill('ops@powerpulse.demo', 'Sarah (Verifier)')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900">Sarah Tumusiime</p>
                <p className="text-[11px] text-slate-500">Dispatcher • Kabale</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                Verifier
              </span>
            </button>

            <button
              id="demo-fill-engineer"
              type="button"
              disabled={loading}
              onClick={() => handleQuickFill('engineer@powerpulse.demo', 'David (Engineer)')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900">Eng. David Kigozi</p>
                <p className="text-[11px] text-slate-500">Technician • Team Alpha</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                Engineer
              </span>
            </button>

            <button
              id="demo-fill-manager"
              type="button"
              disabled={loading}
              onClick={() => handleQuickFill('manager@powerpulse.demo', 'Arthur (Manager)')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900">Arthur Byamukama</p>
                <p className="text-[11px] text-slate-500">Manager • UEDCL Kigezi</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                Manager
              </span>
            </button>

            <button
              id="demo-fill-admin"
              type="button"
              disabled={loading}
              onClick={() => handleQuickFill('admin@powerpulse.demo', 'Emmanuel (Admin)')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-colors flex items-center justify-between sm:col-span-2"
            >
              <div>
                <p className="font-bold text-slate-900">Emmanuel Twinomujuni</p>
                <p className="text-[11px] text-slate-500">System Administrator • Global Platform</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                System Admin
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
