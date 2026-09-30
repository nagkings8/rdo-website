import React from 'react';
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
  // Reliable high-resolution government office building visual matching Model Photo 1
  const buildingPhotoUrl = "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1400&auto=format&fit=crop";

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-4">
      {/* ============================================================ */}
      {/* 1. HERO SECTION: EXACT MODEL WITH CURVED GREEN ACCENT */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#ebf7f0] via-[#f4faf6] to-[#e8f5ed] rounded-3xl border border-emerald-100 shadow-xs p-6 md:p-10 lg:p-12">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Bottom Curve Ribbon */}
        <div className="absolute -bottom-12 -left-10 w-[120%] h-36 bg-gradient-to-r from-emerald-500/20 via-emerald-600/30 to-teal-500/20 blur-xl transform -rotate-2 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-sm md:text-base font-bold text-emerald-800 tracking-wide">
              Welcome to
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0c3559] tracking-tight">
                RDO Huzurnagar
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-700">
                Revenue Divisional Office
              </h2>
            </div>

            <div className="w-24 h-1.5 bg-emerald-500 rounded-full" />

            <p className="text-sm md:text-base text-slate-600 font-medium max-w-lg leading-relaxed pt-1">
              Serving the people with transparency, accountability and efficiency.
            </p>
          </div>

          {/* Right Building Showcase Frame */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none group">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/30 via-teal-400/20 to-sky-400/30 rounded-3xl blur-lg transition duration-500" />

              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[16/10] bg-[#0c3559]">
                <img
                  src={buildingPhotoUrl}
                  alt="Revenue Divisional Office Huzurnagar Building"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Overlaid Signboard Bar */}
                <div className="absolute top-4 inset-x-6 bg-[#0c3559]/95 border-2 border-sky-400/80 rounded-lg px-4 py-2 shadow-xl backdrop-blur-md flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-white drop-shadow-md text-center">
                    REVENUE DIVISIONAL OFFICE • HUZURNAGAR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THE 5 SERVICE CARDS (MATCHING MODEL PHOTO 1) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* CARD 1: RDO Login Pending */}
        <div
          onClick={() => onNavigate('rdoPendencyTab')}
          className="group bg-gradient-to-b from-teal-50/70 via-white to-white rounded-2xl border border-teal-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[280px]"
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
          className="group bg-gradient-to-b from-sky-50/70 via-white to-white rounded-2xl border border-sky-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-sky-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[280px]"
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
          className="group bg-gradient-to-b from-emerald-50/70 via-white to-white rounded-2xl border border-emerald-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[280px]"
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
          className="group bg-gradient-to-b from-blue-50/70 via-white to-white rounded-2xl border border-blue-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-blue-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[280px]"
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
          className="group bg-gradient-to-b from-teal-50/70 via-white to-white rounded-2xl border border-teal-100 p-6 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-400 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[280px]"
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