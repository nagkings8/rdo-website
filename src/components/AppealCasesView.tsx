import React, { useState, useMemo } from 'react';
import {
  Scale,
  Search,
  Plus,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  FileSpreadsheet,
  Gavel,
  FileUp,
  Eye
} from 'lucide-react';
import { AppealCase, CaseHistoryEntry, MANDAL_LIST, APPEAL_TYPES, StaffUser } from '../types';
import { printTableReport } from '../utils/printReport';
import { AppealCaseModal } from './modals/AppealCaseModal';
import { UploadFinalOrderModal } from './modals/UploadFinalOrderModal';

interface AppealCasesViewProps {
  appealCases: AppealCase[];
  currentUser?: StaffUser | null;
  onSaveCase: (caseData: AppealCase, rawFileString?: string) => Promise<void> | void;
  onUpdateCase: (updatedCase: AppealCase, rawFileString?: string) => Promise<void> | void;
  onDeleteCase: (appealCase: AppealCase) => void;
  onViewFinalOrder: (appealCase: AppealCase) => void;
  onShowToast: (msg: string) => void;
}

export const AppealCasesView: React.FC<AppealCasesViewProps> = ({
  appealCases = [],
  currentUser,
  onSaveCase,
  onUpdateCase,
  onDeleteCase,
  onViewFinalOrder,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMandal, setSelectedMandal] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<AppealCase | null>(null);
  const [caseForOrderUpload, setCaseForOrderUpload] = useState<AppealCase | null>(null);

  // Exact Official Case Status Modal State
  const [eCourtModalCase, setECourtModalCase] = useState<AppealCase | null>(null);
  const [singleNoticeDoc, setSingleNoticeDoc] = useState<{ title: string; content: string } | null>(null);

  const safeMandals = useMemo(() => {
    return Array.isArray(MANDAL_LIST) && MANDAL_LIST.length > 0 ? MANDAL_LIST : [
      'HUZURNAGAR', 'CHINTHALAPALEM', 'GARIDE PALLE', 'MATTAMPALLE', 'MELLACHERUVU', 'NEREDUCHERLA', 'PALAKEEDU'
    ];
  }, []);

  const safeTypes = useMemo(() => {
    return Array.isArray(APPEAL_TYPES) && APPEAL_TYPES.length > 0 ? APPEAL_TYPES : [
      'Bhu Bharati Appeal - RoR Rectification (Sec 15(1) r/w Sec 4 & Rule 14)',
      'Bhu Bharati Appeal - Mutation on Transfer / Sale / Gift (Sec 15(1) r/w Sec 5)',
      'Other Revenue Appeal'
    ];
  }, []);

  const safeCases = useMemo(() => {
    return Array.isArray(appealCases) ? appealCases.filter(Boolean) : [];
  }, [appealCases]);

  const stats = useMemo(() => {
    const total = safeCases.length;
    const finalOrders = safeCases.filter((c) => {
      const st = String(c?.status || '').toLowerCase();
      return st.includes('final order') || Boolean(c?.finalOrderNo);
    }).length;

    const allowed = safeCases.filter((c) => {
      const st = String(c?.status || '').toLowerCase();
      return st.includes('allowed');
    }).length;

    const dismissed = safeCases.filter((c) => {
      const st = String(c?.status || '').toLowerCase();
      return st.includes('dismissed');
    }).length;

    const remanded = safeCases.filter((c) => {
      const st = String(c?.status || '').toLowerCase();
      return st.includes('remanded');
    }).length;

    const pending = safeCases.filter((c) => {
      const st = String(c?.status || '').toLowerCase();
      return st.includes('hearing') || st.includes('stay') || st.includes('reserved');
    }).length;

    return { total, finalOrders, allowed, dismissed, remanded, pending };
  }, [safeCases]);

  const filteredCases = useMemo(() => {
    return safeCases.filter((c) => {
      if (!c) return false;
      const q = searchTerm.toLowerCase().trim();
      const caseNo = String(c.caseNo || '').toLowerCase();
      const sec = String(c.bhuBharatiActSection || '').toLowerCase();
      const type = String(c.appealType || '').toLowerCase();
      const appellant = String(c.appellantName || '').toLowerCase();
      const respondent = String(c.respondentName || '').toLowerCase();
      const village = String(c.village || '').toLowerCase();
      const mandal = String(c.mandal || '').toLowerCase();
      const surveyNo = String(c.surveyNo || '').toLowerCase();
      const finalOrderNo = String(c.finalOrderNo || '').toLowerCase();

      const matchSearch =
        !q ||
        caseNo.includes(q) ||
        sec.includes(q) ||
        type.includes(q) ||
        appellant.includes(q) ||
        respondent.includes(q) ||
        village.includes(q) ||
        mandal.includes(q) ||
        surveyNo.includes(q) ||
        finalOrderNo.includes(q);

      const matchMandal = selectedMandal === 'ALL' || c.mandal === selectedMandal;
      const matchType = selectedTypeFilter === 'ALL' || c.appealType === selectedTypeFilter;

      let matchStatus = true;
      const st = String(c.status || '').toLowerCase();
      if (selectedStatusFilter === 'FINAL_ORDERS') {
        matchStatus = st.includes('final order') || Boolean(c.finalOrderNo);
      } else if (selectedStatusFilter === 'ALLOWED') {
        matchStatus = st.includes('allowed');
      } else if (selectedStatusFilter === 'DISMISSED_REMANDED') {
        matchStatus = st.includes('dismissed') || st.includes('remanded');
      } else if (selectedStatusFilter === 'PENDING_STAY') {
        matchStatus = st.includes('hearing') || st.includes('stay') || st.includes('reserved');
      }

      return matchSearch && matchMandal && matchType && matchStatus;
    });
  }, [safeCases, searchTerm, selectedMandal, selectedTypeFilter, selectedStatusFilter]);

  const handlePrintAllCasesRegister = (useAllDatabaseCases = true) => {
    const listToPrint = useAllDatabaseCases ? safeCases : filteredCases;
    if (listToPrint.length === 0) {
      onShowToast('No cases to print.');
      return;
    }

    const ths = `
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Sl</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Case No</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Village &amp; Mandal</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Sy.No / Extent</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Appellants</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Respondents</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Status</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Next Hearing</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Final Order</th>
    `;

    const trs = listToPrint
      .map(
        (c, idx) => `
        <tr>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${c.caseNo || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${c.village || '-'}, ${c.mandal || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${c.surveyNo || '-'}<br><small>${c.extent || '-'}</small></td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; white-space: pre-line;"><b>${c.appellantName || '-'}</b></td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; white-space: pre-line;">${c.respondentName || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;"><b>${c.status || '-'}</b></td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${c.nextHearingDate || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${c.finalOrderNo || '-'}</td>
        </tr>
      `
      )
      .join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <thead><tr style="background: #0c2a47; color: white;">${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Complete Appellate Cases Register',
      subtitle: 'Court of the Revenue Divisional Officer & SDM, Huzurnagar',
      period: `Total Cases: ${listToPrint.length}`,
      landscape: true,
      fileName: 'Appeal_Cases_Register',
      isOfficial: true,
    });
  };

  const handlePrintDailyCauseList = () => {
    const listToPrint = filteredCases.length > 0 ? filteredCases : safeCases;
    const ths = `
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Item No</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Case No</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Village &amp; Mandal</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Parties</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Next Hearing</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Status</th>
    `;

    const trs = listToPrint
      .map(
        (c, idx) => `
        <tr>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${c.caseNo || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${c.village || '-'}, ${c.mandal || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; white-space: pre-line;">${c.appellantName || '-'} <br><small>vs</small><br> ${c.respondentName || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;"><b>${c.nextHearingDate || 'For Hearing'}</b></td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;"><b>${c.status || '-'}</b></td>
        </tr>
      `
      )
      .join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
        <thead><tr style="background: #0c2a47; color: white;">${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Daily Bench Cause List',
      subtitle: 'Court of the Revenue Divisional Officer & SDM, Huzurnagar',
      period: `Total Listed: ${listToPrint.length}`,
      landscape: true,
      fileName: 'Daily_Cause_List',
      isOfficial: true,
    });
  };

  const renderStatusBadge = (c: AppealCase) => {
    const s = String(c.status || '').toLowerCase();
    let badgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
    let icon = <Clock className="w-3 h-3 text-blue-700" />;

    if (s.includes('allowed')) {
      badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-700" />;
    } else if (s.includes('dismissed')) {
      badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
      icon = <AlertCircle className="w-3 h-3 text-rose-700" />;
    } else if (s.includes('remanded')) {
      badgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
      icon = <RotateCcw className="w-3 h-3 text-purple-700" />;
    }

    return (
      <button
        onClick={() => setECourtModalCase(c)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-xs hover:scale-105 transition cursor-pointer ${badgeClass}`}
        title="Click to view full Case Status"
      >
        {icon}
        <span>{c.status || 'Under Hearing'}</span>
        <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER - OFFICIAL DEEP BLUE */}
      <div className="bg-gradient-to-r from-[#0c2a47] via-[#134674] to-[#1e5a92] text-white rounded-2xl p-6 shadow-md border-b-4 border-amber-400">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <Scale className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md">
                  Revenue Court
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  Huzurnagar Division • Suryapet District
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white mt-0.5">
                COURT OF THE REVENUE DIVISIONAL OFFICER &amp; SDM
              </h1>
              <p className="text-xs text-blue-100 font-medium">
                Appellate Court Register &amp; e-Courts Case Status Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
            <Gavel className="w-5 h-5 text-amber-300" />
            <div>
              <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wide">
                Final Orders Passed
              </div>
              <div className="text-lg font-black text-white leading-none">
                {stats.finalOrders}{' '}
                <span className="text-xs font-medium text-blue-200">
                  / {stats.total} Cases Disposed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatusFilter === 'ALL' ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-blue-900">Total Appeals</div>
          <div className="text-3xl font-black text-blue-950 my-1">{stats.total}</div>
          <p className="text-[11px] text-blue-700 font-semibold">All registered cases →</p>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('FINAL_ORDERS')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatusFilter === 'FINAL_ORDERS' ? 'bg-emerald-50 border-emerald-600 shadow-md' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Final Orders Issued</div>
          <div className="text-3xl font-black text-emerald-700 my-1">{stats.finalOrders}</div>
          <p className="text-[11px] text-emerald-700 font-semibold">Disposed with Orders →</p>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('ALLOWED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatusFilter === 'ALLOWED' ? 'bg-teal-50 border-teal-600 shadow-md' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-teal-800">Allowed</div>
          <div className="text-3xl font-black text-teal-700 my-1">{stats.allowed}</div>
          <p className="text-[11px] text-teal-700 font-semibold">Appeals Allowed →</p>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('DISMISSED_REMANDED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            selectedStatusFilter === 'DISMISSED_REMANDED' ? 'bg-rose-50 border-rose-600 shadow-md' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-rose-800">Dismissed / Remand</div>
          <div className="text-3xl font-black text-rose-700 my-1">{stats.dismissed + stats.remanded}</div>
          <p className="text-[11px] text-rose-700 font-semibold">{stats.dismissed} Dis • {stats.remanded} Rem →</p>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('PENDING_STAY')}
          className={`p-4 rounded-2xl border cursor-pointer transition col-span-2 sm:col-span-1 ${
            selectedStatusFilter === 'PENDING_STAY' ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-800">Under Hearing</div>
          <div className="text-3xl font-black text-amber-700 my-1">{stats.pending}</div>
          <p className="text-[11px] text-amber-700 font-semibold">Active cases →</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Case No, Appellant, Village, Survey No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintDailyCauseList}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Cause List</span>
            </button>

            <button
              onClick={() => handlePrintAllCasesRegister(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-300" />
              <span>Print All Cases ({safeCases.length})</span>
            </button>

            {!isViewer && (
              <button
                onClick={() => {
                  setCaseToEdit(null);
                  setIsNewModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Appeal</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={selectedMandal}
            onChange={(e) => setSelectedMandal(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Mandals</option>
            {safeMandals.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none max-w-xs truncate"
          >
            <option value="ALL">All Appeal Acts / Sections</option>
            {safeTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedMandal('ALL');
              setSelectedTypeFilter('ALL');
              setSelectedStatusFilter('ALL');
            }}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-[#134674] text-white z-10">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center w-12">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Case No &amp; Section</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Location (Village / Mandal)</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Parties</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Case Status</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Next Hearing Date</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Final Order</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Order Copy</th>
                <th className="py-2.5 px-3 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No Appeal Cases found.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c, idx) => {
                  return (
                    <tr key={c.id || idx} className="hover:bg-blue-50/60 transition">
                      <td className="py-3 px-3 border-r border-slate-200 text-center font-bold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <div className="font-black text-blue-900">{c.caseNo || '-'}</div>
                        <div className="text-[10px] text-slate-600 font-medium line-clamp-1">{c.bhuBharatiActSection || c.appealType || '-'}</div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{c.village || '-'}</div>
                        <div className="text-[10.5px] text-slate-600">{c.mandal || '-'} Mandal • Sy: {c.surveyNo || '-'} ({c.extent || '-'})</div>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-200 max-w-[200px]">
                        <div className="font-bold text-slate-900 whitespace-pre-line text-xs">
                          <span className="text-[10px] text-blue-700 uppercase font-black block">Appellants:</span>
                          {c.appellantName || '-'}
                        </div>
                        <div className="text-slate-600 text-[11px] whitespace-pre-line mt-1.5 pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-amber-700 uppercase font-black block">Respondents:</span>
                          {c.respondentName || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        {renderStatusBadge(c)}
                      </td>

                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <div className="font-black text-blue-950 text-xs">
                          {c.nextHearingDate ? c.nextHearingDate : 'Not Scheduled'}
                        </div>
                        <div className="text-[10px] text-amber-800 font-bold uppercase truncate max-w-[130px] mx-auto">
                          {c.stagePurpose || 'For Hearing'}
                        </div>
                        {c.caseHistory && c.caseHistory.length > 0 && (
                          <button
                            onClick={() => setECourtModalCase(c)}
                            className="text-[10px] text-blue-600 hover:underline font-bold mt-0.5 cursor-pointer"
                          >
                            {c.caseHistory.length} Hearings Held
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 border-r border-slate-200">
                        <div className="font-bold text-blue-900">{c.finalOrderNo || 'Pending'}</div>
                        <div className="text-[10.5px] text-slate-600 line-clamp-1">{c.finalOrderSummary || '-'}</div>
                      </td>

                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        {c.finalOrderNo || c.finalOrderFile || c.hasFinalOrderAttachment ? (
                          <button
                            onClick={() => onViewFinalOrder(c)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] cursor-pointer shadow-xs inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Order</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No File</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isViewer && (
                            <>
                              <button
                                onClick={() => setCaseForOrderUpload(c)}
                                className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                                title="Upload Final Order"
                              >
                                <FileUp className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setCaseToEdit(c);
                                  setIsNewModalOpen(true);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                                title="Edit Case / Add Hearing"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteCase(c)}
                              className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete Case"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFICIAL REVENUE DIVISION BLUE THEME CASE STATUS MODAL */}
      {eCourtModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-300 my-6 max-h-[92vh] overflow-y-auto font-sans">
            {/* Header: Portal Matching Deep Navy Blue with Gold accent */}
            <div className="bg-gradient-to-r from-[#0c2a47] via-[#134674] to-[#1e5a92] text-white p-4.5 flex items-center justify-between sticky top-0 z-20 shadow-md border-b-2 border-amber-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                  <Scale className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                    COURT OF THE REVENUE DIVISIONAL OFFICER &amp; SDM, HUZURNAGAR
                  </h3>
                  <p className="text-[11px] text-amber-300 font-semibold">
                    Case Status: Search by Case Number • Huzurnagar Division (Suryapet District)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setECourtModalCase(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-800">
              {/* SECTION 1: CASE DETAILS TABLE */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Case Details</span>
                  <span className="text-[10.5px] font-mono text-amber-300">CNR: TSHZNR04{eCourtModalCase.id}2026</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-2.5 border-r border-slate-200 font-bold">Case Type</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Filing Number</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Filing Date</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Registration Number</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Registration Date</th>
                        <th className="p-2.5 font-bold">CNR / Reference No</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 border-r border-slate-200 font-bold text-blue-950">{eCourtModalCase.appealType || 'ROR APPEAL'}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{eCourtModalCase.caseNo}</td>
                        <td className="p-2.5 border-r border-slate-200">{eCourtModalCase.filingDate || '-'}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold text-emerald-800">{eCourtModalCase.caseNo}</td>
                        <td className="p-2.5 border-r border-slate-200">{eCourtModalCase.filingDate || '-'}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-700">TSHZNR04{eCourtModalCase.id}2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: CASE STATUS TABLE */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider">
                  Case Status
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-2.5 border-r border-slate-200 font-bold">First Hearing Date</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold text-blue-900">Next Hearing Date</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Case Status</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Stage of Case</th>
                        <th className="p-2.5 font-bold">Court and Presiding Officer</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2.5 border-r border-slate-200">{eCourtModalCase.firstHearingDate || eCourtModalCase.filingDate || '-'}</td>
                        <td className="p-2.5 border-r border-slate-200 font-black text-blue-700 text-sm bg-blue-50/50">
                          {eCourtModalCase.nextHearingDate || (eCourtModalCase.caseHistory?.[0]?.hearingDate) || 'Not Scheduled'}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 font-bold text-emerald-800">{eCourtModalCase.status || 'Under Hearing'}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold uppercase text-amber-800">
                          {eCourtModalCase.stagePurpose || (eCourtModalCase.caseHistory?.[0]?.purpose) || 'SUMMONS / NOTICE ISSUED'}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          Revenue Divisional Officer &amp; SDM, Huzurnagar
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: PETITIONER & RESPONDENT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider">
                    Petitioner / Appellant and Advocate
                  </div>
                  <div className="p-3.5 space-y-2 min-h-[90px]">
                    <div className="font-semibold whitespace-pre-line text-slate-900 leading-relaxed text-xs">
                      {eCourtModalCase.appellantName || '-'}
                    </div>
                    <div className="text-[11px] text-blue-800 font-bold border-t border-slate-100 pt-1.5">
                      Advocate: {eCourtModalCase.appellantAdvocate || 'Party in Person'}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider">
                    Respondent and Advocate
                  </div>
                  <div className="p-3.5 space-y-2 min-h-[90px]">
                    <div className="font-semibold whitespace-pre-line text-slate-900 leading-relaxed text-xs">
                      {eCourtModalCase.respondentName || '-'}
                    </div>
                    <div className="text-[11px] text-amber-800 font-bold border-t border-slate-100 pt-1.5">
                      Advocate: {eCourtModalCase.respondentAdvocate || 'Government Pleader for Revenue'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: ACTS & SECTIONS */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider">
                  Acts &amp; Sections
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="p-2.5 border-r border-slate-200 font-bold">Under Act(s)</th>
                      <th className="p-2.5 font-bold">Under Section(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-800">
                        TELANGANA BHU BHARATI (RECORD OF RIGHTS IN LAND) ACT / ROR RULES
                      </td>
                      <td className="p-2.5 font-bold text-blue-900">
                        {eCourtModalCase.bhuBharatiActSection || eCourtModalCase.appealType || 'Section 15(1)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION 5: CASE HISTORY TABLE */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Case History (Bench Proceedings)</span>
                  <span className="text-[10.5px] font-semibold text-sky-200">
                    Total Hearings: {eCourtModalCase.caseHistory?.length || 0}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-2.5 border-r border-slate-200 font-bold text-center w-28">Registration Number</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Judge / Presiding Officer</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold text-center">Business On Date</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold text-center text-blue-900">Hearing Date</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Purpose of hearing</th>
                        <th className="p-2.5 font-bold text-center">Notice / Order Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eCourtModalCase.caseHistory && eCourtModalCase.caseHistory.length > 0 ? (
                        eCourtModalCase.caseHistory.map((h, hIdx) => (
                          <tr key={h.id || hIdx} className="border-b border-slate-200 hover:bg-blue-50/40">
                            <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-700">
                              {eCourtModalCase.caseNo}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 font-medium text-slate-800">
                              {h.judgeOfficer || 'Revenue Divisional Officer & SDM'}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 text-center font-mono text-slate-600">
                              {h.businessDate || '-'}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-blue-900">
                              {h.hearingDate}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 font-bold uppercase text-slate-800">
                              {h.purpose}
                            </td>
                            <td className="p-2.5 text-center">
                              {h.documentFile ? (
                                <button
                                  onClick={() => setSingleNoticeDoc({
                                    title: `Notice Copy - ${eCourtModalCase.caseNo} (${h.hearingDate})`,
                                    content: h.documentFile!,
                                  })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10.5px] cursor-pointer shadow-xs"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Notice</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No copy</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                            No hearing history records entered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 6: PROCESS DETAILS */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="bg-[#134674] text-white font-bold px-3.5 py-2 text-xs uppercase tracking-wider">
                  Process Details (Notices &amp; Summons Issued)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-2.5 border-r border-slate-200 font-bold">Process ID</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Process Date</th>
                        <th className="p-2.5 border-r border-slate-200 font-bold">Process Title</th>
                        <th className="p-2.5 font-bold text-center">Issued Process / File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eCourtModalCase.caseHistory && eCourtModalCase.caseHistory.length > 0 ? (
                        eCourtModalCase.caseHistory.map((h, pIdx) => (
                          <tr key={pIdx} className="border-b border-slate-200">
                            <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">
                              PTSSR03{eCourtModalCase.id}_{pIdx + 1}
                            </td>
                            <td className="p-2.5 border-r border-slate-200">{h.businessDate || h.hearingDate}</td>
                            <td className="p-2.5 border-r border-slate-200 font-semibold">{h.purpose || 'Summons to appear in person'}</td>
                            <td className="p-2.5 text-center">
                              {h.documentFile ? (
                                <button
                                  onClick={() => setSingleNoticeDoc({
                                    title: `Summons Copy - ${eCourtModalCase.caseNo}`,
                                    content: h.documentFile!,
                                  })}
                                  className="text-blue-700 hover:underline font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{h.documentName || 'Notice Copy.pdf'}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Notice Issued (Physical)</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                            No process records.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Matching Portal Official Look */}
            <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0">
              <span className="text-[11px] text-slate-600 font-semibold text-center sm:text-left">
                Court of Revenue Divisional Officer, Huzurnagar • Suryapet District, Government of Telangana
              </span>
              <button
                onClick={() => setECourtModalCase(null)}
                className="px-6 py-2 bg-[#0c2a47] hover:bg-[#134674] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition"
              >
                Close Case Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE NOTICE ATTACHMENT VIEWER */}
      {singleNoticeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-5 relative border border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">{singleNoticeDoc.title}</h3>
              <button
                onClick={() => setSingleNoticeDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4">
              {singleNoticeDoc.content.startsWith('data:image/') ? (
                <img src={singleNoticeDoc.content} alt="Notice Copy" className="max-h-[70vh] mx-auto rounded-lg shadow-sm" />
              ) : singleNoticeDoc.content.startsWith('data:application/pdf') ? (
                <iframe src={singleNoticeDoc.content} className="w-full h-[65vh] rounded-lg border border-slate-200" title="Notice PDF" />
              ) : (
                <div className="p-4 bg-slate-50 rounded text-xs text-slate-700 whitespace-pre-wrap">
                  {singleNoticeDoc.content}
                </div>
              )}
            </div>
            <div className="text-right pt-2 border-t border-slate-200">
              <button
                onClick={() => setSingleNoticeDoc(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AppealCaseModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setCaseToEdit(null);
        }}
        caseToEdit={caseToEdit}
        onSave={async (record, fileString) => {
          if (caseToEdit) {
            await onUpdateCase(record, fileString);
          } else {
            await onSaveCase(record, fileString);
          }
        }}
        onShowToast={onShowToast}
      />

      <UploadFinalOrderModal
        isOpen={Boolean(caseForOrderUpload)}
        onClose={() => setCaseForOrderUpload(null)}
        appealCase={caseForOrderUpload}
        onSaveOrder={async (updatedCase, fileBase64) => {
          await onUpdateCase(updatedCase, fileBase64);
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};