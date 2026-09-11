import React from 'react';
import { BhuFile, InwardTapal, OutwardDespatch, StaffUser, AppealCase } from '../types';
import { FolderOpen, Mail, ArrowRight, PlusCircle, Send, Printer, Scale, FileSpreadsheet, Clock, CheckCircle2, AlertCircle, MapPin, Activity, Sparkles } from 'lucide-react';
import { ActiveTab } from './Navigation';
import { printTableReport } from '../utils/printReport';
import { DEFAULT_SADABAINAMA_ABSTRACT } from '../data/sadabainamaData';

interface DashboardViewProps {
  files: BhuFile[];
  inwards: InwardTapal[];
  outwards: OutwardDespatch[];
  staff: StaffUser[];
  appealCases?: AppealCase[];
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
  staff,
  appealCases = [],
  sadabainamaAbstract,
  currentUser,
  onNavigate,
  onNewFile,
  onNewInward,
  onNewOutward,
  onOpenAdmin,
}) => {
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = currentUser?.role === 'STAFF';
  // Bhu Bharati metrics
  const totalBhu = files.length;
  const pendingBhu = files.filter(f => f.status === 'Pending at RDO' || f.status === 'Received from MRO').length;
  const forwardedBhu = files.filter(f => f.status === 'Forwarded to Collectorate').length;
  const returnedBhu = files.filter(f => f.status === 'Returned to MRO').length;
  const returnedCollBhu = files.filter(f => f.status === 'Returned from Collectorate').length;
  const completedBhu = files.filter(f => f.status === 'Completed').length;

  // Tapal Register metrics
  const totalInward = inwards.length;
  const scrutinyInward = inwards.filter(t => t.status === 'Under Scrutiny').length;
  const disposedInward = inwards.filter(t => t.status === 'Disposed').length;

  const outwardToMro = outwards.filter(o => (o.sentTo || '').includes('MRO')).length;
  const outwardToCollectorate = outwards.filter(o => (o.sentTo || '').includes('Collectorate')).length;
  const totalOutward = outwards.length;

  // Appeal Cases metrics
  const totalAppeals = appealCases.length;
  const finalOrdersCount = appealCases.filter(c => c.status.toLowerCase().includes('final order') || Boolean(c.finalOrderNo)).length;
  const hearingAppealsCount = appealCases.filter(c => c.status === 'Under Hearing' || c.status === 'Reserved for Orders' || c.status === 'Interim Stay Granted').length;

  // Sadabainama Abstract metrics
  const currentAbstract = sadabainamaAbstract || DEFAULT_SADABAINAMA_ABSTRACT;
  const abstractStats = React.useMemo(() => {
    if (!currentAbstract || currentAbstract.length === 0) {
      return {
        totalApps: '13,774',
        pendingTah: '125',
        pendingRdo: '159',
        approvedSyNos: '48',
        totalSurveys: '15,173',
      };
    }

    let headerRowIdx = 0;
    const row0 = currentAbstract[0] || [];
    const row1 = currentAbstract[1] || [];
    const row0FirstCell = String(row0[0] || '').trim();
    if (
      row0FirstCell.toLowerCase().includes('sadabainama') ||
      row0FirstCell.toLowerCase().includes('abstract') ||
      (row0.filter((c: any) => String(c || '').trim() !== '').length <= 2 && row1 && row1.length > 2)
    ) {
      headerRowIdx = 1;
    }

    const header = currentAbstract[headerRowIdx] || [];
    const rest = currentAbstract.slice(headerRowIdx + 1);

    let totalRow: any[] | null = null;
    const dataRows: any[][] = [];
    for (const row of rest) {
      if (row.some((c: any) => String(c || '').trim().toUpperCase() === 'TOTAL')) {
        totalRow = row;
      } else if (row.some((c: any) => String(c || '').trim() !== '')) {
        dataRows.push(row);
      }
    }

    const headerNormalized = (header || []).map((h: any) => String(h || '').trim().toLowerCase());
    const totalAppsIdx = headerNormalized.findIndex((h: string) => (h.includes('total application') || h.includes('total apps') || h === 'applications' || h === 'total applications') && !h.includes('pending') && !h.includes('completed'));
    const pendingTahIdx = headerNormalized.findIndex((h: string) => (h.includes('pending at tahsildar') || h.includes('pending_tahsildar')) && !h.includes('survey'));
    const pendingRdoIdx = headerNormalized.findIndex((h: string) => (h.includes('pending at rdo') || h.includes('pending_rdo')) && !h.includes('survey'));
    const approvedSyNosIdx = headerNormalized.findIndex((h: string) => h.includes('approved by rdo') || h.includes('survey approved') || h.includes('approved sy') || (h.includes('approved') && h.includes('survey')));
    const totalSurveysIdx = headerNormalized.findIndex((h: string) => (h.includes('total survey') || h.includes('survey numbers') || h === 'survey numbers' || h === 'total survey numbers') && !h.includes('pending') && !h.includes('approved') && !h.includes('rejected'));

    const appsCol = totalAppsIdx !== -1 ? totalAppsIdx : 2;
    const surveysCol = totalSurveysIdx !== -1 ? totalSurveysIdx : 3;
    const pendingTahCol = pendingTahIdx !== -1 ? pendingTahIdx : 5;
    const pendingRdoCol = pendingRdoIdx !== -1 ? pendingRdoIdx : 6;
    const approvedSyNosCol = approvedSyNosIdx !== -1 ? approvedSyNosIdx : 10;

    const parseNum = (val: any) => {
      const cleaned = String(val || '').replace(/,/g, '').trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };

    if (totalRow) {
      return {
        totalApps: String(totalRow[appsCol] || '13,774'),
        pendingTah: String(totalRow[pendingTahCol] || '125'),
        pendingRdo: String(totalRow[pendingRdoCol] || '159'),
        approvedSyNos: String(totalRow[approvedSyNosCol] || '48'),
        totalSurveys: String(totalRow[surveysCol] || '15,173'),
      };
    }

    let sumApps = 0;
    let sumSurveys = 0;
    let sumPendingTah = 0;
    let sumPendingRdo = 0;
    let sumApprovedSyNos = 0;

    dataRows.forEach((row) => {
      sumApps += parseNum(row[appsCol]);
      sumSurveys += parseNum(row[surveysCol]);
      sumPendingTah += parseNum(row[pendingTahCol]);
      sumPendingRdo += parseNum(row[pendingRdoCol]);
      sumApprovedSyNos += parseNum(row[approvedSyNosCol]);
    });

    return {
      totalApps: sumApps > 0 ? sumApps.toLocaleString('en-IN') : '13,774',
      pendingTah: sumPendingTah > 0 ? sumPendingTah.toLocaleString('en-IN') : '125',
      pendingRdo: sumPendingRdo > 0 ? sumPendingRdo.toLocaleString('en-IN') : '159',
      approvedSyNos: sumApprovedSyNos > 0 ? sumApprovedSyNos.toLocaleString('en-IN') : '48',
      totalSurveys: sumSurveys > 0 ? sumSurveys.toLocaleString('en-IN') : '15,173',
    };
  }, [currentAbstract]);

  const handlePrintSummary = () => {
    const tableHtml = `
      <h3 style="margin: 15px 0 6px 0; color: #164875; font-size: 12px; font-weight: 800;">1. Bhu Bharati Land Files Status</h3>
      <table>
        <thead>
          <tr>
            <th style="background: #164875; color: #fff;">Metric / Category</th>
            <th style="background: #164875; color: #fff; text-align: center; width: 120px;">Count</th>
            <th style="background: #164875; color: #fff; text-align: center; width: 100px;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Total Active Bhu Bharati Files</td><td style="text-align: center; font-weight: bold;">${totalBhu}</td><td style="text-align: center;">100%</td></tr>
          <tr><td>Pending at RDO / Received from MRO</td><td style="text-align: center; font-weight: bold; background: #ffffc8;">${pendingBhu}</td><td style="text-align: center;">${totalBhu ? Math.round((pendingBhu / totalBhu) * 100) : 0}%</td></tr>
          <tr><td>Forwarded to Collectorate</td><td style="text-align: center; font-weight: bold;">${forwardedBhu}</td><td style="text-align: center;">${totalBhu ? Math.round((forwardedBhu / totalBhu) * 100) : 0}%</td></tr>
          <tr><td>Returned to MRO / Clarifications</td><td style="text-align: center; font-weight: bold;">${returnedBhu}</td><td style="text-align: center;">${totalBhu ? Math.round((returnedBhu / totalBhu) * 100) : 0}%</td></tr>
          <tr><td>Completed / Disposed</td><td style="text-align: center; font-weight: bold; background: #dcfce7;">${completedBhu}</td><td style="text-align: center;">${totalBhu ? Math.round((completedBhu / totalBhu) * 100) : 0}%</td></tr>
        </tbody>
      </table>

      <h3 style="margin: 15px 0 6px 0; color: #164875; font-size: 12px; font-weight: 800;">2. Tapal Correspondence (Inward &amp; Outward)</h3>
      <table>
        <thead>
          <tr>
            <th style="background: #164875; color: #fff;">Correspondence Stream</th>
            <th style="background: #164875; color: #fff; text-align: center; width: 120px;">Total</th>
            <th style="background: #164875; color: #fff; text-align: center;">Under Scrutiny / In Progress</th>
            <th style="background: #164875; color: #fff; text-align: center;">Disposed / Sent</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Inward Tapal Receipts</td>
            <td style="text-align: center; font-weight: bold;">${totalInward}</td>
            <td style="text-align: center; font-weight: bold; background: #ffffc8;">${scrutinyInward}</td>
            <td style="text-align: center; font-weight: bold; background: #dcfce7;">${disposedInward}</td>
          </tr>
          <tr>
            <td>Outward Despatches</td>
            <td style="text-align: center; font-weight: bold;">${totalOutward}</td>
            <td style="text-align: center;">To MROs: ${outwardToMro}</td>
            <td style="text-align: center; font-weight: bold; background: #dcfce7;">To Collectorate: ${outwardToCollectorate}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin: 15px 0 6px 0; color: #164875; font-size: 12px; font-weight: 800;">3. Sadabainama Abstract Regularisation</h3>
      <table>
        <thead>
          <tr>
            <th style="background: #164875; color: #fff; text-align: center;">Total Applications</th>
            <th style="background: #164875; color: #fff; text-align: center;">Pending at Tahsildar</th>
            <th style="background: #164875; color: #fff; text-align: center;">Pending at RDO</th>
            <th style="background: #164875; color: #fff; text-align: center;">Approved Sy.Nos</th>
            <th style="background: #164875; color: #fff; text-align: center;">Total Survey Numbers</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: bold; text-align: center;">${abstractStats.totalApps}</td>
            <td style="text-align: center; font-weight: bold; background: #ffffc8;">${abstractStats.pendingTah}</td>
            <td style="text-align: center; font-weight: bold; background: #ffedd5;">${abstractStats.pendingRdo}</td>
            <td style="text-align: center; font-weight: bold; background: #dcfce7;">${abstractStats.approvedSyNos}</td>
            <td style="text-align: center; font-weight: bold;">${abstractStats.totalSurveys}</td>
          </tr>
        </tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'D Section Executive Summary Report',
      subtitle: 'Revenue Divisional Office, Huzurnagar • Suryapet District',
      period: 'Current Operational Status',
      landscape: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* TOP DASHBOARD BANNER (MATCHING APPEAL CASES STYLE) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#06182c] via-[#0d2e53] to-[#06182c] text-white p-5 md:p-6 rounded-2xl shadow-xl border-t-2 border-amber-400 relative overflow-hidden">
        {/* Top ambient glass reflection */}
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

          <div className="flex flex-wrap items-center gap-2.5">
            {!isViewer && (
              <button
                onClick={handlePrintSummary}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-white/20 shadow-sm transition backdrop-blur-md cursor-pointer"
                title="Print Executive Summary Report"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Print Executive Summary</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXECUTIVE OPERATIONS QUICK ACTION COMMAND HUB */}
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

      {/* Portal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Portal 1: Bhu Bharati */}
        <div
          onClick={() => onNavigate('bhuBharatiTab')}
          className="group relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-blue-50/50 backdrop-blur-md border-2 border-slate-200/80 border-t-4 border-t-blue-600 rounded-2xl p-5 cursor-pointer shadow-md hover:shadow-[0_20px_35px_-10px_rgba(37,99,235,0.3),0_4px_12px_rgba(37,99,235,0.1)] hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[210px]"
        >
          {/* Top glossy specular reflection */}
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-2xl" />
          {/* Subtle bottom colorful aura on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300">
                <FolderOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 shadow-xs">
                16 Modules
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors duration-200 mb-1">
              Bhu Bharati Files
            </h3>
            <p className="text-xs text-slate-600 group-hover:text-slate-700 leading-relaxed transition-colors duration-200">
              Log, track, filter and manage all revenue land files across 16 approved modules including Pending Mutation, Extent Correction, and Succession.
            </p>
          </div>
          <div className="relative z-10 flex justify-between items-center border-t border-slate-200/60 pt-3 mt-4 text-xs font-black text-blue-600 group-hover:text-blue-700 transition-colors">
            <span>{totalBhu} Active Files</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-blue-600" />
          </div>
        </div>

        {/* Portal 2: Tapal Register */}
        <div
          onClick={() => onNavigate('tapalTab')}
          className="group relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-amber-50/50 backdrop-blur-md border-2 border-slate-200/80 border-t-4 border-t-amber-500 rounded-2xl p-5 cursor-pointer shadow-md hover:shadow-[0_20px_35px_-10px_rgba(217,119,6,0.3),0_4px_12px_rgba(217,119,6,0.1)] hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[210px]"
        >
          {/* Top glossy specular reflection */}
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-2xl" />
          {/* Subtle bottom colorful aura on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-amber-500/40 transition-all duration-300">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-500 transition-all duration-300 shadow-xs">
                Inward &amp; Outward
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors duration-200 mb-1">
              Tapal Register
            </h3>
            <p className="text-xs text-slate-600 group-hover:text-slate-700 leading-relaxed transition-colors duration-200">
              Dedicated ledger to record Inward Tapal received from MROs/citizens and manage Outward Despatches forwarded to IDOC Collectorate or other offices.
            </p>
          </div>
          <div className="relative z-10 flex justify-between items-center border-t border-slate-200/60 pt-3 mt-4 text-xs font-black text-amber-700 group-hover:text-amber-800 transition-colors">
            <span>{totalInward} Tapals • {totalOutward} Despatches</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-amber-600" />
          </div>
        </div>

        {/* Portal 3: Sadabainama */}
        <div
          onClick={() => onNavigate('sadabainamaTab')}
          className="group relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-emerald-50/50 backdrop-blur-md border-2 border-slate-200/80 border-t-4 border-t-emerald-600 rounded-2xl p-5 cursor-pointer shadow-md hover:shadow-[0_20px_35px_-10px_rgba(16,185,129,0.3),0_4px_12px_rgba(16,185,129,0.1)] hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[210px]"
        >
          {/* Top glossy specular reflection */}
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-2xl" />
          {/* Subtle bottom colorful aura on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/40 transition-all duration-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300 shadow-xs">
                Regularisation
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors duration-200 mb-1">
              Sadabainama
            </h3>
            <p className="text-xs text-slate-600 group-hover:text-slate-700 leading-relaxed transition-colors duration-200">
              Sadabainama abstract monitoring and detailed village-wise regularisation report with dual frozen headers and Excel upload.
            </p>
          </div>
          <div className="relative z-10 flex justify-between items-center border-t border-slate-200/60 pt-3 mt-4 text-xs font-black text-emerald-700 group-hover:text-emerald-800 transition-colors">
            <span>{abstractStats.totalApps} Apps • {abstractStats.approvedSyNos} Approved Sy.Nos</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-emerald-600" />
          </div>
        </div>

        {/* Portal 4: Appeal Cases (COURT CASES & FINAL ORDERS) */}
        <div
          onClick={() => onNavigate('appealCasesTab')}
          className="group relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-indigo-50/50 backdrop-blur-md border-2 border-slate-200/80 border-t-4 border-t-indigo-600 rounded-2xl p-5 cursor-pointer shadow-md hover:shadow-[0_20px_35px_-10px_rgba(99,102,241,0.3),0_4px_12px_rgba(99,102,241,0.1)] hover:border-indigo-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[210px]"
        >
          {/* Top glossy specular reflection */}
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-t-2xl" />
          {/* Subtle bottom colorful aura on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/40 transition-all duration-300">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-xs">
                Revenue Court
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors duration-200 mb-1">
              Appeal Cases
            </h3>
            <p className="text-xs text-slate-600 group-hover:text-slate-700 leading-relaxed transition-colors duration-200">
              RDO Court Revenue Appeal cases register, cause lists, hearings, and signed Final Orders copy upload &amp; verification (RoR, Tenancy, Inams).
            </p>
          </div>
          <div className="relative z-10 flex justify-between items-center border-t border-slate-200/60 pt-3 mt-4 text-xs font-black text-indigo-700 group-hover:text-indigo-800 transition-colors">
            <span>{totalAppeals} Appeals • {finalOrdersCount} Final Orders</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* BHU BHARATI DASHBOARD METRICS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-slate-50/80 backdrop-blur-md border border-slate-200/90 border-t-4 border-t-blue-600 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200/70 pb-4 mb-5">
          <div className="flex items-center gap-2.5 text-lg font-black text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FolderOpen className="w-4.5 h-4.5" />
            </div>
            <span>Bhu Bharati Files Dashboard (16 Revenue Modules)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
              Revenue Land Files
            </span>
            {!isViewer && (
              <button
                onClick={onNewFile}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition hover:shadow-md cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New File Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Breakdown Bar */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 mb-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 mb-2 gap-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Division File Movement &amp; Resolution Ratio</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Completed: <strong className="text-emerald-700 font-black">{completedBhu}</strong> ({totalBhu ? Math.round((completedBhu / totalBhu) * 100) : 0}%) • Under Active Process: <strong className="text-blue-900 font-black">{totalBhu - completedBhu}</strong>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${totalBhu ? (completedBhu / totalBhu) * 100 : 0}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Completed: ${completedBhu}`}
            />
            <div
              style={{ width: `${totalBhu ? (forwardedBhu / totalBhu) * 100 : 0}%` }}
              className="bg-sky-500 h-full transition-all duration-500"
              title={`Forwarded to Collectorate: ${forwardedBhu}`}
            />
            <div
              style={{ width: `${totalBhu ? (pendingBhu / totalBhu) * 100 : 0}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Pending at RDO: ${pendingBhu}`}
            />
            <div
              style={{ width: `${totalBhu ? ((returnedBhu + returnedCollBhu) / totalBhu) * 100 : 0}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Returned/Clarification: ${returnedBhu + returnedCollBhu}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed ({completedBhu})</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Collectorate Review ({forwardedBhu})</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending at RDO ({pendingBhu})</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Returned / Clarification ({returnedBhu + returnedCollBhu})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Bhu Bharati Files */}
          <div
            onClick={() => onNavigate('bhuBharatiTab', { status: '' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-blue-100/30 border border-slate-200/80 border-l-[6px] border-l-blue-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(37,99,235,0.28)] hover:border-blue-400 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-blue-800 tracking-wider uppercase group-hover:text-blue-900 transition-colors">
              TOTAL BHU BHARATI FILES
            </div>
            <div className="text-3xl md:text-4xl font-black text-blue-900 group-hover:text-blue-600 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {totalBhu}
            </div>
            <div className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Across All 7 Mandals →
            </div>
          </div>

          {/* Card 2: Pending at RDO */}
          <div
            onClick={() => onNavigate('bhuBharatiTab', { status: 'Pending at RDO' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30 border border-slate-200/80 border-l-[6px] border-l-amber-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(217,119,6,0.28)] hover:border-amber-400 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-amber-800 tracking-wider uppercase group-hover:text-amber-900 transition-colors">
              PENDING AT RDO
            </div>
            <div className="text-3xl md:text-4xl font-black text-amber-600 group-hover:text-amber-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {pendingBhu}
            </div>
            <div className="text-xs font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Action In-Progress →
            </div>
          </div>

          {/* Card 3: Forwarded to Collectorate */}
          <div
            onClick={() => onNavigate('bhuBharatiTab', { status: 'Forwarded to Collectorate' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-sky-50/20 to-sky-100/30 border border-slate-200/80 border-l-[6px] border-l-sky-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(14,165,233,0.28)] hover:border-sky-400 hover:bg-gradient-to-br hover:from-white hover:to-sky-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-sky-800 tracking-wider uppercase group-hover:text-sky-900 transition-colors">
              FORWARDED TO COLLECTORATE
            </div>
            <div className="text-3xl md:text-4xl font-black text-sky-600 group-hover:text-sky-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {forwardedBhu}
            </div>
            <div className="text-xs font-bold text-sky-600 group-hover:text-sky-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Under IDOC Review →
            </div>
          </div>

          {/* Card 4: Returned to MRO */}
          <div
            onClick={() => onNavigate('bhuBharatiTab', { status: 'Returned to MRO' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-red-50/20 to-red-100/30 border border-slate-200/80 border-l-[6px] border-l-red-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(239,68,68,0.28)] hover:border-red-400 hover:bg-gradient-to-br hover:from-white hover:to-red-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-red-800 tracking-wider uppercase group-hover:text-red-900 transition-colors">
              RETURNED TO MRO
            </div>
            <div className="text-3xl md:text-4xl font-black text-red-600 group-hover:text-red-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {returnedBhu}
            </div>
            <div className="text-xs font-bold text-red-600 group-hover:text-red-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Clarification Sought →
            </div>
          </div>

          {/* Card 5: Returned from Collectorate */}
          <div
            onClick={() => onNavigate('bhuBharatiTab', { status: 'Returned from Collectorate' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-rose-50/20 to-rose-100/30 border border-slate-200/80 border-l-[6px] border-l-rose-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(244,63,94,0.28)] hover:border-rose-400 hover:bg-gradient-to-br hover:from-white hover:to-rose-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-rose-800 tracking-wider uppercase group-hover:text-rose-900 transition-colors">
              RETURNED FROM COLLECTORATE
            </div>
            <div className="text-3xl md:text-4xl font-black text-rose-600 group-hover:text-rose-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {returnedCollBhu}
            </div>
            <div className="text-xs font-bold text-rose-600 group-hover:text-rose-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Re-examination Required →
            </div>
          </div>

          {/* Card 6: Disposed / Completed */}
          <div
            onClick={() => onNavigate('bhuBharatiTab', { status: 'Completed' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 border border-slate-200/80 border-l-[6px] border-l-emerald-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(16,185,129,0.28)] hover:border-emerald-400 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-emerald-800 tracking-wider uppercase group-hover:text-emerald-900 transition-colors">
              DISPOSED / COMPLETED
            </div>
            <div className="text-3xl md:text-4xl font-black text-emerald-600 group-hover:text-emerald-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {completedBhu}
            </div>
            <div className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Final Orders Issued →
            </div>
          </div>
        </div>
      </div>

      {/* TAPAL REGISTER DASHBOARD METRICS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-slate-50/80 backdrop-blur-md border border-slate-200/90 border-t-4 border-t-amber-500 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200/70 pb-4 mb-5">
          <div className="flex items-center gap-2.5 text-lg font-black text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <span>Tapal Register Dashboard (Inward &amp; Outward Correspondence)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80">
              Official Tapals &amp; Despatches
            </span>
            {!isViewer && (
              <>
                <button
                  onClick={onNewInward}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition hover:shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Inward</span>
                </button>
                <button
                  onClick={onNewOutward}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition hover:shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Outward</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tapal Inward vs Outward Progress Bar */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 mb-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 mb-2 gap-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Inward Correspondence Resolution Rate</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Disposed: <strong className="text-emerald-700 font-black">{disposedInward}</strong> ({totalInward ? Math.round((disposedInward / totalInward) * 100) : 0}%) • Under Scrutiny: <strong className="text-amber-800 font-black">{scrutinyInward}</strong>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${totalInward ? (disposedInward / totalInward) * 100 : 0}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Disposed: ${disposedInward}`}
            />
            <div
              style={{ width: `${totalInward ? (scrutinyInward / totalInward) * 100 : 0}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`Under Scrutiny: ${scrutinyInward}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disposed ({disposedInward})</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Under Scrutiny ({scrutinyInward})</span>
            <span className="inline-flex items-center gap-1 ml-auto text-slate-500 font-medium">Outwards to MROs: <strong className="text-slate-800 font-bold">{outwardToMro}</strong> • to Collectorate: <strong className="text-slate-800 font-bold">{outwardToCollectorate}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Inwards */}
          <div
            onClick={() => onNavigate('tapalTab', { type: 'inward', status: '' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-blue-100/30 border border-slate-200/80 border-l-[6px] border-l-blue-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(37,99,235,0.28)] hover:border-blue-400 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-blue-800 tracking-wider uppercase group-hover:text-blue-900 transition-colors">
              TOTAL INWARD TAPALS
            </div>
            <div className="text-3xl md:text-4xl font-black text-blue-900 group-hover:text-blue-600 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {totalInward}
            </div>
            <div className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              All Inward Letters →
            </div>
          </div>

          {/* Card 2: Under Scrutiny */}
          <div
            onClick={() => onNavigate('tapalTab', { type: 'inward', status: 'Under Scrutiny' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30 border border-slate-200/80 border-l-[6px] border-l-amber-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(217,119,6,0.28)] hover:border-amber-400 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-amber-800 tracking-wider uppercase group-hover:text-amber-900 transition-colors">
              UNDER SCRUTINY (INWARD)
            </div>
            <div className="text-3xl md:text-4xl font-black text-amber-600 group-hover:text-amber-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {scrutinyInward}
            </div>
            <div className="text-xs font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Initial Verification →
            </div>
          </div>

          {/* Card 3: Disposed Inwards */}
          <div
            onClick={() => onNavigate('tapalTab', { type: 'inward', status: 'Disposed' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 border border-slate-200/80 border-l-[6px] border-l-emerald-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(16,185,129,0.28)] hover:border-emerald-400 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-emerald-800 tracking-wider uppercase group-hover:text-emerald-900 transition-colors">
              DISPOSED INWARDS
            </div>
            <div className="text-3xl md:text-4xl font-black text-emerald-600 group-hover:text-emerald-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {disposedInward}
            </div>
            <div className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Action Completed →
            </div>
          </div>

          {/* Card 4: Forwarded to MRO (Outward) */}
          <div
            onClick={() => onNavigate('tapalTab', { type: 'outward', sentTo: 'Forwarded to MRO' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-sky-50/20 to-sky-100/30 border border-slate-200/80 border-l-[6px] border-l-sky-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(14,165,233,0.28)] hover:border-sky-400 hover:bg-gradient-to-br hover:from-white hover:to-sky-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-sky-800 tracking-wider uppercase group-hover:text-sky-900 transition-colors">
              FORWARDED TO MRO (OUTWARD)
            </div>
            <div className="text-3xl md:text-4xl font-black text-sky-600 group-hover:text-sky-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {outwardToMro}
            </div>
            <div className="text-xs font-bold text-sky-600 group-hover:text-sky-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Outward to Tahsildars →
            </div>
          </div>

          {/* Card 5: Forwarded to Collectorate (Outward) */}
          <div
            onClick={() => onNavigate('tapalTab', { type: 'outward', sentTo: 'Forwarded to Collectorate' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-purple-100/30 border border-slate-200/80 border-l-[6px] border-l-purple-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(168,85,247,0.28)] hover:border-purple-400 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-purple-800 tracking-wider uppercase group-hover:text-purple-900 transition-colors">
              FORWARDED TO COLLECTORATE (OUTWARD)
            </div>
            <div className="text-3xl md:text-4xl font-black text-purple-600 group-hover:text-purple-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {outwardToCollectorate}
            </div>
            <div className="text-xs font-bold text-purple-700 group-hover:text-purple-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Outward to IDOC →
            </div>
          </div>

          {/* Card 6: Total Outward Despatches */}
          <div
            onClick={() => onNavigate('tapalTab', { type: 'outward' })}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-rose-50/20 to-rose-100/30 border border-slate-200/80 border-l-[6px] border-l-rose-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(244,63,94,0.28)] hover:border-rose-400 hover:bg-gradient-to-br hover:from-white hover:to-rose-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-rose-800 tracking-wider uppercase group-hover:text-rose-900 transition-colors">
              TOTAL OUTWARD DESPATCHES
            </div>
            <div className="text-3xl md:text-4xl font-black text-rose-600 group-hover:text-rose-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {totalOutward}
            </div>
            <div className="text-xs font-bold text-rose-600 group-hover:text-rose-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              All Despatched Letters →
            </div>
          </div>
        </div>
      </div>

      {/* SADABAINAMA DASHBOARD METRICS (IMMEDIATELY AFTER TAPAL REGISTER) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-slate-50/80 backdrop-blur-md border border-slate-200/90 border-t-4 border-t-emerald-600 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200/70 pb-4 mb-5">
          <div className="flex items-center gap-2.5 text-lg font-black text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <span>Sadabainama Dashboard (Abstract Monitoring &amp; Survey Numbers)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              Section 5A Regularisation
            </span>
            <button
              onClick={() => onNavigate('sadabainamaTab')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition hover:shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>View Sadabainama Portal</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Applications */}
          <div
            onClick={() => onNavigate('sadabainamaTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-blue-100/30 border border-slate-200/80 border-l-[6px] border-l-blue-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(37,99,235,0.28)] hover:border-blue-400 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-blue-800 tracking-wider uppercase group-hover:text-blue-900 transition-colors">
              TOTAL APPLICATIONS
            </div>
            <div className="text-3xl md:text-4xl font-black text-blue-900 group-hover:text-blue-600 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {abstractStats.totalApps}
            </div>
            <div className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Total applications filed →
            </div>
          </div>

          {/* Card 2: Pending at Tahsildar */}
          <div
            onClick={() => onNavigate('sadabainamaTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30 border border-slate-200/80 border-l-[6px] border-l-amber-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(217,119,6,0.28)] hover:border-amber-400 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-amber-800 tracking-wider uppercase group-hover:text-amber-900 transition-colors">
              PENDING AT TAHSILDAR
            </div>
            <div className="text-3xl md:text-4xl font-black text-amber-600 group-hover:text-amber-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {abstractStats.pendingTah}
            </div>
            <div className="text-xs font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Field inquiry pending →
            </div>
          </div>

          {/* Card 3: Pending at RDO */}
          <div
            onClick={() => onNavigate('sadabainamaTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-purple-100/30 border border-slate-200/80 border-l-[6px] border-l-purple-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(147,51,234,0.28)] hover:border-purple-400 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-purple-800 tracking-wider uppercase group-hover:text-purple-900 transition-colors">
              PENDING AT RDO
            </div>
            <div className="text-3xl md:text-4xl font-black text-purple-600 group-hover:text-purple-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {abstractStats.pendingRdo}
            </div>
            <div className="text-xs font-bold text-purple-700 group-hover:text-purple-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Final sanction awaited →
            </div>
          </div>

          {/* Card 4: Approved Sy.Nos */}
          <div
            onClick={() => onNavigate('sadabainamaTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 border border-slate-200/80 border-l-[6px] border-l-emerald-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(16,185,129,0.28)] hover:border-emerald-400 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-emerald-800 tracking-wider uppercase group-hover:text-emerald-900 transition-colors">
              APPROVED SY.NOS
            </div>
            <div className="text-3xl md:text-4xl font-black text-emerald-600 group-hover:text-emerald-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {abstractStats.approvedSyNos}
            </div>
            <div className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Approved by RDO →
            </div>
          </div>

          {/* Card 5: Total Survey Numbers */}
          <div
            onClick={() => onNavigate('sadabainamaTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-teal-50/20 to-teal-100/30 border border-slate-200/80 border-l-[6px] border-l-teal-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(20,184,166,0.28)] hover:border-teal-400 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/70 hover:-translate-y-1.5 transition-all duration-300 col-span-2 sm:col-span-1"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-teal-800 tracking-wider uppercase group-hover:text-teal-900 transition-colors">
              TOTAL SURVEY NUMBERS
            </div>
            <div className="text-3xl md:text-4xl font-black text-teal-600 group-hover:text-teal-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {abstractStats.totalSurveys}
            </div>
            <div className="text-xs font-bold text-teal-700 group-hover:text-teal-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Across all 7 mandals →
            </div>
          </div>
        </div>
      </div>

      {/* APPEAL CASES DASHBOARD METRICS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-slate-50/80 backdrop-blur-md border border-slate-200/90 border-t-4 border-t-indigo-600 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200/70 pb-4 mb-5">
          <div className="flex items-center gap-2.5 text-lg font-black text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <span>Appeal Cases Dashboard (Revenue Court &amp; Final Orders)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80">
              RDO Court Register
            </span>
            <button
              onClick={() => onNavigate('appealCasesTab')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition hover:shadow-md cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>View Court Register</span>
            </button>
          </div>
        </div>

        {/* Appeal Cases Disposal Progress Bar */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 mb-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 mb-2 gap-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Revenue Court Case Status Breakdown</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Final Orders Issued: <strong className="text-emerald-700 font-black">{finalOrdersCount}</strong> ({totalAppeals ? Math.round((finalOrdersCount / totalAppeals) * 100) : 0}%) • Active Hearings: <strong className="text-amber-800 font-black">{hearingAppealsCount}</strong>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${totalAppeals ? (finalOrdersCount / totalAppeals) * 100 : 0}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Final Orders: ${finalOrdersCount}`}
            />
            <div
              style={{ width: `${totalAppeals ? (hearingAppealsCount / totalAppeals) * 100 : 0}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`Under Hearing: ${hearingAppealsCount}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Final Orders Pronounced ({finalOrdersCount})</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Under Hearing / Arguments ({hearingAppealsCount})</span>
            <span className="inline-flex items-center gap-1 ml-auto text-indigo-800 font-bold">RDO Huzurnagar Court Jurisdiction</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Appeal Cases */}
          <div
            onClick={() => onNavigate('appealCasesTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/20 to-indigo-100/30 border border-slate-200/80 border-l-[6px] border-l-indigo-600 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(99,102,241,0.28)] hover:border-indigo-400 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-indigo-800 tracking-wider uppercase group-hover:text-indigo-900 transition-colors">
              TOTAL APPEAL CASES
            </div>
            <div className="text-3xl md:text-4xl font-black text-indigo-900 group-hover:text-indigo-600 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {totalAppeals}
            </div>
            <div className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              All RDO Court Appeals →
            </div>
          </div>

          {/* Card 2: Under Hearing / Trial */}
          <div
            onClick={() => onNavigate('appealCasesTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30 border border-slate-200/80 border-l-[6px] border-l-amber-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(217,119,6,0.28)] hover:border-amber-400 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-amber-800 tracking-wider uppercase group-hover:text-amber-900 transition-colors">
              UNDER HEARING &amp; ORDERS
            </div>
            <div className="text-3xl md:text-4xl font-black text-amber-600 group-hover:text-amber-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {hearingAppealsCount}
            </div>
            <div className="text-xs font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Hearings / Arguments Active →
            </div>
          </div>

          {/* Card 3: Final Orders Issued */}
          <div
            onClick={() => onNavigate('appealCasesTab')}
            className="group relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 border border-slate-200/80 border-l-[6px] border-l-emerald-500 rounded-2xl p-4.5 cursor-pointer shadow-xs hover:shadow-[0_12px_26px_-6px_rgba(16,185,129,0.28)] hover:border-emerald-400 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/70 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
            <div className="text-[11px] font-black text-emerald-800 tracking-wider uppercase group-hover:text-emerald-900 transition-colors">
              FINAL ORDERS ISSUED
            </div>
            <div className="text-3xl md:text-4xl font-black text-emerald-600 group-hover:text-emerald-500 my-1 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
              {finalOrdersCount}
            </div>
            <div className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-1 transition-all">
              Signed Orders Uploaded →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
