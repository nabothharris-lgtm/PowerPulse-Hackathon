import React, { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Activity,
  AlertTriangle,
  ArrowRight,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Users,
  Eye,
  LogIn,
  UserPlus,
  HelpCircle,
  X
} from 'lucide-react';

interface GuestLandingProps {
  onNavigate: (view: string) => void;
}

export const GuestLanding: React.FC<GuestLandingProps> = ({ onNavigate }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  // Requirement 3: Subtle registration/sign-in prompt after 5-7 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const dismissed = sessionStorage.getItem('pp_guest_prompt_dismissed');
    if (!dismissed) {
      timer = setTimeout(() => {
        setShowPrompt(true);
      }, 6000); // 6 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pp_guest_prompt_dismissed', 'true');
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-8 sm:p-12 shadow-xl border border-slate-700/60">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            PowerPulse Uganda • Western Distribution Network
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Report. Respond. Restore.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            PowerPulse connects Greater Kigezi communities directly with electrical distribution engineers and emergency dispatchers. Report outages, track field crew dispatches, and verify power restoration transparently.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button
              id="guest-hero-register-btn"
              onClick={() => onNavigate('register')}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-2.5 transition-all transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Create Community Account
            </button>

            <button
              id="guest-hero-signin-btn"
              onClick={() => onNavigate('login')}
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white border border-slate-600 font-semibold text-sm tracking-wide flex items-center gap-2 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              Sign In to Account
            </button>

            <button
              id="guest-hero-safety-btn"
              onClick={() => onNavigate('safety')}
              className="px-4 py-3 rounded-xl text-slate-300 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              Electrical Safety Guidelines
            </button>
          </div>
        </div>

        {/* Decorative Grid & Glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </section>

      {/* 3 Step Workflow */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How PowerPulse Coordinates Restoration</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            A three-tier operational pipeline connecting citizens with certified field electrical technicians.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Community Outage Reporting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Residents log neighborhood blackouts, fallen lines, or sparking transformers with precise coordinates and danger assessments.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Dispatcher Triage & Crew Dispatch</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Regional district verifiers cluster reports into master incidents, assign priority ratings, and dispatch rapid response linemen.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Citizen-Confirmed Restoration</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Technicians submit repair photographic evidence. The incident is not closed until affected community members verify lights are back on.
            </p>
          </div>
        </div>
      </section>

      {/* Public Safety Warning Box */}
      <section className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-bold text-rose-950">Immediate Life Safety Warnings</h3>
            <p className="text-sm text-rose-800 leading-relaxed">
              If you observe a fallen conductor, sparking transformer, or wire touching water:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-rose-900 pt-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Stay at least 15 meters (50 feet) away from fallen wires
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Never attempt to touch or move wires with wooden sticks
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Keep children and livestock clear of utility poles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Never pour water on an active electrical or transformer fire
              </li>
            </ul>
            <div className="pt-2 flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">24/7 National Emergency Hotline:</span>
              <span className="px-3 py-1 bg-white rounded-lg border border-rose-300 font-mono font-bold text-rose-900 text-sm">
                0800 285 285
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Coverage Districts */}
      <section className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Active Operational Service Areas</h3>
            <p className="text-xs text-slate-500">Greater Kigezi Distribution Territory (UEDCL)</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            Network Monitored
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="font-bold text-slate-900 text-sm">Kabale District</p>
            <p className="text-xs text-slate-500">Central, Kigongi, Rushoroza, Katuna</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="font-bold text-slate-900 text-sm">Kisoro District</p>
            <p className="text-xs text-slate-500">Town Council, Nyarusiza, Cyanika</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="font-bold text-slate-900 text-sm">Rukungiri District</p>
            <p className="text-xs text-slate-500">Municipality, Buyanja, Kebisoni</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="font-bold text-slate-900 text-sm">Kanungu District</p>
            <p className="text-xs text-slate-500">Kihihi, Butogota, Kanungu Town</p>
          </div>
        </div>
      </section>

      {/* Requirement 3: Guest Conversion Prompt Dialog */}
      {showPrompt && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border border-amber-500/40 relative">
            <button
              onClick={handleDismissPrompt}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Dismiss prompt"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">
                  Want to report an electricity problem or follow an existing report?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Join community members in Greater Kigezi to alert dispatchers or track ongoing restoration work.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <button
                id="prompt-register-btn"
                onClick={() => {
                  handleDismissPrompt();
                  onNavigate('register');
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Community Account
              </button>

              <button
                id="prompt-signin-btn"
                onClick={() => {
                  handleDismissPrompt();
                  onNavigate('login');
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                Sign In
              </button>

              <button
                id="prompt-dismiss-btn"
                onClick={handleDismissPrompt}
                className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
