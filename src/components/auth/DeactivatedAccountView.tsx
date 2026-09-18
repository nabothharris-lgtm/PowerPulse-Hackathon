import React from 'react';
import { UserX, LogOut, ShieldAlert, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DeactivatedAccountViewProps {
  onNavigate: (view: string) => void;
}

export const DeactivatedAccountView: React.FC<DeactivatedAccountViewProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-300 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
        <UserX className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Account Deactivated
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          Operational access for <span className="font-semibold text-slate-900">{currentUser?.name || 'this account'}</span> has been deactivated by regional system administration.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Security Policy & Record Preservation
        </div>
        <p>
          In accordance with utility data governance, your historical job logs, incident resolutions, and photographic evidence remain permanently preserved in regional audit ledgers. Active field access and dispatch capabilities are suspended.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-3">
        <PhoneCall className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p>
          If you believe this deactivation was performed in error, contact the UEDCL Regional Operations Office or your supervising System Administrator.
        </p>
      </div>

      <div className="pt-2">
        <button
          id="deactivated-signout-btn"
          onClick={() => {
            logout();
            onNavigate('guest');
          }}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors mx-auto shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Account
        </button>
      </div>
    </div>
  );
};
