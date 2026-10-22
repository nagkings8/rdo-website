import React, { useState } from 'react';
import { StaffUser, BhuFile, InwardTapal, OutwardDespatch, AppealCase } from '../types';
import { 
  FolderOpen, 
  Mail, 
  FileSpreadsheet, 
  Scale, 
  Clock, 
  ArrowRight,
  PlusCircle,
  Send,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { ActiveTab } from './Navigation';

interface DashboardViewProps {
  files?: BhuFile[];
  inwards?: InwardTapal[];
  outwards?: OutwardDespatch[];
  staff?: StaffUser[];
  appealCases?: AppealCase[];
  sadabainamaAbstract?: any[][] | null;
  currentUser?: StaffUser | null;
  onNavigate: (tab: ActiveTab, filterState?: any) => void;
  onNewFile?: () => void;
  onNewInward?: () => void;
  onNewOutward?: () => void;
  onOpenAdmin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  files = [],
  inwards = [],
  outwards = [],
  appealCases = [],
  currentUser,
  onNavigate,
  onNewFile,
  onNewInward,
  onNewOutward,
  onOpenAdmin,
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/rdo-building.jpeg');

  const handleImageError = () => {
    if (imgSrc === '/rdo-building.jpeg') {
      setImgSrc('/assets/rdo-building.jpg');
    } else if (imgSrc === '/assets/rdo-building.jpg') {
      setImgSrc('/rdo-building.jpg');
    }
  };

  const isOfficial = currentUser && currentUser.role !== 'VIEWER';

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1520px] mx-auto pb-6">
      
      {/* 1. HERO STRIP: RESPONSIVE OFFICIAL GOVERNMENT BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c2f1f] via-[#0b3323] to-[#082216] rounded-3xl border border-emerald-600/30 shadow-lg text-white">
        {/* Subtle Decorative Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-6 sm:p-8 lg:p-10 gap-6 lg:gap-10">
          
          {/* Left Text Block: Clean, Official, No Text Collision */}
          <div className="w-full lg:max-w-xl space-y-3.5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] sm:text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Government of Telangana • Revenue Department
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Office of the Revenue Divisional Officer
              </h1>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-amber-300 tracking-wide">
                Huzurnagar Division • Suryapet District
              </h2>
            </div>

            <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full mx-auto lg:mx-0" />

            <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed">
              D-Section Land Administration, Tapal Tracking &amp; Appellate Revenue Court Information Management System.
            </p>

            <div className="pt-1 text-[11.5px] sm:text-xs text-amber-200/90 font-medium italic">
              "Serving the public with transparency, accountability and efficiency."
            </div>
          </div>

          {/* Right Photo Block: Framed & Cleanly Separated */}
          <div className="w-full lg:w-auto flex justify-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 max-w-md w-full bg-black/30 group">
              <img
                src={imgSrc}
                onError={handleImageError}
                alt="Revenue Divisional Office Huzurnagar"
                className="w-full h-48 sm:h-56 lg:h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-2.5 text-center">
                <span className="text-[11px] sm:text-xs font-bold text-white tracking-wider uppercase flex items-center justify-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  RDO &amp; Sub-Divisional Magistrate Bench, Huzurnagar
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. THE 5 SERVICE TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* CARD 1: Bhu Bharati Files */}
        <div
          onClick={() => onNavigate('bhuBharatiTab')}
          className="group bg-gradient-to-b from-emerald-50/70 via-white to-white rounded-2xl border border-emerald-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-emerald-700 transition-colors">
              Bhu Bharati Files
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Track and manage all 16 Revenue Land modules files
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:bg-emerald-700 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: Tapal Register */}
        <div
          onClick={() => onNavigate('tapalTab')}
          className="group bg-gradient-to-b from-amber-50/70 via-white to-white rounded-2xl border border-amber-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-amber-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-600/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Mail className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-amber-700 transition-colors">
              Tapal Register
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              View tapal and outward despatch records
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 3: Sadabainama */}
        <div
          onClick={() => onNavigate('sadabainamaTab')}
          className="group bg-gradient-to-b from-teal-50/70 via-white to-white rounded-2xl border border-teal-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-teal-700 transition-colors">
              Sadabainama
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              View and download Sadabainama regularisation details
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: Appeal Cases */}
        <div
          onClick={() => onNavigate('appealCasesTab')}
          className="group bg-gradient-to-b from-blue-50/70 via-white to-white rounded-2xl border border-blue-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-blue-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#165bb5] text-white flex items-center justify-center shadow-lg shadow-blue-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Scale className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-blue-700 transition-colors">
              Appeal Cases
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Check appellate court case status, cause list &amp; orders
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#165bb5] text-white flex items-center justify-center shadow-md group-hover:bg-[#11478f] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 5: RDO Pendency */}
        <div
          onClick={() => onNavigate('rdoPendencyTab')}
          className="group bg-gradient-to-b from-purple-50/70 via-white to-white rounded-2xl border border-purple-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-purple-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-800/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Clock className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-purple-800 transition-colors">
              RDO Login Pending
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Check citizen application status and division pendency
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-md group-hover:bg-purple-800 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS FOR LOGGED IN USERS */}
      {isOfficial && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Officer Quick Desk Actions:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onNewFile && (
              <button
                onClick={onNewFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ New File</span>
              </button>
            )}
            {onNewInward && (
              <button
                onClick={onNewInward}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>+ Inward Tapal</span>
              </button>
            )}
            {onNewOutward && (
              <button
                onClick={onNewOutward}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Dispatch</span>
              </button>
            )}
            {currentUser?.role === 'ADMIN' && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="bg-slate-800 hover:bg-slate-900 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};