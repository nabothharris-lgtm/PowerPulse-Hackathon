import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  PlusCircle, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Wrench, 
  BarChart3, 
  Menu, 
  Layers, 
  Shield, 
  Clock, 
  LogIn, 
  BookOpen
} from 'lucide-react';

interface MobileBottomBarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onToggleMenu: () => void;
  unreadReportsCount?: number;
  activeJobsCount?: number;
}

interface BottomTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
  badge?: number;
  isDrawerTrigger?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeView,
  onNavigate,
  onToggleMenu,
  unreadReportsCount = 0,
  activeJobsCount = 0,
}) => {
  const { currentUser } = useAuth();

  const getTabs = (): BottomTab[] => {
    if (!currentUser) {
      return [
        { id: 'guest', label: 'Home', icon: Home },
        { id: 'map', label: 'Outage Map', icon: MapPin },
        { id: 'login', label: 'Sign In', icon: LogIn, isAction: true },
        { id: 'safety', label: 'Safety', icon: BookOpen },
        { id: 'more', label: 'Menu', icon: Menu, isDrawerTrigger: true },
      ];
    }

    const role = currentUser.role;

    if (role === 'RESIDENT') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'reports', label: 'My Reports', icon: FileText },
        { id: 'report', label: 'Report Issue', icon: PlusCircle, isAction: true },
        { id: 'map', label: 'Live Map', icon: MapPin },
        { id: 'more', label: 'Menu', icon: Menu, isDrawerTrigger: true },
      ];
    }

    if (role === 'VERIFIER') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'incidents', label: 'Incidents', icon: Layers },
        { 
          id: 'reports-queue', 
          label: 'Triage Queue', 
          icon: AlertTriangle, 
          isAction: true,
          badge: unreadReportsCount > 0 ? unreadReportsCount : undefined 
        },
        { id: 'map', label: 'GIS Map', icon: MapPin },
        { id: 'more', label: 'Menu', icon: Menu, isDrawerTrigger: true },
      ];
    }

    if (role === 'ENGINEER') {
      return [
        { 
          id: 'jobs', 
          label: 'Work Orders', 
          icon: Wrench,
          badge: activeJobsCount > 0 ? activeJobsCount : undefined 
        },
        { id: 'map', label: 'Field Map', icon: MapPin },
        { id: 'safety', label: 'Safety', icon: BookOpen },
        { id: 'more', label: 'Menu', icon: Menu, isDrawerTrigger: true },
      ];
    }

    if (role === 'MANAGER' || role === 'PROVIDER_MANAGER') {
      return [
        { id: 'dashboard', label: 'Overview', icon: BarChart3 },
        { id: 'analytics', label: 'Metrics', icon: Clock },
        { id: 'incidents', label: 'Orders', icon: Layers },
        { id: 'map', label: 'Map', icon: MapPin },
        { id: 'more', label: 'Menu', icon: Menu, isDrawerTrigger: true },
      ];
    }

    // Admin
    return [
      { id: 'admin', label: 'Cockpit', icon: Shield },
      { id: 'dashboard', label: 'Overview', icon: BarChart3 },
      { id: 'incidents', label: 'Orders', icon: Layers },
      { id: 'map', label: 'Map', icon: MapPin },
      { id: 'more', label: 'Menu', icon: Menu, isDrawerTrigger: true },
    ];
  };

  const tabs = getTabs();

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-2 py-1 pb-safe"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => {
          const isActive = !tab.isDrawerTrigger && activeView === tab.id;
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (tab.isDrawerTrigger) {
                    onToggleMenu();
                  } else {
                    onNavigate(tab.id);
                  }
                }}
                className="relative -top-2 flex flex-col items-center justify-center cursor-pointer group"
                aria-label={tab.label}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-white group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-900 mt-1 leading-none">
                  {tab.label}
                </span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (tab.isDrawerTrigger) {
                  onToggleMenu();
                } else {
                  onNavigate(tab.id);
                }
              }}
              className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[44px] ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-amber-500' : 'text-slate-500'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 leading-none ${isActive ? 'font-black text-slate-900' : 'font-medium'}`}>
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="mobileTabIndicator"
                  className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
