import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import { api, setApiToken } from '../lib/api';
import { ShieldAlert, Clock, LogOut, CheckCircle } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  demoUsers: User[];
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<User>;
  registerResident: (data: {
    name: string;
    phone: string;
    email?: string;
    district?: string;
    subArea?: string;
    password?: string;
  }) => Promise<User>;
  applyEngineer: (data: {
    name: string;
    phone: string;
    email?: string;
    professionalId: string;
    organizationId?: string;
    serviceArea?: string;
    applicationNotes?: string;
  }) => Promise<User>;
  switchUser: (userId: string) => Promise<void>;
  logout: (reason?: string) => void;
  refreshUser: () => Promise<void>;
  inactivityNotice: string | null;
  clearInactivityNotice: () => void;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Operational roles requiring 10-15 min strict inactivity auto-signout
const OPERATIONAL_ROLES = ['MANAGER', 'PROVIDER_MANAGER', 'VERIFIER', 'ADMIN', 'SYSTEM_ADMINISTRATOR', 'ENGINEER'];
const WARNING_THRESHOLD_SECONDS = 600; // 10 minutes
const TIMEOUT_THRESHOLD_SECONDS = 720; // 12 minutes (between 10 and 15 mins)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const { users } = await api.auth.getDemoUsers();
        const demoList = users || [];
        setDemoUsers(demoList);

        let token: string | null = null;
        try {
          token = localStorage.getItem('powerpulse_token');
        } catch {
          token = null;
        }

        if (token && token !== 'undefined' && token !== 'null') {
          try {
            setApiToken(token);
            const { user } = await api.auth.me();
            if (user && user.status !== 'DEACTIVATED') {
              setCurrentUser(user);
            } else {
              setApiToken(null);
              setCurrentUser(null);
            }
          } catch {
            setApiToken(null);
            setCurrentUser(null);
          }
        } else {
          // By default, unauthenticated users are GUESTS
          setApiToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setApiToken(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (identifier: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(identifier, password || 'demo1234');
      setApiToken(res.token);
      setCurrentUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerResident = async (data: {
    name: string;
    phone: string;
    email?: string;
    district?: string;
    subArea?: string;
    password?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      setApiToken(res.token);
      setCurrentUser(res.user);
      try {
        const { users } = await api.auth.getDemoUsers();
        if (users) setDemoUsers(users);
      } catch {
        // ignore
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const applyEngineer = async (data: {
    name: string;
    phone: string;
    email?: string;
    professionalId: string;
    organizationId?: string;
    serviceArea?: string;
    applicationNotes?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.applyEngineer(data);
      setApiToken(res.token);
      setCurrentUser(res.user);
      try {
        const { users } = await api.auth.getDemoUsers();
        if (users) setDemoUsers(users);
      } catch {
        // ignore
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  // Real backend authentication for switching demo personas
  const switchUser = async (userId: string) => {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) return;
    await login(user.email || user.phone, 'demo1234');
  };

  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(120);
  const lastActivityRef = useRef<number>(Date.now());

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarningModal(false);
  }, []);

  const extendSession = () => {
    resetActivity();
  };

  const clearInactivityNotice = () => {
    setInactivityNotice(null);
  };

  const logout = (reason?: string) => {
    try {
      api.auth.logout().catch(() => {});
    } catch {
      // ignore
    }
    setApiToken(null);
    setCurrentUser(null);
    setShowWarningModal(false);
    if (reason === 'INACTIVITY_TIMEOUT') {
      // notice already set
    }
  };

  // Inactivity watchdog for operational personnel
  useEffect(() => {
    if (!currentUser || !OPERATIONAL_ROLES.includes(currentUser.role)) {
      setShowWarningModal(false);
      return;
    }

    lastActivityRef.current = Date.now();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const onUserInteraction = () => {
      if (!showWarningModal) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach(evt => window.addEventListener(evt, onUserInteraction, { passive: true }));

    const interval = setInterval(() => {
      const idleSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);

      if (idleSeconds >= TIMEOUT_THRESHOLD_SECONDS) {
        setShowWarningModal(false);
        setInactivityNotice(
          `Security Notice: Operational dashboard (${currentUser.name} - ${currentUser.role}) was automatically signed out after 12 minutes of inactivity to protect grid controls and district privacy records.`
        );
        logout('INACTIVITY_TIMEOUT');
      } else if (idleSeconds >= WARNING_THRESHOLD_SECONDS) {
        setShowWarningModal(true);
        setWarningSecondsLeft(Math.max(0, TIMEOUT_THRESHOLD_SECONDS - idleSeconds));
      } else {
        setShowWarningModal(false);
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, onUserInteraction));
      clearInterval(interval);
    };
  }, [currentUser, showWarningModal]);

  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const { user } = await api.auth.me();
      setCurrentUser(user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        demoUsers,
        isLoading,
        login,
        registerResident,
        applyEngineer,
        switchUser,
        logout,
        refreshUser,
        inactivityNotice,
        clearInactivityNotice,
        extendSession
      }}
    >
      {children}

      {/* Inactivity Warning Modal (Appears at 10 minutes of inactivity for operational users) */}
      {showWarningModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-pulse text-amber-700" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Inactivity Security Alert
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Operational Dashboard Session Timeout
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold">
                You have been inactive for 10 minutes.
              </p>
              <p className="mt-1 text-slate-600">
                To protect critical district grid infrastructure and citizen data, this panel will automatically lock and sign out in:
              </p>
              <div className="text-center py-2">
                <span className="font-mono text-2xl font-black text-amber-700 bg-white px-4 py-1 rounded-xl border border-amber-200 shadow-2xs inline-block">
                  {Math.floor(warningSecondsLeft / 60)}:{(warningSecondsLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={extendSession}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>I'm Still Here / Continue</span>
              </button>
              <button
                type="button"
                onClick={() => logout('MANUAL')}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Signed Out Notification Toast */}
      {inactivityNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="text-sm font-bold text-slate-100">Session Securely Closed</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {inactivityNotice}
              </p>
              <button
                type="button"
                onClick={clearInactivityNotice}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Understood / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
