import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { 
  Zap, 
  X, 
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
  UserPlus,
  LogOut,
  PhoneCall,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
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

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
  unreadReportsCount = 0,
  activeJobsCount = 0,
}) => {
  const { currentUser, logout, demoUsers, switchUser } = useAuth();

  const handleItemClick = (viewId: string) => {
    onNavigate(viewId);
    onClose();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'RESIDENT':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Resident</span>;
      case 'VERIFIER':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">Dispatcher</span>;
      case 'ENGINEER':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">Technician</span>;
      case 'MANAGER':
      case 'PROVIDER_MANAGER':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">Manager</span>;
      case 'ADMIN':
      case 'SYSTEM_ADMINISTRATOR':
        return <span className="bg-slate-900 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">Administrator</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">Public Guest</span>;
    }
  };

  // Build nav items based on role
  let navItems: NavItem[] = [];

  if (!currentUser) {
    navItems = [
      { id: 'guest', label: 'Public Portal', icon: Home },
      { id: 'map', label: 'Live Outage Map', icon: MapPin },
      { id: 'safety', label: 'Electrical Safety Guidelines', icon: BookOpen },
      { id: 'login', label: 'Sign In to Account', icon: LogIn, highlight: true },
      { id: 'register', label: 'Community Registration', icon: UserPlus },
    ];
  } else {
    const role = currentUser.role;
    if (role === 'RESIDENT') {
      navItems = [
        { id: 'home', label: 'Resident Home', icon: Home },
        { id: 'report', label: 'Report Power Issue', icon: PlusCircle, highlight: true },
        { id: 'reports', label: 'My Problem History', icon: FileText },
        { id: 'map', label: 'Live Outage Map', icon: MapPin },
        { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
        { id: 'account', label: 'My Account & Meter', icon: Users },
      ];
    } else if (role === 'VERIFIER') {
      navItems = [
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
    } else if (role === 'ENGINEER') {
      navItems = [
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
    } else if (role === 'MANAGER' || role === 'PROVIDER_MANAGER') {
      navItems = [
        { id: 'dashboard', label: 'District Operations', icon: BarChart3 },
        { id: 'analytics', label: 'Reliability & SLA Metrics', icon: Clock },
        { id: 'incidents', label: 'Incident Work Orders', icon: Layers },
        { id: 'reports-queue', label: 'District Reports Stream', icon: FileText },
        { id: 'map', label: 'Regional Map', icon: MapPin },
        { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
      ];
    } else if (role === 'ADMIN' || role === 'SYSTEM_ADMINISTRATOR') {
      navItems = [
        { id: 'admin', label: 'Admin & RBAC Cockpit', icon: Shield, highlight: true },
        { id: 'dashboard', label: 'System Overview', icon: BarChart3 },
        { id: 'incidents', label: 'All Incidents', icon: Layers },
        { id: 'reports-queue', label: 'All Reports Stream', icon: FileText },
        { id: 'map', label: 'GIS Grid Map', icon: MapPin },
        { id: 'safety', label: 'Safety Guidelines', icon: BookOpen },
      ];
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
                  <Zap className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-lg tracking-tight text-white font-display">
                      POWER<span className="text-amber-400">PULSE</span>
                    </span>
                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                      UGANDA
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Kigezi Grid Response Network
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card or Guest Welcome */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center border border-amber-300 shadow-xs shrink-0">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser.phone || currentUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(currentUser.role)}
                      <span className="text-[10px] text-slate-500 font-semibold truncate">
                        {currentUser.district || 'Kabale'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Welcome to PowerPulse Uganda
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Connect directly with electricity dispatchers &amp; track outage resolution.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleItemClick('login')}
                      className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold text-center hover:bg-slate-800 transition-colors min-h-[40px]"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleItemClick('register')}
                      className="flex-1 py-2 px-3 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold text-center hover:bg-amber-400 transition-colors min-h-[40px]"
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                Navigation Menu
              </div>

              {navItems.map(item => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : item.highlight
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-slate-950 text-amber-400' : 'bg-red-600 text-white animate-pulse'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-300'}`} />
                    </div>
                  </motion.button>
                );
              })}

              {/* Quick Persona Switcher for Hackathon Testing */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 px-3 py-1 mb-1.5">
                  <Sparkles className="w-3 h-3" /> Quick Switch Persona
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={async () => {
                      await logout();
                      handleItemClick('guest');
                    }}
                    className={`p-2 rounded-xl text-[11px] font-semibold text-left border transition-all ${
                      !currentUser
                        ? 'bg-slate-900 text-amber-400 border-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Public Guest
                  </button>
                  {demoUsers.map(u => {
                    const isCurrent = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={async () => {
                          await switchUser(u.id);
                          if (u.role === 'RESIDENT') handleItemClick('home');
                          else if (u.role === 'VERIFIER') handleItemClick('dashboard');
                          else if (u.role === 'ENGINEER') handleItemClick('jobs');
                          else if (u.role === 'MANAGER' || u.role === 'PROVIDER_MANAGER') handleItemClick('dashboard');
                          else if (u.role === 'ADMIN' || u.role === 'SYSTEM_ADMINISTRATOR') handleItemClick('admin');
                          else handleItemClick('dashboard');
                        }}
                        className={`p-2 rounded-xl text-[11px] font-semibold text-left border truncate transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {u.name.split(' ')[0]} ({u.role.slice(0, 3)})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Emergency Hotline Footer */}
            <div className="p-4 bg-red-50 border-t border-red-200">
              <a
                href="tel:0800185186"
                className="flex items-center justify-between gap-2 p-2.5 bg-white border border-red-300 rounded-xl text-red-900 hover:bg-red-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-red-700">Emergency Hotline</div>
                    <div className="font-mono text-xs font-black text-red-900">0800 185 186</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-1 rounded-md">
                  Call Free
                </span>
              </a>

              {currentUser && (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                    onNavigate('guest');
                  }}
                  className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors min-h-[40px]"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
