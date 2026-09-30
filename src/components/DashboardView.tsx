import React, { useState } from 'react';
import { StaffUser } from '../types';
import { 
  FileSpreadsheet, 
  FileCheck, 
  Layers, 
  Scale, 
  Mail, 
  ArrowRight
} from 'lucide-react';
import { ActiveTab } from './Navigation';

interface DashboardViewProps {
  files?: any[];
  inwards?: any[];
  outwards?: any[];
  staff?: StaffUser[];
  appealCases?: any[];
  sadabainamaAbstract?: any[][] | null;
  currentUser?: StaffUser | null;
  onNavigate: (tab: ActiveTab, filterState?: any) => void;
  onNewFile?: () => void;
  onNewInward?: () => void;
  onNewOutward?: () => void;
  onOpenAdmin?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
}) => {
  // Direct file paths as confirmed in your VS Code workspace
  const [imgSrc, setImgSrc] = useState<string>('/rdo-building.jpeg');

  const handleImageError = () => {
    // If /rdo-building.jpeg fails, try the one inside assets folder
    if (imgSrc === '/rdo-building.jpeg') {
      setImgSrc('/assets/rdo-building.jpg');
    } else if (imgSrc === '/assets/rdo-building.jpg') {
      setImgSrc('/rdo-building.jpg');
    }
  };

  return (
    <div className="space-y-8 max-w-[1520px] mx-auto pb-6">
      {/* ============================================================ */}
      {/* 1. HERO STRIP: FULL WIDTH SEAMLESS PHOTO & GREEN WAVE CURVE */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#ebf7f0] via-[#f3faf6] to-[#e4f3ea] rounded-3xl border border-emerald-100 shadow-sm min-h-[380px] lg:min-h-[440px] flex items-center">
        
        {/* Decorative soft green organic leaves accent */}
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Big Seamless Building Photo on Right - Blending perfectly into background */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[62%] h-full pointer-events-none select-none overflow-hidden">
          <img
            src={imgSrc}
            onError={handleImageError}
            alt="Revenue Divisional Office Huzurnagar"
            className="w-full h-full object-cover object-center lg:object-[center_35%]"
          />
          {/* Left subtle soft fade gradient overlay so text stays razor sharp */}
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#ebf7f0] via-[#ebf7f0]/80 to-transparent hidden lg:block" />
        </div>

        {/* Bottom Curved Ribbon Wave Accent (Exact Model Ribbon) */}
        <div className="absolute -bottom-10 inset-x-0 w-full h-24 bg-gradient-to-r from-emerald-500/25 via-emerald-600/35 to-teal-400/20 blur-md transform -rotate-1 pointer-events-none" />

        {/* Left Welcome Text Box */}
        <div className="relative z-10 p-8 sm:p-12 lg:p-14 max-w-2xl space-y-4">
          <div className="text-base sm:text-lg font-bold text-emerald-800 tracking-wide">
            Welcome to
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0c3559] tracking-tight drop-shadow-xs">
              RDO Huzurnagar
            </h1>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-700">
              Revenue Divisional Office
            </h2>
          </div>

          <div className="w-24 h-1.5 bg-emerald-500 rounded-full" />

          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed pt-1">
            Serving the people with transparency, accountability and efficiency.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THE 5 SERVICE TILES (EXACT FIRST PHOTO MODEL DESIGN) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* CARD 1: RDO Login Pending */}
        <div
          onClick={() => onNavigate('rdoPendencyTab')}
          className="group bg-gradient-to-b from-teal-50/70 via-white to-white rounded-2xl border border-teal-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1b7a70] text-white flex items-center justify-center shadow-lg shadow-teal-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-teal-700 transition-colors">
              RDO Login Pending
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Check your application status and pending files
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#1b7a70] text-white flex items-center justify-center shadow-md group-hover:bg-[#135f57] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: Sadabainama */}
        <div
          onClick={() => onNavigate('sadabainamaTab')}
          className="group bg-gradient-to-b from-sky-50/70 via-white to-white rounded-2xl border border-sky-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-sky-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1e78a6] text-white flex items-center justify-center shadow-lg shadow-sky-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <FileCheck className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-sky-700 transition-colors">
              Sadabainama
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              View and download Sadabainama details
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#1e78a6] text-white flex items-center justify-center shadow-md group-hover:bg-[#155d82] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 3: Bhu Bharati Files */}
        <div
          onClick={() => onNavigate('bhuBharatiTab')}
          className="group bg-gradient-to-b from-emerald-50/70 via-white to-white rounded-2xl border border-emerald-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1c8b67] text-white flex items-center justify-center shadow-lg shadow-emerald-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Layers className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-emerald-700 transition-colors">
              Bhu Bharati Files
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Track and manage Bhu Bharati files
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#1c8b67] text-white flex items-center justify-center shadow-md group-hover:bg-[#136b4e] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: Appeal Cases */}
        <div
          onClick={() => onNavigate('appealCasesTab')}
          className="group bg-gradient-to-b from-blue-50/70 via-white to-white rounded-2xl border border-blue-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-blue-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#2069b2] text-white flex items-center justify-center shadow-lg shadow-blue-700/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Scale className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-blue-700 transition-colors">
              Appeal Cases
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              Check appeal case status
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#2069b2] text-white flex items-center justify-center shadow-md group-hover:bg-[#154e87] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 5: Tapal Register */}
        <div
          onClick={() => onNavigate('tapalTab')}
          className="group bg-gradient-to-b from-teal-50/70 via-white to-white rounded-2xl border border-teal-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[290px]"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#237c6c] text-white flex items-center justify-center shadow-lg shadow-teal-800/25 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Mail className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-[#0c3559] group-hover:text-teal-800 transition-colors">
              Tapal Register
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-1">
              View tapal and outward despatch records
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#237c6c] text-white flex items-center justify-center shadow-md group-hover:bg-[#185e51] group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>
    </div>
  );
};