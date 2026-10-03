import React, { useState, useEffect } from 'react';
import { StaffUser } from '../types';
import { LogIn, LogOut, KeyRound, Shield, User, Home } from 'lucide-react';

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

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-gradient-to-r from-[#0b3323] via-[#0e3d2a] to-[#0b3323] border-b-2 border-emerald-500 shadow-md px-3 sm:px-6 md:px-8 py-2 sm:py-3 transition-colors">
      <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-3">
        
        {/* Left Side: Logo & Official Title */}
        <div
          onClick={onGoHome}
          className={`flex items-center gap-3 sm:gap-4 min-w-0 ${onGoHome ? 'cursor-pointer' : ''}`}
        >
          {/* Logo Container */}
          <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-white p-1 border-2 border-emerald-400/80 shrink-0 shadow-md flex items-center justify-center overflow-hidden">
            <img
              src="/rdo-logo.png"
              alt="RDO Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to svg if png fails
                (e.target as HTMLImageElement).src = '/rdo-logo.svg';
              }}
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            {/* Top Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
              <span className="text-[9px] sm:text-xs md:text-sm font-extrabold text-amber-300 uppercase tracking-wider drop-shadow-xs">
                GOVERNMENT OF TELANGANA
              </span>
              <span className="text-emerald-300 text-[9px] sm:text-xs">•</span>
              <span className="text-[9px] sm:text-xs md:text-sm font-bold text-emerald-300">
                Revenue Department
              </span>
            </div>

            {/* Main Title: Full Name */}
            <h1 className="text-sm sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight mt-0.5 sm:mt-1 truncate drop-shadow-xs">
              Revenue Divisional Office, Huzurnagar
            </h1>

            {/* Subtitle & Section Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
              <span className="bg-emerald-700 text-[8px] sm:text-[10px] md:text-xs font-bold text-white px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/40 shadow-xs">
                D SECTION
              </span>
              <span className="text-[9px] sm:text-xs md:text-sm text-emerald-100/90 font-medium tracking-tight">
                File Tracking &amp; Information Management System
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Clock & User Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Desktop Live Clock */}
          <div className="hidden lg:flex flex-col items-end justify-center bg-[#062417]/90 border border-emerald-600/40 rounded-xl px-3.5 py-1.5 shadow-inner">
            <span className="text-[10px] text-emerald-200/90 font-semibold">{dateStr}</span>
            <span className="text-xs font-mono font-bold text-amber-300">{timeStr}</span>
          </div>

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 hover:text-white border border-emerald-600/50 transition shadow-xs cursor-pointer"
              title="Home"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center justify-end gap-1">
                  {currentUser.role === 'ADMIN' ? (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                  <span>{currentUser.name}</span>
                </div>
                <div className="text-[10px] text-emerald-300/80">{currentUser.cadre || currentUser.role}</div>
              </div>

              {currentUser.role !== 'VIEWER' && onOpenChangePassword && (
                <button
                  onClick={onOpenChangePassword}
                  className="p-1.5 sm:p-2 rounded-lg bg-emerald-800/60 text-emerald-200 border border-emerald-600/50 hover:bg-emerald-700 hover:text-white transition shadow-xs cursor-pointer"
                  title="Change Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onLogout}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-md border border-emerald-400/50 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};