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
  ExternalLink,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  FileSpreadsheet,
  Gavel,
  Calendar,
  Building,
  MapPin,
  Eye,
  History
} from 'lucide-react';
import { AppealCase, CaseHistoryEntry, MANDAL_LIST, APPEAL_TYPES, APPEAL_STATUSES, StaffUser } from '../types';
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
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<AppealCase | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);

  // Safe cases array to prevent crash
  const safeCases = useMemo(() => {
    return Array.isArray(appealCases) ? appealCases.filter(Boolean) : [];
  }, [appealCases]);

  // Statistics with null-safe checks
  const stats = useMemo(() => {
    const total = safeCases.length;
    const finalOrders = safeCases.filter((c) => {
      const st = (c?.status || '').toLowerCase();
      return st.includes('final order') || Boolean(c?.finalOrderNo);
    }).length;

    const allowed = safeCases.filter((c) => {
      const st = (c?.status || '').toLowerCase();
      return st.includes('allowed');
    }).length;

    const dismissed = safeCases.filter((c) => {
      const st = (c?.status || '').toLowerCase();
      return st.includes('dismissed');
    }).length;

    const remanded = safeCases.filter((c) => {
      const st = (c?.status || '').toLowerCase();
      return st.includes('remanded');
    }).length;

    const pending = safeCases.filter((c) => {
      const st = (c?.status || '').toLowerCase();
      return st.includes('hearing') || st.includes('stay') || st.includes('reserved');
    }).length;

    return { total, finalOrders, allowed, dismissed, remanded, pending };
  }, [safeCases]);

  // Filtered list with null-safe checks
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
      const st = (c.status || '').toLowerCase();
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

  // Bulk Excel Upload handler
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!window.XLSX) {
          onShowToast('Excel parser library loading...');
          return;
        }
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedRows: any[][] = window.XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        });

        if (!parsedRows || parsedRows.length < 2) {
          onShowToast('No rows found in uploaded Excel file.');
          return;
        }

        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(parsedRows.length, 5); i++) {
          const rowStr = parsedRows[i].map((c) => String(c || '').toLowerCase()).join(' ');
          if (rowStr.includes('case') || rowStr.includes('appellant') || rowStr.includes('appeal')) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = parsedRows[headerRowIdx].map((h) => String(h || '').toLowerCase().trim());
        const dataRows = parsedRows.slice(headerRowIdx + 1);

        const newCases: AppealCase[] = [];
        dataRows.forEach((row, idx) => {
          if (!row.some((cell) => String(cell || '').trim() !== '')) return;

          const getVal = (keywords: string[]) => {
            const cIdx = headers.findIndex((h) => keywords.some((k) => h.includes(k)));
            return cIdx !== -1 && row[cIdx] !== undefined ? String(row[cIdx]).trim() : '';
          };

          const caseNo = getVal(['case', 'appeal no', 'number']) || `ROR/A/${100 + idx}/2026`;
          const appellant = getVal(['appellant', 'petitioner']) || 'Appellant';
          const respondent = getVal(['respondent']) || 'Tahsildar & Others';
          const mandal = getVal(['mandal']) || 'HUZURNAGAR';
          const village = getVal(['village']) || 'Huzur Nagar';
          const status = getVal(['status', 'result']) || 'Under Hearing';
          const curDateStr = new Date().toISOString().split('T')[0];

          newCases.push({
            id: Date.now() + idx + Math.floor(Math.random() * 1000),
            caseNo,
            registrationNo: caseNo.replace(/[^0-9/]/g, '') || `${100 + idx}/2026`,
            registrationDate: curDateStr,
            cnrNumber: `TSHZNR04000${1000 + idx}2026`,
            bhuBharatiActSection: 'Section 15(1) read with Rule 14 (Statutory RoR Appeal)',
            appealType: 'Bhu Bharati Appeal (Sec 15(1) r/w Rule 14)',
            mandal,
            village,
            surveyNo: getVal(['survey', 'sy']) || '-',
            extent: getVal(['extent', 'ac']) || '-',
            appellantName: appellant,
            appellantAdvocate: getVal(['appellant advocate', 'app adv']) || 'Party in Person',
            respondentName: respondent,
            respondentAdvocate: getVal(['respondent advocate', 'resp adv']) || 'GP for Revenue',
            impugnedOrderNo: getVal(['impugned', 'lower order']) || '-',
            impugnedOrderDate: curDateStr,
            stagePurpose: 'SUMMONS & NOTICE ISSUED',
            nextHearingDate: curDateStr,
            filingDate: curDateStr,
            noticeIssuedDate: '',
            noticeServedDate: '',
            firstHearingDate: curDateStr,
            hearingDate: curDateStr,
            status,
            finalOrderNo: getVal(['order no', 'final order']),
            finalOrderDate: '',
            finalOrderSummary: getVal(['summary', 'gist']),
            remarks: '',
            caseHistory: [],
          });
        });

        if (newCases.length > 0) {
          newCases.forEach((nc) => onSaveCase(nc));
          onShowToast(`Successfully imported ${newCases.length} Appeal Cases!`);
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        onShowToast('Failed to parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  const handleExportCSV = () => {
    if (safeCases.length === 0) return;
    let csv = 'Sl No,Case No,Appeal Type,Mandal,Village,Survey No,Appellant,Respondent,Status\n';
    filteredCases.forEach((c, idx) => {
      const clean = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      csv += `${idx + 1},${clean(c.caseNo)},${clean(c.appealType)},${clean(c.mandal)},${clean(c.village)},${clean(c.surveyNo)},${clean(c.appellantName)},${clean(c.respondentName)},${clean(c.status)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Appeal_Cases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Appeal Cases CSV exported.');
  };

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
              placeholder="Search by Case No, Appellant, Village..."
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
              <>
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

                <input
                  type="file"
                  ref={excelInputRef}
                  accept=".xls,.xlsx,.csv"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload (Excel)</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-[#134674] text-white">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center w-12">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Case No</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Location</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Parties</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Status</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Final Order</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Order Copy</th>
                <th className="py-2.5 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No Appeal Cases found.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-blue-50/60 transition">
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-bold text-blue-900">{c.caseNo || '-'}</td>
                    <td className="py-3 px-3 border-r border-slate-200">{c.village || '-'}, {c.mandal || '-'}</td>
                    <td className="py-3 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{c.appellantName || '-'}</div>
                      <div className="text-slate-500 text-[11px]">{c.respondentName || '-'}</div>
                    </td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center">{renderStatusBadge(c.status)}</td>
                    <td className="py-3 px-3 border-r border-slate-200">{c.finalOrderNo || '-'}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      {c.finalOrderNo ? (
                        <button onClick={() => onViewFinalOrder(c)} className="bg-blue-600 text-white font-bold px-2 py-1 rounded text-[11px]">
                          View PDF
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No File</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isViewer && (
                          <button onClick={() => { setCaseToEdit(c); setIsNewModalOpen(true); }} className="p-1 text-blue-600 hover:text-blue-800" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => onDeleteCase(c)} className="p-1 text-rose-600 hover:text-rose-800" title="Delete">
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