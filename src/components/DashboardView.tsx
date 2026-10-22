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
  ShieldCheck
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
      
      {/* HERO BANNER CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 bg-white pb-3 sm:pb-3.5">
        
        {/* Photo Box */}
        <div className="relative w-full h-[280px] sm:h-[360px] md:h-[430px] lg:h-[490px] overflow-hidden bg-sky-100">
          <img
            src={imgSrc}
            onError={handleImageError}
            alt="Revenue Divisional Office Huzurnagar Building"
            className="w-full h-full object-cover object-[center_top]"
          />

          {/* Top Left District Badge */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-emerald-300 text-[11px] sm:text-xs font-bold tracking-wider uppercase border border-emerald-500/30 shadow-sm">
              Huzurnagar Division • Suryapet District
            </span>
          </div>

          {/* COLORFUL GREEN RIBBON WAVE */}
          <div className="absolute -bottom-1 inset-x-0 w-full pointer-events-none overflow-hidden leading-none z-10">
            <svg
              className="relative block w-full h-12 sm:h-16 md:h-20 lg:h-24"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,95 C160,82 320,80 500,92 C720,108 940,55 1200,12 L1200,28 C940,70 720,118 500,102 C320,90 160,92 0,105 Z"
                fill="#6ee7b7"
                opacity="0.95"
              />
              <path
                d="M0,100 C180,88 360,86 540,98 C750,112 960,45 1200,24 L1200,46 C960,68 750,126 540,112 C360,98 180,100 0,112 Z"
                fill="#10b981"
              />
              <path
                d="M200,105 C400,102 600,116 800,90 C980,68 1100,42 1200,38 L1200,60 C1100,65 980,88 800,110 C600,128 400,114 200,115 Z"
                fill="#047857"
              />
              <path
                d="M0,108 C200,96 400,98 600,110 C800,122 1000,75 1200,54 L1200,120 L0,120 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* PHOTO CONTAINER LOPALE RIBBON KINDA PLAIN TEXT (NO BOX, NO BORDER) */}
        <div className="text-right px-6 pt-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wide">
            * Digital Concept Model (Illustrative Representation)
          </span>
        </div>
      </div>

      {/* 2. THE 5 SERVICE TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* CARD 1: Bhu Bharati Files */}
        <div
          onClick={() => onNavigate('bhuBharatiTab')}
          className="group bg-gradient-to-b from-emerald-50/70 via-white to-white rounded-2xl border border-emerald-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[270px]"
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
          className="group bg-gradient-to-b from-amber-50/70 via-white to-white rounded-2xl border border-amber-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-amber-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[270px]"
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
          className="group bg-gradient-to-b from-teal-50/70 via-white to-white rounded-2xl border border-teal-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-teal-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[270px]"
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
          className="group bg-gradient-to-b from-blue-50/70 via-white to-white rounded-2xl border border-blue-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[270px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#165bb5] text-white flex items-center justify-center shadow-lg shadow-blue-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Scale className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-blue-700 transition-colors">
              Appeal Cases
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Check appellate court case status &amp; orders
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#165bb5] text-white flex items-center justify-center shadow-md group-hover:bg-[#11478f] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 5: RDO Pendency */}
        <div
          onClick={() => onNavigate('rdoPendencyTab')}
          className="group bg-gradient-to-b from-purple-50/70 via-white to-white rounded-2xl border border-purple-200/80 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-purple-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[270px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-800/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Clock className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-purple-800 transition-colors">
              RDO Login Pending
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Check citizen application status and pending files
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