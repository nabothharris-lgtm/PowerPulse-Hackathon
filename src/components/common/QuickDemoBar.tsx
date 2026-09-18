import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Zap, 
  Shield, 
  Wrench, 
  BarChart3, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { api } from '../../lib/api';

interface QuickDemoBarProps {
  currentRole?: string;
  onSelectRole?: (role: string) => void;
}

export const QuickDemoBar: React.FC<QuickDemoBarProps> = ({ currentRole, onSelectRole }) => {
  const { currentUser, demoUsers, switchUser, logout } = useAuth();
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Reset database to pristine golden demo state with fresh test records?')) return;
    setIsResetting(true);
    try {
      await api.admin.resetDemo();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      alert('Failed to reset: ' + err);
    } finally {
      setIsResetting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'RESIDENT':
        return <Users className="w-3.5 h-3.5" />;
      case 'VERIFIER':
        return <Zap className="w-3.5 h-3.5" />;
      case 'ENGINEER':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'MANAGER':
      case 'PROVIDER_MANAGER':
        return <BarChart3 className="w-3.5 h-3.5" />;
      case 'ADMIN':
      case 'SYSTEM_ADMINISTRATOR':
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <UserCheck className="w-3.5 h-3.5" />;
    }
  };

  const getRoleColor = (role: string, isActive: boolean) => {
    if (isActive) {
      switch (role) {
        case 'RESIDENT':
          return 'bg-emerald-600 text-white border-emerald-500 shadow-xs';
        case 'VERIFIER':
          return 'bg-blue-600 text-white border-blue-500 shadow-xs';
        case 'ENGINEER':
          return 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs';
        case 'MANAGER':
        case 'PROVIDER_MANAGER':
          return 'bg-purple-600 text-white border-purple-500 shadow-xs';
        case 'ADMIN':
        case 'SYSTEM_ADMINISTRATOR':
          return 'bg-slate-800 text-amber-400 border-slate-700 shadow-xs';
      }
    }
    return 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700';
  };

  return (
    <>
      <div className="bg-slate-900 text-white border-b border-slate-800 select-none text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Label + Mobile toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-amber-400 text-[10px] sm:text-[11px]">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Demo Persona:</span>
              <span className="sm:hidden">Persona:</span>
            </span>

            {/* Persona badge / toggle on mobile */}
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-[10px] cursor-pointer"
            >
              <span className="font-semibold">{currentUser ? currentUser.name.split(' ')[0] : 'Guest'}</span>
              {mobileExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Persona Switchers */}
          <div className={`items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar shrink-0 ${mobileExpanded ? 'flex' : 'hidden sm:flex'}`}>
            {/* Guest Mode Switcher */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              id="demo-guest-btn"
              onClick={async () => {
                await logout();
                if (onSelectRole) onSelectRole('GUEST');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap min-h-[30px] ${
                !currentUser
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="Public Guest Mode (Unauthenticated)"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Public Guest</span>
              {!currentUser && <Check className="w-3 h-3 ml-0.5" />}
            </motion.button>

            {demoUsers.map(u => {
              const isActive = currentUser?.id === u.id;
              return (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={u.id}
                  id={`demo-user-btn-${u.id}`}
                  onClick={async () => {
                    await switchUser(u.id);
                    if (onSelectRole) onSelectRole(u.role);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap min-h-[30px] ${getRoleColor(
                    u.role,
                    isActive
                  )}`}
                  title={`${u.name} (${u.email}) - ${u.role}`}
                >
                  {getRoleIcon(u.role)}
                  <span>{u.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">({u.role.toLowerCase()})</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5" />}
                </motion.button>
              );
            })}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowDemoGuide(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-xs border border-slate-700 cursor-pointer min-h-[30px]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Golden Demo Guide</span>
              <span className="sm:hidden">Guide</span>
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-900/50 hover:text-red-300 text-slate-300 text-xs border border-slate-700 cursor-pointer transition-colors min-h-[30px]"
              title="Reset database to initial demo state"
            >
              <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{resetSuccess ? 'Reset!' : 'Reset DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Golden Demo Guide Modal with Spring Animation */}
      <AnimatePresence>
        {showDemoGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoGuide(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
              className="relative bg-white rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-200 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Zap className="w-5 h-5 fill-amber-500" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">
                      PowerPulse Golden Hackathon Demo Flow
                    </h3>
                    <p className="text-xs text-slate-500">
                      Master test scenario demonstrating the complete end-to-end operational lifecycle
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDemoGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    Resident (Florence): Report Power Problem
                  </div>
                  <p className="text-xs text-slate-600 ml-7">
                    Click <strong>&quot;Report a Problem&quot;</strong>. Select fault category, pinpoint location in Kabale, submit report. Instant receipt and status <code>SUBMITTED</code>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    Operations (Sarah): Verify &amp; Group into Incident
                  </div>
                  <p className="text-xs text-slate-600 ml-7">
                    Switch to <strong>Sarah (Ops)</strong> in the top bar. Go to <strong>Reports Queue</strong>. Open report. Inspect duplicate candidate suggestions. Click <strong>Verify &amp; Create Incident</strong> or link to active incident.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    Operations: Dispatch Technician
                  </div>
                  <p className="text-xs text-slate-600 ml-7">
                    In Incident view, select <strong>Assign Response Team</strong>. Assign <strong>Eng. David Kigozi</strong> with instructions and priority.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    Engineer (David): Accept, En Route, Work, Resolve
                  </div>
                  <p className="text-xs text-slate-600 ml-7">
                    Switch to <strong>David (Engineer)</strong>. See assigned job. Click <strong>Accept</strong> &rarr; <strong>Mark En Route</strong> &rarr; <strong>Arrived &amp; Start Work</strong> &rarr; <strong>Submit Resolution</strong> with notes &amp; evidence photo.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    Resident: Dispute Resolution (&quot;Power Still Out&quot;) &rarr; Auto Reopened!
                  </div>
                  <p className="text-xs text-slate-600 ml-7">
                    Switch back to <strong>Florence (Resident)</strong>. Modal asks: <em>&quot;Has your power been restored?&quot;</em>. Click <strong>&quot;NO, STILL WITHOUT POWER&quot;</strong> and type reason. Incident reopens automatically!
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center shrink-0">
                      6
                    </span>
                    Engineer Re-Resolves &rarr; Resident Confirms &amp; Rates 5 Stars
                  </div>
                  <p className="text-xs text-slate-600 ml-7">
                    Engineer David fixes secondary issue and re-resolves. Resident Florence clicks <strong>&quot;YES, POWER IS RESTORED&quot;</strong>, rates 5 stars, and the incident is officially closed with complete timeline!
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowDemoGuide(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px]"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
