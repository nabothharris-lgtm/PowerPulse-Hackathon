import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  Phone,
  Flame,
  CloudLightning,
  CheckCircle2,
  ArrowLeft,
  LifeBuoy
} from 'lucide-react';

interface PublicSafetyViewProps {
  onNavigate: (view: string) => void;
}

export const PublicSafetyView: React.FC<PublicSafetyViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('guest')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Electrical Safety Guidelines
          </h1>
          <p className="text-sm text-slate-500">
            Greater Kigezi Distribution Territory • Emergency Life Protection Rules
          </p>
        </div>
      </div>

      {/* 15 Meter Rule Callout */}
      <div className="bg-gradient-to-br from-rose-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-rose-700/50 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          Critical Rule #1
        </div>
        <h2 className="text-xl sm:text-2xl font-black">
          Stay At Least 15 Meters (50 Feet) Clear of Any Downed Conductor
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          High-voltage lines that contact the ground or trees can energize the soil in concentric voltage gradients. Walking normally can cause fatal electric shock between your feet. If trapped near a wire, keep feet touching and bunny-hop away.
        </p>
      </div>

      {/* Safety Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="p-3 w-fit rounded-lg bg-amber-100 text-amber-800">
            <CloudLightning className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Heavy Rains & Storm Hazards</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            During heavy tropical storms in Kigezi hill terrains, tree branches frequently break power lines. Treat every fallen line as LIVE, even if power appears out in the vicinity. Never step into standing water near poles.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="p-3 w-fit rounded-lg bg-rose-100 text-rose-800">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Transformer Fires & Sparks</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Transformers contain dielectric cooling oils that combust under extreme short circuits. NEVER pour water on a transformer fire. Evacuate adjacent structures immediately and notify PowerPulse dispatchers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="p-3 w-fit rounded-lg bg-blue-100 text-blue-800">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Livestock & Fencing Hazards</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Corrugated iron roofs and wire fences conduct electricity over extensive distances if struck by an overhead wire. Ensure cattle and children stay away from metal fences during blackouts.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="p-3 w-fit rounded-lg bg-emerald-100 text-emerald-800">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Emergency Reporting Protocol</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Report high-hazard incidents immediately through PowerPulse community reporting or call the 24-hour toll-free emergency dispatch line at <strong>0800 285 285</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
