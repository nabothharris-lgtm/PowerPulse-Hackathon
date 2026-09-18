import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Info,
  CheckCircle2
} from 'lucide-react';

interface RegisterCommunityViewProps {
  onNavigate: (view: string) => void;
  onSuccess?: () => void;
}

export const RegisterCommunityView: React.FC<RegisterCommunityViewProps> = ({
  onNavigate,
  onSuccess
}) => {
  const { registerResident } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Kabale');
  const [subArea, setSubArea] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please provide your full name and phone number.');
      return;
    }
    if (password && password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await registerResident({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        district,
        subArea: subArea.trim() || undefined,
        password: password || 'demo1234'
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
            <Zap className="w-7 h-7 fill-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create your PowerPulse Community Account
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Use PowerPulse to report electricity problems, follow their progress in real-time, and confirm when service has been restored in your neighborhood.
          </p>
        </div>

        {/* Informational Policy Badge */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold">Public Registration Policy</p>
            <p>
              Community member registration is open to all residents in Greater Kigezi. Field technicians, dispatchers, and utility controllers are provisioned exclusively through authorized utility administration.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Registration notice</p>
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-name-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Florence Ainembabazi"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-phone-input"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+256 772 000 000"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
              </label>
              <div className="relative">
                <input
                  id="reg-email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="resident@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                District <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="reg-district-select"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
                >
                  <option value="Kabale">Kabale District</option>
                  <option value="Kisoro">Kisoro District</option>
                  <option value="Rukungiri">Rukungiri District</option>
                  <option value="Kanungu">Kanungu District</option>
                  <option value="Rubanda">Rubanda District</option>
                  <option value="Rukiga">Rukiga District</option>
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sub-county / Ward / Cell
              </label>
              <input
                id="reg-subarea-input"
                type="text"
                value={subArea}
                onChange={e => setSubArea(e.target.value)}
                placeholder="e.g. Central Ward, Kigongi"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-slate-50/50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="reg-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span>Creating your account...</span>
              ) : (
                <>
                  <span>Complete Community Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Already have an account?
          </p>
          <button
            id="reg-goto-login-btn"
            type="button"
            onClick={() => onNavigate('login')}
            className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
          >
            Sign in to your account
          </button>
        </div>
      </div>
    </div>
  );
};
