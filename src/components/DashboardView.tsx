import React from 'react';
import { StaffUser } from '../types';
import { 
  FileSpreadsheet, 
  Mail, 
  Scale, 
  FileCheck2, 
  FolderGit2, 
  ExternalLink, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity, 
  MapPin, 
  Sparkles,
  FolderOpen,
  Send,
  PlusCircle
} from 'lucide-react';
import { ActiveTab } from './Navigation';

interface DashboardViewProps {
  files: any[];
  inwards: any[];
  outwards: any[];
  staff: StaffUser[];
  appealCases?: any[];
  sadabainamaAbstract?: any[][] | null;
  currentUser?: StaffUser | null;
  onNavigate: (tab: ActiveTab, filterState?: any) => void;
  onNewFile: () => void;
  onNewInward: () => void;
  onNewOutward: () => void;
  onOpenAdmin: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  files,
  inwards,
  outwards,
  appealCases = [],
  sadabainamaAbstract,
  currentUser,
  onNavigate,
  onNewFile,
  onNewInward,
  onNewOutward,
}) => {
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';

  const totalBhu = files.length;
  const totalInward = inwards.length;
  const totalOutward = outwards.length;
  const totalAppeals = appealCases.length;
  const finalOrdersCount = appealCases.filter(c => c.status?.toLowerCase().includes('final order') || Boolean(c.finalOrderNo)).length;

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* TOP DASHBOARD BANNER */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#06182c] via-[#0d2e53] to-[#06182c] text-white p-5 md:p-6 rounded-2xl shadow-xl border-t-2 border-amber-400 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-0.5 shadow-xl shadow-amber-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#071d36] rounded-[14px] flex items-center justify-center text-amber-300">
                <Scale className="w-6 h-6 md:w-7 md:h-7" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md shadow-xs">
                  Executive Control Center
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 rounded-md border border-blue-400/30">
                  D Section Master Operations
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  Revenue Divisional Office, Huzurnagar • Suryapet District
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white drop-shadow-sm">
                REVENUE DIVISIONAL OFFICE, HUZURNAGAR
              </h1>
              <p className="text-xs text-blue-100 font-medium max-w-3xl mt-0.5">
                Centralized dashboard for Appeal Court Cases, Bhu Bharati Land Records, Sadabainama Regularization, and Tapal Inward/Outward Correspondence
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS COMMAND HUB */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-white backdrop-blur-md rounded-2xl border border-slate-200/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-400" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Quick Actions &amp; Navigation
          </span>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            • Fast entry and registry access
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isViewer && (
            <>
              <button
                onClick={onNewFile}
                className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/90 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Create New Bhu Bharati File Entry"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>+ Bhu File</span>
              </button>

              <button
                onClick={onNewInward}
                className="bg-amber-50 hover:bg-amber-500 text-amber-900 hover:text-slate-950 border border-amber-200/90 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Log New Inward Tapal Letter"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>+ Inward Tapal</span>
              </button>

              <button
                onClick={onNewOutward}
                className="bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200/90 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Despatch Outward Letter"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Outward</span>
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate('appealCasesTab')}
            className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/90 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Open RDO Revenue Court Cause List"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Court Cause List</span>
          </button>

          <button
            onClick={() => onNavigate('sadabainamaTab')}
            className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/90 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Open Sadabainama Abstract & Reports"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sadabainama Abstract</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5-BOX STRUCTURED GRID (ONLY 5 BOXES & SIDE WIDGETS) */}
      {/* ============================================================ */}
      <div className="space-y-4">
        
        {/* ROW 1: RDO LOGIN PENDENCY & SADABAINAMA (2 BOXES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Box 1: RDO Login Pendency */}
          <div 
            onClick={() => onNavigate('rdoPendencyTab')}
            className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-white hover:to-amber-50/50 rounded-2xl border-2 border-amber-300 hover:border-amber-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[195px]"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />
            
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200 shadow-xs">
                  RDO Login Focus
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3 group-hover:text-amber-700 transition-colors">
                RDO Login Pendency
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Consolidated live pendency across modules, mandal breakdown, unique files tracker with one-click print reports.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                Live Module Monitoring
              </span>
              <span className="font-bold text-amber-600 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                Open Pendency View <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Box 2: Sadabainama */}
          <div 
            onClick={() => onNavigate('sadabainamaTab')}
            className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/50 rounded-2xl border-2 border-emerald-300 hover:border-emerald-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[195px]"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 shadow-xs">
                  Regularisation
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3 group-hover:text-emerald-700 transition-colors">
                Sadabainama
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Sadabainama abstract monitoring and detailed village-wise regularisation report with dual frozen headers and Excel upload.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                13,774 Apps • 48 Approved Sy.Nos
              </span>
              <span className="font-bold text-emerald-600 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                Explore Portal <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>

        {/* ROW 2: CENTER HERO (BHU BHARATI FILES) WITH LEFT & RIGHT GAP WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Left Side Gap Widget */}
          <div className="hidden lg:flex lg:col-span-3 bg-gradient-to-br from-slate-900 via-[#0a1f33] to-[#071726] rounded-2xl p-4.5 text-white shadow-md border border-slate-700/60 flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Division Status</span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-white">7 Mandals</div>
                <div className="text-[11.5px] text-slate-300 font-medium leading-tight mt-0.5">
                  Revenue Division, Huzurnagar
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1.5 border-b border-white/10 text-slate-300">
                  <span>Operating Section</span>
                  <strong className="text-amber-300 font-black">D-Section</strong>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/10 text-slate-300">
                  <span>Sync Architecture</span>
                  <strong className="text-emerald-400 font-black">Cloud Synced</strong>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10.5px] text-slate-400 flex items-center gap-1.5 border-t border-white/10">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Suryapet District, Telangana</span>
            </div>
          </div>

          {/* Box 3: CENTER HERO - Bhu Bharati Files */}
          <div 
            onClick={() => onNavigate('bhuBharatiTab')}
            className="lg:col-span-6 group relative overflow-hidden bg-gradient-to-b from-white via-white to-blue-50/40 rounded-2xl border-2 border-blue-400 hover:border-blue-600 p-6 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between ring-4 ring-blue-500/10 min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
            <div className="absolute -left-4 -bottom-4 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

            <div>
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:bg-blue-700 transition-all">
                  <FolderGit2 className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-amber-400 text-slate-950 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    Core Registry
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                    16 Modules
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 mt-4 group-hover:text-blue-700 transition-colors">
                Bhu Bharati Files
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                Log, track, filter and manage all revenue land files across 16 approved modules including Pending Mutation, Extent Correction, and Succession with instant search.
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-blue-100 flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 bg-blue-100/80 px-3 py-1 rounded-lg border border-blue-200/80">
                {totalBhu} Active Files
              </span>
              <span className="font-black text-xs text-blue-600 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                Open Main Registry <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Right Side Gap Widget */}
          <div className="hidden lg:flex lg:col-span-3 bg-gradient-to-br from-slate-900 via-[#0a1f33] to-[#071726] rounded-2xl p-4.5 text-white shadow-md border border-slate-700/60 flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Revenue Portals</span>
              </div>

              <div className="mt-3 space-y-2">
                <a 
                  href="https://bhubharati.telangana.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition group"
                >
                  <span>Bhu Bharati TG</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                </a>

                <a 
                  href="https://dharani.telangana.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition group"
                >
                  <span>Dharani Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-white/10">
              <span>Huzurnagar SDM Court</span>
              <strong className="text-amber-400 font-black">Act 2025</strong>
            </div>
          </div>

        </div>

        {/* ROW 3: TAPAL REGISTER & APPEAL CASES (2 BOXES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Box 4: Tapal Register */}
          <div 
            onClick={() => onNavigate('tapalTab')}
            className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-white hover:to-amber-50/50 rounded-2xl border-2 border-amber-300 hover:border-amber-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[195px]"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200 shadow-xs">
                  Inward &amp; Outward
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3 group-hover:text-amber-700 transition-colors">
                Tapal Register
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Dedicated ledger to record Inward Tapal received from MROs/citizens and manage Outward Despatches forwarded to IDOC Collectorate or other offices.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                {totalInward} Tapals • {totalOutward} Despatches
              </span>
              <span className="font-bold text-amber-600 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                Open Ledger <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Box 5: Appeal Cases */}
          <div 
            onClick={() => onNavigate('appealCasesTab')}
            className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/50 rounded-2xl border-2 border-indigo-300 hover:border-indigo-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between min-h-[195px]"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-400/10 rounded-full blur-2xl group-hover:bg-indigo-400/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Scale className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200 shadow-xs">
                  Revenue Court
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 mt-3 group-hover:text-indigo-700 transition-colors">
                Appeal Cases
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                RDO Court Revenue Appeal cases register, cause lists, hearings, and signed Final Orders copy upload &amp; verification (RoR, Tenancy, Inams).
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200/60">
                {totalAppeals} Appeals • {finalOrdersCount} Final Orders
              </span>
              <span className="font-bold text-indigo-600 group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                Court Register <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};