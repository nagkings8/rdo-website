import React, { useState, useEffect } from 'react';
import { StaffUser } from '../types';
import { LogIn, LogOut, KeyRound, Shield, User, BookOpen, Home } from 'lucide-react';

interface HeaderProps {
  currentUser: StaffUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenChangePassword,
  onGoHome,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTimeStr(`${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`);

      const day = String(now.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDateStr(`${day} ${months[now.getMonth()]}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#061122]/95 backdrop-blur-md border-b-2 border-amber-500 shadow-md px-3 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: App Logo + Title */}
        <div
          onClick={onGoHome}
          className={`flex items-center gap-2.5 min-w-0 ${onGoHome ? 'cursor-pointer' : ''}`}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white p-0.5 border border-amber-400 shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src="/rdo-logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wide">
                Govt of Telangana
              </span>
              <span className="text-slate-500 text-[8px]">•</span>
              <span className="text-[9px] font-semibold text-emerald-400">
                Revenue Dept
              </span>
            </div>
            <h1 className="text-xs sm:text-base font-black text-white tracking-tight truncate leading-tight mt-0.5">
              RDO HUZURNAGAR
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="bg-blue-600 text-[8px] font-bold text-white px-1.5 py-0.2 rounded">
                D SECTION
              </span>
              <span className="text-[9px] text-slate-300 truncate">
                File Tracking System
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Header Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Compact Time */}
          <div className="hidden xs:flex flex-col items-end justify-center bg-slate-900/80 border border-slate-700/60 rounded-lg px-2 py-1 leading-tight">
            <span className="text-[9px] text-slate-300 font-semibold">{dateStr}</span>
            <span className="text-[10px] font-mono font-bold text-amber-400">{timeStr}</span>
          </div>

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
              title="Home"
            >
              <Home className="w-4 h-4" />
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1">
                  {currentUser.role === 'ADMIN' ? (
                    <Shield className="w-3 h-3 text-amber-400" />
                  ) : (
                    <User className="w-3 h-3 text-sky-400" />
                  )}
                  <span>{currentUser.name}</span>
                </div>
              </div>

              {currentUser.role !== 'VIEWER' && onOpenChangePassword && (
                <button
                  onClick={onOpenChangePassword}
                  className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30"
                  title="Change Password"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onLogout}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};