import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  PlusCircle, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Wrench, 
  BarChart3, 
  Users, 
  Shield, 
  Layers, 
  CheckCircle2, 
  Clock,
  BookOpen,
  LogIn,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenAuth?: () => void;
  unreadReportsCount?: number;
  activeJobsCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  unreadReportsCount = 0,
  activeJobsCount = 0
}) => {
  const { currentUser } = useAuth();

  // GUEST NAVIGATION
  if (!currentUser) {
    const guestNav: NavItem[] = [
      { id: 'guest', label: 'Public Portal', icon: Home },
      { id: 'map', label: 'Live Outage Map', icon: MapPin },
      { id: 'safety', label: 'Public Electrical Safety', icon: BookOpen },
      { id: 'login', label: 'Staff & Citizen Login', icon: LogIn, highlight: true },
      { id: 'register', label: 'Community Registration', icon: UserPlus },
    ];

    return (
      <aside className="hidden md:block md:w-56 lg:w-64 bg-white border border-slate-200/80 rounded-2xl shrink-0 p-3.5 space-y-4 shadow-xs self-start sticky top-20">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
          Public Access
        </div>
        <nav className="space-y-1">
          {guestNav.map(item => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : item.highlight
                    ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-slate-100">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1 text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Emergency Notice
            </p>
            <p className="text-amber-800 leading-relaxed">
              Never touch fallen lines or submerged poles. Call toll-free 0800 185 186.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const role = currentUser.role;

  const residentNav: NavItem[] = [
    { id: 'home', label: 'Resident Home', icon: Home },
    { id: 'report', label: 'Report Power Issue', icon: PlusCircle, highlight: true },
    { id: 'reports', label: 'My Problem History', icon: FileText },
    { id: 'map', label: 'Live Outage Map', icon: MapPin },
    { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
    { id: 'account', label: 'My Account & Meter', icon: Users },
  ];

  const operationsNav: NavItem[] = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: BarChart3 },
    { 
      id: 'reports-queue', 
      label: 'Triage Reports Queue', 
      icon: AlertTriangle, 
      badge: unreadReportsCount > 0 ? unreadReportsCount : undefined 
    },
    { id: 'incidents', label: 'Incidents & Dispatch', icon: Layers },
    { id: 'map', label: 'GIS Operations Map', icon: MapPin },
    { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
  ];

  const engineerNav: NavItem[] = [
    { 
      id: 'jobs', 
      label: 'Assigned Work Orders', 
      icon: Wrench, 
      badge: activeJobsCount > 0 ? activeJobsCount : undefined,
      highlight: true
    },
    { id: 'map', label: 'Field Navigation Map', icon: MapPin },
    { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
  ];

  const managerNav: NavItem[] = [
    { id: 'dashboard', label: 'District Operations', icon: BarChart3 },
    { id: 'analytics', label: 'Reliability & SLA Metrics', icon: Clock },
    { id: 'incidents', label: 'Incident Work Orders', icon: Layers },
    { id: 'reports-queue', label: 'District Reports Stream', icon: FileText },
    { id: 'map', label: 'Regional Map', icon: MapPin },
    { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
  ];

  const adminNav: NavItem[] = [
    { id: 'admin', label: 'Admin & RBAC Cockpit', icon: Shield, highlight: true },
    { id: 'dashboard', label: 'System Overview', icon: BarChart3 },
    { id: 'incidents', label: 'All Incidents', icon: Layers },
    { id: 'reports-queue', label: 'All Reports Stream', icon: FileText },
    { id: 'map', label: 'GIS Grid Map', icon: MapPin },
    { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
  ];

  let navItems: NavItem[] = residentNav;
  if (role === 'VERIFIER') navItems = operationsNav;
  else if (role === 'ENGINEER') navItems = engineerNav;
  else if (role === 'MANAGER' || role === 'PROVIDER_MANAGER') navItems = managerNav;
  else if (role === 'ADMIN' || role === 'SYSTEM_ADMINISTRATOR') navItems = adminNav;

  return (
    <aside className="hidden md:block md:w-56 lg:w-64 bg-white border border-slate-200/80 rounded-2xl shrink-0 p-3.5 space-y-1 shadow-xs self-start sticky top-20">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
        {role === 'RESIDENT' ? 'Resident Portal' : `${role.replace('_', ' ')} Portal`}
      </div>
      <nav className="space-y-1">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : item.highlight
                  ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-red-600 text-white animate-pulse'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Helper card */}
      <div className="mt-6 pt-3 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
          <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            District: {currentUser.district || 'Kabale'}
          </p>
          <p className="text-slate-500 leading-relaxed">
            Operational dispatch active for {currentUser.district || 'Kigezi'} territory.
          </p>
        </div>
      </div>
    </aside>
  );
};
