import React from 'react';
import { Flame, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowDown } from 'lucide-react';
import { IncidentPriority } from '../../types';

interface PriorityBadgeProps {
  priority: IncidentPriority | string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  let label = priority;
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = ArrowDown;

  switch (priority) {
    case 'EMERGENCY':
      label = 'EMERGENCY';
      bgClass = 'bg-red-600 text-white border-red-700 font-bold shadow-sm animate-pulse';
      Icon = Flame;
      break;
    case 'CRITICAL':
      label = 'CRITICAL';
      bgClass = 'bg-orange-500 text-white border-orange-600 font-semibold';
      Icon = ShieldAlert;
      break;
    case 'HIGH':
      label = 'High Priority';
      bgClass = 'bg-amber-100 text-amber-900 border-amber-300 font-medium';
      Icon = AlertTriangle;
      break;
    case 'NORMAL':
      label = 'Normal Priority';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = ArrowUpRight;
      break;
    case 'LOW':
      label = 'Low Priority';
      bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = ArrowDown;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border whitespace-nowrap uppercase tracking-wider ${bgClass} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
