import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SecureFileLockProps {
  children: React.ReactNode;
  title?: string;
  documentId?: string;
  timeoutSeconds?: number; // Defaults to 180 (3 minutes)
}

export const SecureFileLock: React.FC<SecureFileLockProps> = ({
  children,
  title = 'Confidential Operational File',
  documentId,
  timeoutSeconds = 180, // Exactly 3 minutes
}) => {
  const { currentUser } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const lastInteractionRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const resetTimer = () => {
    if (!isLocked) {
      lastInteractionRef.current = Date.now();
      setSecondsRemaining(timeoutSeconds);
    }
  };

  useEffect(() => {
    const handleActivity = () => {
      resetTimer();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleActivity, { passive: true });
      container.addEventListener('click', handleActivity, { passive: true });
      container.addEventListener('keydown', handleActivity, { passive: true });
      container.addEventListener('touchstart', handleActivity, { passive: true });
    }

    const interval = setInterval(() => {
      if (!isLocked) {
        const idle = Math.floor((Date.now() - lastInteractionRef.current) / 1000);
        const remaining = Math.max(0, timeoutSeconds - idle);
        setSecondsRemaining(remaining);

        if (remaining <= 0) {
          setIsLocked(true);
        }
      }
    }, 1000);

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleActivity);
        container.removeEventListener('click', handleActivity);
        container.removeEventListener('keydown', handleActivity);
        container.removeEventListener('touchstart', handleActivity);
      }
      clearInterval(interval);
    };
  }, [isLocked, timeoutSeconds]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Allow PIN 1234 or user's demo password or direct resume if authenticated
    if (!pinInput || pinInput.trim() === '1234' || pinInput.trim() === 'demo1234') {
      setIsLocked(false);
      lastInteractionRef.current = Date.now();
      setSecondsRemaining(timeoutSeconds);
      setPinInput('');
      setPinError(null);
    } else {
      setPinError('Invalid Security PIN. Enter 1234 or click Resume Session.');
    }
  };

  const handleDirectResume = () => {
    setIsLocked(false);
    lastInteractionRef.current = Date.now();
    setSecondsRemaining(timeoutSeconds);
    setPinInput('');
    setPinError(null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Top Security Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-100 rounded-t-2xl border border-b-0 border-slate-200 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span className="font-bold text-slate-800">{title}</span>
          {documentId && <span className="font-mono text-slate-400">({documentId})</span>}
        </div>

        <div className="flex items-center gap-2">
          {!isLocked ? (
            <span className="inline-flex items-center gap-1 font-mono text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              Auto-locks after 3m idle: <strong className="text-amber-700">{Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}</strong>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <Lock className="w-3 h-3" /> File Locked
            </span>
          )}

          {!isLocked && (
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Lock Now
            </button>
          )}
        </div>
      </div>

      {/* Main Content with Lock Overlay */}
      <div className="relative border border-slate-200 rounded-b-2xl overflow-hidden bg-white">
        <div className={isLocked ? 'filter blur-md select-none pointer-events-none opacity-40 transition-all duration-300' : 'transition-all duration-300'}>
          {children}
        </div>

        {/* Lock Modal Screen */}
        {isLocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Confidential Record Locked
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This file was automatically secured after 3 minutes of inactivity to protect grid planning records &amp; citizen privacy.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3 pt-1">
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Security Unlock PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Enter 1234"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono tracking-widest text-center"
                      autoFocus
                    />
                  </div>
                  {pinError && <p className="text-[11px] text-rose-600 font-semibold">{pinError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock File</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectResume}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Resume with Active Session ({currentUser?.name || 'User'})
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
