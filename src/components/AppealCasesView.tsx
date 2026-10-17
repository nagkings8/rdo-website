import React, { useState, useMemo, useRef } from 'react';
import {
  Scale,
  Search,
  Plus,
  Upload,
  Download,
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
import { AppealCase, MANDAL_LIST, APPEAL_TYPES, StaffUser } from '../types';
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
  const isOfficial = !isViewer;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMandal, setSelectedMandal] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<AppealCase | null>(null);
  const [caseForOrderUpload, setCaseForOrderUpload] = useState<AppealCase | null>(null);

  // Notice Viewer Modal state
  const [noticeViewDoc, setNoticeViewDoc] = useState<{ title: string; content: string } | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);

  const safeMandals = useMemo(() => {
    return Array.isArray(MANDAL_LIST) && MANDAL_LIST.length > 0 ? MANDAL_LIST : [
      'HUZURNAGAR', 'CHINTHALAPALEM', 'GARIDE PALLE', 'MATTAMPALLE', 'MELLACHERUVU', 'NEREDUCHERLA', 'PALAKEEDU'
    ];
  }, []);

  const safeTypes = useMemo(() => {
    return Array.isArray(APPEAL_TYPES) && APPEAL_TYPES.length > 0 ? APPEAL_TYPES : [
      'Bhu Bharati Appeal (Sec 15(1) r/w Rule 14)',
      'Mutation on Transfer (Sec 5)',
      'Succession / Will (Sec 7)',
      'Sadabainama Regularisation (Sec 6)',
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
      const regNo = String(c.registrationNo || '').toLowerCase();
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
        regNo.includes(q) ||
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
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Appellant</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Respondent</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Status</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Notice Date</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Final Order</th>
    `;

    const trs = listToPrint
      .map(
        (c, idx) => `
        <tr>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${c.caseNo || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${c.village || '-'}, ${c.mandal || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${c.surveyNo || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;"><b>${c.appellantName || '-'}</b></td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${c.respondentName || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;"><b>${c.status || '-'}</b></td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${c.noticeIssuedDate || '-'}</td>
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
      isOfficial,
    });
  };

  const handlePrintDailyCauseList = () => {
    const listToPrint = filteredCases.length > 0 ? filteredCases : safeCases;
    const ths = `
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Item No</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Case No</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Village &amp; Mandal</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: left;">Parties</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Stage / Purpose</th>
      <th style="padding: 6px; border: 1px solid #334155; text-align: center;">Status</th>
    `;

    const trs = listToPrint
      .map(
        (c, idx) => `
        <tr>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${c.caseNo || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${c.village || '-'}, ${c.mandal || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${c.appellantName || '-'} vs ${c.respondentName || '-'}</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${c.stagePurpose || 'For Hearing'}</td>
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
      isOfficial,
    });
  };

  const renderStatusBadge = (statusStr: string) => {
    const s = String(statusStr || '').toLowerCase();
    if (s.includes('allowed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Allowed</span>
        </span>
      );
    }
    if (s.includes('dismissed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Dismissed</span>
        </span>
      );
    }
    if (s.includes('remanded')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
          <RotateCcw className="w-3 h-3 text-purple-600" />
          <span>Remanded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
        <Clock className="w-3 h-3 text-blue-600" />
        <span>{statusStr || 'Under Hearing'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
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
                Appellate Court Register &amp; Final Judgment Tracker
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
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Status</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Notice / Summons</th>
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
                filteredCases.map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-blue-50/60 transition">
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-bold text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      <div className="font-black text-blue-900">{c.caseNo || '-'}</div>
                      <div className="text-[10px] text-slate-600 font-medium">{c.bhuBharatiActSection || c.appealType || '-'}</div>
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{c.village || '-'}</div>
                      <div className="text-[10.5px] text-slate-600">{c.mandal || '-'} Mandal • Sy: {c.surveyNo || '-'}</div>
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">App: {c.appellantName || '-'}</div>
                      <div className="text-slate-500 text-[11px]">Resp: {c.respondentName || '-'}</div>
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      {renderStatusBadge(c.status)}
                    </td>
                    {/* NOTICE / SUMMONS COLUMN WITH VIEW FILE SUPPORT */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {c.noticeIssuedDate ? `Issued: ${c.noticeIssuedDate}` : 'Pending'}
                      </div>
                      {(c as any).noticeFile ? (
                        <button
                          onClick={() =>
                            setNoticeViewDoc({
                              title: `Notice / Summons: ${c.caseNo}`,
                              content: (c as any).noticeFile,
                            })
                          }
                          className="mt-1 inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Notice</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">No copy</span>
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
                            {/* Upload Final Order Action Button */}
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
                              title="Edit Case"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NOTICE VIEWER MODAL */}
      {noticeViewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 relative border border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">{noticeViewDoc.title}</h3>
              <button
                onClick={() => setNoticeViewDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4">
              {noticeViewDoc.content.startsWith('data:image/') ? (
                <img src={noticeViewDoc.content} alt="Notice Copy" className="max-h-[70vh] mx-auto rounded-lg shadow-sm" />
              ) : noticeViewDoc.content.startsWith('data:application/pdf') ? (
                <iframe src={noticeViewDoc.content} className="w-full h-[65vh] rounded-lg border border-slate-200" title="Notice PDF" />
              ) : (
                <div className="p-4 bg-slate-50 rounded text-xs text-slate-700 whitespace-pre-wrap">
                  {noticeViewDoc.content}
                </div>
              )}
            </div>
            <div className="text-right pt-2 border-t border-slate-200">
              <button
                onClick={() => setNoticeViewDoc(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
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