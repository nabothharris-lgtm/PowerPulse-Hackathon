import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Wrench, 
  FileCheck, 
  RotateCcw, 
  XCircle, 
  Link2 
} from 'lucide-react';
import { ReportStatus, IncidentStatus } from '../../types';

interface StatusBadgeProps {
  status: ReportStatus | IncidentStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const safeStatus = typeof status === 'string' ? status : '';
  let label = safeStatus ? safeStatus.replace(/_/g, ' ') : 'Unknown';
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  switch (status) {
    case 'SUBMITTED':
      label = 'Submitted';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      break;
    case 'UNDER_REVIEW':
      label = 'Under Review';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = AlertCircle;
      break;
    case 'NEEDS_INFORMATION':
      label = 'Needs Info';
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
      Icon = AlertCircle;
      break;
    case 'VERIFIED':
      label = 'Verified';
      bgClass = 'bg-teal-50 text-teal-700 border-teal-200';
      Icon = CheckCircle2;
      break;
    case 'LINKED_TO_INCIDENT':
      label = 'Linked to Work Order';
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Link2;
      break;
    case 'REJECTED':
      label = 'Rejected';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = XCircle;
      break;
    case 'OPEN':
      label = 'Open';
      bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
      Icon = AlertCircle;
      break;
    case 'ASSIGNED':
      label = 'Assigned';
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Clock;
      break;
    case 'ACCEPTED':
      label = 'Accepted';
      bgClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      Icon = CheckCircle2;
      break;
    case 'EN_ROUTE':
      label = 'Crew En Route';
      bgClass = 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      Icon = Truck;
      break;
    case 'IN_PROGRESS':
      label = 'In Progress';
      bgClass = 'bg-blue-50 text-blue-800 border-blue-300';
      Icon = Wrench;
      break;
    case 'RESOLUTION_PENDING':
      label = 'Resolution Pending';
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      Icon = FileCheck;
      break;
    case 'RESOLVED':
      label = 'Resolved';
      bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      Icon = CheckCircle2;
      break;
    case 'REOPENED':
      label = 'Reopened (Disputed)';
      bgClass = 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse';
      Icon = RotateCcw;
      break;
    case 'CLOSED':
      label = 'Restored & Closed';
      bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
      Icon = CheckCircle2;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${bgClass} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
