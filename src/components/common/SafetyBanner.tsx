import React from 'react';
import { AlertOctagon, PhoneCall } from 'lucide-react';

interface SafetyBannerProps {
  warning?: string;
  categoryName?: string;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ warning, categoryName }) => {
  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-red-900 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="bg-red-600 text-white p-2 rounded-lg shrink-0 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="font-bold text-base text-red-950 uppercase tracking-wide">
              Critical Electrical Hazard Advisory
            </h4>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 text-xs font-bold">
              <PhoneCall className="w-3 h-3" /> Emergency Line: 0800 285 285
            </span>
          </div>
          <p className="mt-1 text-sm text-red-900 font-medium">
            {warning ||
              'Extreme electrical danger detected! Keep a minimum distance of 15 meters (50 feet). Do NOT touch any wires, fences, puddles, or metallic poles near the hazard.'}
          </p>
          {categoryName && (
            <p className="mt-1.5 text-xs text-red-800 font-semibold">
              Hazard: {categoryName} — Emergency dispatch protocol active.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
