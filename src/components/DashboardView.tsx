import React from 'react';
import { StaffUser } from '../types';
import { 
  FileSpreadsheet, 
  FileCheck, 
  Layers, 
  Scale, 
  Mail, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Clock, 
  Users,
  Building,
  ShieldCheck,
  Sparkles
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
  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-4">
      {/* ============================================================ */}
      {/* 1. HERO SECTION: WELCOME & OFFICIAL BUILDING SHOWCASE */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50/70 via-sky-50/50 to-white rounded-3xl border border-emerald-100/80 shadow-xs p-6 md:p-10 lg:p-12">
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Welcome to</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f3057] tracking-tight">
                RDO Huzurnagar
              </h1>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-700">
                Revenue Divisional Office
              </h2>
            </div>

            <div className="w-20 h-1 bg-emerald-500 rounded-full" />

            <p className="text-sm md:text-base text-slate-600 font-medium max-w-lg leading-relaxed pt-1">
              Serving the people with transparency, accountability and efficiency under Government of Telangana Revenue Administration.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 bg-white/80 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Huzurnagar Division
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <Building className="w-4 h-4 text-sky-600" />
                7 Mandals Jurisdiction
              </span>
            </div>
          </div>

          {/* Right Building Showcase Frame */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none group">
              {/* Outer soft ambient gradient glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-teal-500/20 rounded-3xl blur-md group-hover:blur-lg transition duration-500" />

              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[16/10]">
                <img
                  src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop"
                  alt="Revenue Divisional Office Huzurnagar"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                />

                {/* Overhead Office Signboard Bar */}
                <div className="absolute top-4 inset-x-4 bg-gradient-to-r from-[#0d2e53]/95 via-[#134674]/95 to-[#0d2e53]/95 border border-amber-400/60 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-amber-300 drop-shadow-xs">
                      REVENUE DIVISIONAL OFFICE • HUZURNAGAR
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-200 hidden sm:inline">D-Section Live</span>
                </div>

                {/* Bottom subtle gradient shadow */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end px-4 pb-2">
                  <span className="text-[11px] text-white/90 font-medium">
                    Suryapet District • Digital Governance Portal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THE 5 SERVICE TILES (MATCHING MODEL SCREENSHOT) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* CARD 1: RDO Login Pending */}
        <div
          onClick={() => onNavigate('rdoPendencyTab')}
          className="group bg-gradient-to-b from-teal-50/60 via-white to-white rounded-2xl border border-teal-200/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
        >
          <div className="w-full flex flex-col items-center">
            {/* Top Rounded Square Icon */}
            <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/30 group-hover:scale-110 transition-transform duration-300 mb-4">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-[#0f3057] group-hover:text-teal-700 transition-colors">
              RDO Login Pending
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed px-2">
              Check your application status and pending files across modules
            </p>
          </div>

          {/* Bottom Circular Arrow Button */}
          <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 2: Sadabainama */}
        <div
          onClick={() => onNavigate('sadabainamaTab')}
          className="group bg-gradient-to-b from-sky-50/60 via-white to-white rounded-2xl border border-sky-200/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-sky-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 group-hover:scale-110 transition-transform duration-300 mb-4">
              <FileCheck className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-[#0f3057] group-hover:text-sky-700 transition-colors">
              Sadabainama
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed px-2">
              View and download Sadabainama details and abstract reports
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md group-hover:bg-sky-700 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 3: Bhu Bharati Files */}
        <div
          onClick={() => onNavigate('bhuBharatiTab')}
          className="group bg-gradient-to-b from-emerald-50/60 via-white to-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/30 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Layers className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-[#0f3057] group-hover:text-emerald-700 transition-colors">
              Bhu Bharati Files
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed px-2">
              Track and manage all 16 modules revenue land files & registers
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:bg-emerald-700 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 4: Appeal Cases */}
        <div
          onClick={() => onNavigate('appealCasesTab')}
          className="group bg-gradient-to-b from-indigo-50/60 via-white to-white rounded-2xl border border-indigo-200/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-indigo-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-700/30 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Scale className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-[#0f3057] group-hover:text-indigo-700 transition-colors">
              Appeal Cases
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed px-2">
              Check appeal case status, cause lists, hearings and final judgments
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:bg-indigo-700 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* CARD 5: Tapal Register */}
        <div
          onClick={() => onNavigate('tapalTab')}
          className="group bg-gradient-to-b from-teal-50/60 via-white to-white rounded-2xl border border-teal-200/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-2 hover:border-teal-500 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[260px] relative overflow-hidden"
        >
          <div className="w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-800/30 group-hover:scale-110 transition-transform duration-300 mb-4">
              <Mail className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-[#0f3057] group-hover:text-emerald-800 transition-colors">
              Tapal Register
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed px-2">
              Inward letters & outward despatches ledger tracking records
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md group-hover:bg-emerald-800 group-hover:scale-110 transition-all mt-4">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM CITIZEN INFO STRIP (MATCHING MODEL SCREENSHOT) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Info 1 */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">RDO Huzurnagar</div>
              <div className="text-[11px] text-slate-500 font-medium">Suryapet Dist, TG</div>
            </div>
          </div>

          {/* Info 2 */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Helpline</div>
              <div className="text-[11px] text-slate-500 font-medium">(For Citizen Services)</div>
            </div>
          </div>

          {/* Info 3 */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Office Hours</div>
              <div className="text-[11px] text-slate-500 font-medium">Mon - Fri 10:30 AM - 5:00 PM</div>
            </div>
          </div>

          {/* Info 4 */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Citizen Services</div>
              <div className="text-[11px] text-slate-500 font-medium">Your Service | Our Priority</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};