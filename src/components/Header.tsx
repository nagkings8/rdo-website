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
  onGoHome 
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [dayStr, setDayStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');

      setTimeStr(`${hoursStr}:${minutes}:${seconds} ${ampm}`);

      const daysOfWeek = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ];
      setDayStr(daysOfWeek[now.getDay()]);

      const day = String(now.getDate()).padStart(2, '0');
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      setDateStr(`${day} ${month} ${year}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative bg-gradient-to-r from-[#030914] via-[#081b35] to-[#040f21] border-b-4 border-amber-500 px-3 sm:px-6 md:px-8 py-3 flex flex-wrap justify-between items-center gap-3 sm:gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)] select-none overflow-hidden">
      {/* Top ambient glass light beam */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />
      {/* Soft background ambient glows */}
      <div className="absolute -left-16 -top-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT SIDE: UPLOADED RDO LOGO + TITLE WITH GLOSSY FINISH */}
      <div className="relative z-10 flex items-center gap-2.5 sm:gap-4 flex-1 min-w-[280px]">
        {/* Exact Uploaded Logo Container */}
        <div className="relative shrink-0 select-none">
          <div className="w-12 h-12 sm:w-15 sm:h-15 md:w-16 md:h-16 rounded-2xl bg-white p-1 border-2 border-amber-400 shadow-[0_4px_18px_rgba(245,158,11,0.35)] flex items-center justify-center overflow-hidden">
            <img
              src="/rdo-logo.png"
              alt="Official RDO Huzurnagar Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Top glossy specular highlight */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-2xl" />
        </div>

        {/* Title & Department Details */}
        <div 
          onClick={onGoHome}
          className={`text-left ${onGoHome ? 'cursor-pointer group/title' : ''}`}
          title={onGoHome ? 'Click to navigate to Home' : undefined}
        >
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <div className="relative overflow-hidden inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/15 border border-amber-400/60 px-2 py-0.5 rounded-full shadow-[0_1px_6px_rgba(245,158,11,0.25)] backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-xs shadow-amber-300" />
              <span className="text-[9px] sm:text-[10px] md:text-[11.5px] font-black text-amber-300 tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                GOVERNMENT OF TELANGANA
              </span>
            </div>

            <div className="relative overflow-hidden inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500/20 via-teal-400/25 to-emerald-500/15 border border-emerald-400/50 px-2 py-0.5 rounded-full shadow-[0_1px_6px_rgba(16,185,129,0.2)] backdrop-blur-xs">
              <span className="text-[9px] sm:text-[10px] md:text-[11.5px] font-extrabold text-emerald-300 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                Revenue Department
              </span>
            </div>
          </div>

          {/* Main Office Heading */}
          <h1 className="text-sm sm:text-lg md:text-2xl lg:text-[25px] font-black tracking-tight leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <span className="bg-gradient-to-b from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              Revenue Divisional Office,&nbsp;
            </span>
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.45)]">
              Huzurnagar
            </span>
          </h1>

          {/* Section & System Subtitle */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
            <span className="relative overflow-hidden inline-flex items-center bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700 text-white text-[9px] sm:text-[10px] md:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded border border-blue-300/50 shadow-sm tracking-wider uppercase">
              <span className="relative z-10">D SECTION</span>
            </span>
            <span className="text-[11px] sm:text-xs md:text-[13.5px] font-semibold tracking-wide bg-gradient-to-r from-slate-200 via-white to-slate-300 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              File Tracking &amp; Information Management System
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: HOME BUTTON, LIVE CLOCK WITH DAY & LOGIN BUTTON */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Direct Home Button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 border border-white/20 shadow-xs transition cursor-pointer backdrop-blur-xs hover:border-amber-400/60"
            title="Return to Home Dashboard"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold hidden sm:inline">Home</span>
          </button>
        )}

        {/* Digital Clock with Day, Date & Running Time */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#0e274a]/95 to-[#091830]/95 border border-blue-400/40 rounded-xl px-2.5 sm:px-3.5 py-1.5 flex flex-col items-center justify-center shadow-md backdrop-blur-xs select-none">
          <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 leading-none">
            <span className="bg-amber-400/20 text-amber-300 font-black text-[9px] sm:text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border border-amber-400/40 shadow-2xs">
              {dayStr}
            </span>
            <span className="text-slate-200 text-[10px] sm:text-[11px] font-bold tracking-tight">
              {dateStr}
            </span>
          </div>
          <div className="relative z-10 font-mono text-xs sm:text-sm md:text-[15px] font-black text-amber-400 tracking-wider mt-1 leading-none drop-shadow-sm">
            {timeStr}
          </div>
        </div>

        {/* Auth status / Login Button */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-md">
            <div className="text-right">
              <div className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1">
                {currentUser.role === 'ADMIN' ? (
                  <Shield className="w-3 h-3 text-amber-400" />
                ) : currentUser.role === 'VIEWER' ? (
                  <BookOpen className="w-3 h-3 text-emerald-400" />
                ) : (
                  <User className="w-3 h-3 text-sky-400" />
                )}
                <span className="hidden sm:inline">{currentUser.name}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold uppercase">
                {currentUser.role === 'VIEWER' ? 'VIEWER' : currentUser.role}
              </div>
            </div>

            {currentUser.role !== 'VIEWER' && onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 hover:text-white text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Change Password"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold hidden md:inline">Password</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            title="Staff & Administrator Portal Login"
          >
            <LogIn className="w-4 h-4 text-slate-950 relative z-10" />
            <span className="relative z-10 tracking-wide">Login</span>
          </button>
        )}
      </div>
    </header>
  );
};