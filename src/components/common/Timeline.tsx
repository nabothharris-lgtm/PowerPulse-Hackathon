import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  Wrench, 
  RotateCcw, 
  ShieldCheck, 
  UserCheck, 
  ExternalLink 
} from 'lucide-react';
import { StatusHistory } from '../../types';

interface TimelineProps {
  history: StatusHistory[];
  title?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ history, title = 'Audit & Operational History' }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-500">
        No recorded status history yet.
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'VERIFIED':
      case 'ACCEPTED':
        return <UserCheck className="w-4 h-4 text-teal-600" />;
      case 'EN_ROUTE':
        return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'IN_PROGRESS':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      case 'RESOLUTION_PENDING':
      case 'RESOLVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'REOPENED':
        return <RotateCcw className="w-4 h-4 text-red-600" />;
      case 'CLOSED':
        return <CheckCircle2 className="w-4 h-4 text-slate-700" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          {title} ({sorted.length} events)
        </h4>
      )}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {sorted.map((item, index) => {
          const formattedDate = new Date(item.timestamp).toLocaleString('en-UG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={item.id || index} className="relative group">
              <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                {getIcon(item.newStatus)}
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{(item.newStatus || '').replace(/_/g, ' ') || 'Updated'}</span>
                    {item.previousStatus && item.previousStatus !== 'NONE' && (
                      <span className="text-slate-400">
                        (from {(item.previousStatus || '').replace(/_/g, ' ')})
                      </span>
                    )}
                  </div>
                  <time className="text-slate-400 font-mono text-[11px]">{formattedDate}</time>
                </div>
                {item.reason && (
                  <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                    {item.reason}
                  </p>
                )}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">{item.actorName}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                      {item.actorRole}
                    </span>
                  </span>
                  {item.evidenceUrl && (
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> View Evidence
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
