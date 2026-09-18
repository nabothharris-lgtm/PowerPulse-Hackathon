import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Home, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedViewProps {
  requiredRole?: string;
  attemptedView?: string;
  onNavigate: (view: string) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRole,
  attemptedView,
  onNavigate
}) => {
  const { currentUser, logout } = useAuth();

  const getAuthorizedHome = () => {
    if (!currentUser) return 'guest';
    switch (currentUser.role) {
      case 'RESIDENT':
        return 'home';
      case 'VERIFIER':
        return 'dashboard';
      case 'ENGINEER':
        return 'jobs';
      case 'MANAGER':
      case 'PROVIDER_MANAGER':
        return 'dashboard';
      case 'ADMIN':
      case 'SYSTEM_ADMINISTRATOR':
        return 'admin';
      default:
        return 'guest';
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-200 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          {currentUser ? (
            <>
              Your account (<span className="font-semibold text-slate-900">{currentUser.name}</span>, role:{' '}
              <span className="font-mono font-bold text-rose-600">{currentUser.role}</span>) does not have authorization to view the{' '}
              <span className="font-semibold text-slate-900">{attemptedView || 'requested'}</span> workspace.
            </>
          ) : (
            'You must be signed in with an authorized operational account to access this workspace.'
          )}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Lock className="w-4 h-4 text-slate-500" />
          PowerPulse Security Boundary
        </div>
        <p>
          Operational workspaces are restricted to designated utility staff and verified field personnel. Both client views and backend API routes enforce strict role-based access control.
        </p>
        {requiredRole && (
          <p className="text-slate-500 pt-1">
            Required authorization level: <span className="font-semibold text-slate-700">{requiredRole}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          id="access-denied-home-btn"
          onClick={() => onNavigate(getAuthorizedHome())}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          Return to My Workspace
        </button>

        <button
          id="access-denied-logout-btn"
          onClick={() => {
            logout();
            onNavigate('guest');
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out / Switch Account
        </button>
      </div>
    </div>
  );
};
