import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  Download, 
  X, 
  Printer, 
  Clock, 
  MapPin, 
  Loader2, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  LayoutGrid, 
  Eye, 
  Info,
  Scale,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  BookmarkCheck,
  Compass,
  FileEdit,
  FolderTree
} from 'lucide-react';
import { safeSaveLocalStorage, safeGetLocalStorage } from '../utils/storage';
import { printTableReport } from '../utils/printReport';
import { StaffUser } from '../types';
import { db } from '../utils/firebase';
import { collection, doc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';

export interface RdoPendencySheet {
  sheetName: string;
  headers: string[];
  rows: any[][];
}

interface RdoPendencyViewProps {
  currentUser?: StaffUser | null;
  onShowToast: (msg: string) => void;
}

export const RdoPendencyView: React.FC<RdoPendencyViewProps> = ({
  currentUser,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';
  const isOfficial = !isViewer;

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [sheetsData, setSheetsData] = useState<RdoPendencySheet[]>(() => 
    safeGetLocalStorage('rdo_pendency_sheets_local', [])
  );
  
  const [viewMode, setViewMode] = useState<'CONSOLIDATED' | 'SHEET_WISE'>('CONSOLIDATED');
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('ALL');

  const [selectedRowDetail, setSelectedRowDetail] = useState<{
    sheetName: string;
    headers: string[];
    row: any[];
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoadingCloud(true);
    const colRef = collection(db, 'rdo_pendency_sheets');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedSheets: RdoPendencySheet[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.sheetName && data.headers) {
              let parsedRows: any[][] = [];
              try {
                parsedRows = typeof data.rowsJson === 'string' ? JSON.parse(data.rowsJson) : (data.rows || []);
              } catch (e) {
                parsedRows = data.rows || [];
              }
              loadedSheets.push({
                sheetName: data.sheetName,
                headers: data.headers,
                rows: parsedRows,
              });
            }
          });

          if (loadedSheets.length > 0) {
            setSheetsData(loadedSheets);
            safeSaveLocalStorage('rdo_pendency_sheets_local', loadedSheets);
          }
        }
        setIsLoadingCloud(false);
      },
      (error) => {
        console.error('Firestore Real-time Listener Error:', error);
        setIsLoadingCloud(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isAbstractSheet = (name: string) => {
    const lower = String(name || '').toLowerCase().trim();
    return lower.includes('abstract') || lower.includes('summary') || lower.includes('consolidated');
  };

  const detectColIndex = (headers: string[], keywords: string[]) => {
    return headers.findIndex((h) => {
      const lower = String(h || '').toLowerCase().trim();
      return keywords.some((k) => lower.includes(k));
    });
  };

  const getMandalColIndex = (headers: string[]) => detectColIndex(headers, ['mandal', 'mandal_name']);
  const getVillageColIndex = (headers: string[]) => detectColIndex(headers, ['village', 'village_name', 'habitation', 'rev_village']);
  
  const getAppColIndex = (headers: string[]) => detectColIndex(headers, [
    'transaction id',
    'transaction_id',
    'transactionid',
    'txn id',
    'application number',
    'application no',
    'application_no',
    'application id',
    'appl no',
    'app no',
    'app_no',
    'file no',
    'file_no',
    'case no',
    'case_no'
  ]);

  const getNameColIndex = (headers: string[]) => detectColIndex(headers, ['applicant', 'pattadar', 'khatedar', 'owner', 'name', 'holder', 'petitioner']);
  
  const getSubDivisionColIndex = (headers: string[]) => detectColIndex(headers, [
    'sub-division no in bhubharati',
    'sub division no in bhubharati',
    'sub-division no',
    'sub division no',
    'sub-division',
    'sub division',
    'subdivision'
  ]);

  const getRegularSurveyColIndex = (headers: string[]) => detectColIndex(headers, [
    'survey no',
    'survey_no',
    'surveyno',
    'survey number',
    'sy no',
    'sy.no',
    'sy_no',
    'survey'
  ]);

  const consolidatedRowsWithSheet = useMemo(() => {
    if (sheetsData.length === 0) return [];
    
    const list: Array<{
      sheetName: string;
      row: any[];
      headers: string[];
      mandalName: string;
      villageName: string;
      appNo: string;
      applicantName: string;
      surveyNo: string;
      uniqueKey: string;
    }> = [];

    sheetsData.forEach((sheet) => {
      if (isAbstractSheet(sheet.sheetName)) return;

      const mIdx = getMandalColIndex(sheet.headers);
      const vIdx = getVillageColIndex(sheet.headers);
      const aIdx = getAppColIndex(sheet.headers);
      const nIdx = getNameColIndex(sheet.headers);

      const isPpSheet = sheet.sheetName.toLowerCase().trim() === 'pp' || sheet.sheetName.toLowerCase().includes('prohibited');
      const subDivIdx = getSubDivisionColIndex(sheet.headers);
      const regSurveyIdx = getRegularSurveyColIndex(sheet.headers);

      const targetSurveyIdx = isPpSheet 
        ? (subDivIdx !== -1 ? subDivIdx : regSurveyIdx) 
        : (regSurveyIdx !== -1 ? regSurveyIdx : subDivIdx);

      sheet.rows.forEach((r, rIdx) => {
        const mandalName = mIdx !== -1 ? String(r[mIdx] || '').trim().toUpperCase() : '-';
        const villageName = vIdx !== -1 ? String(r[vIdx] || '').trim() : '-';
        const rawApp = aIdx !== -1 ? String(r[aIdx] || '').trim() : '';
        const appNo = rawApp && rawApp !== '-' && rawApp.toLowerCase() !== 'null' ? rawApp : '-';
        const applicantName = nIdx !== -1 ? String(r[nIdx] || '').trim() : '-';

        const rawSurvey = targetSurveyIdx !== -1 ? String(r[targetSurveyIdx] || '').trim() : '';
        const surveyNo = rawSurvey && rawSurvey !== '-' && rawSurvey.toLowerCase() !== 'null' ? rawSurvey : '-';

        const uniqueKey = appNo !== '-' 
          ? `${sheet.sheetName.toUpperCase()}___${appNo.toUpperCase()}`
          : `${sheet.sheetName.toUpperCase()}___ROW_${rIdx}`;

        list.push({
          sheetName: sheet.sheetName,
          row: r,
          headers: sheet.headers,
          mandalName,
          villageName,
          appNo,
          applicantName,
          surveyNo,
          uniqueKey,
        });
      });
    });

    return list;
  }, [sheetsData]);

  const filteredConsolidatedData = useMemo(() => {
    let list = consolidatedRowsWithSheet;

    if (selectedMandal !== 'ALL') {
      list = list.filter((item) => item.mandalName === selectedMandal);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((item) => 
        item.sheetName.toLowerCase().includes(q) ||
        item.appNo.toLowerCase().includes(q) ||
        item.applicantName.toLowerCase().includes(q) ||
        item.mandalName.toLowerCase().includes(q) ||
        item.villageName.toLowerCase().includes(q) ||
        item.surveyNo.toLowerCase().includes(q) ||
        item.row.some((cell) => String(cell || '').toLowerCase().includes(q))
      );
    }

    return list;
  }, [consolidatedRowsWithSheet, selectedMandal, searchTerm]);

  const uniqueConsolidatedCount = useMemo(() => {
    const keys = new Set(filteredConsolidatedData.map((item) => item.uniqueKey));
    return keys.size;
  }, [filteredConsolidatedData]);

  const currentSheet = sheetsData[activeSheetIndex] || { sheetName: 'Sheet 1', headers: [], rows: [] };
  const currentSheetMandalIdx = useMemo(() => getMandalColIndex(currentSheet.headers), [currentSheet.headers]);

  const filteredSingleSheetRows = useMemo(() => {
    let rows = currentSheet.rows;

    if (selectedMandal !== 'ALL' && currentSheetMandalIdx !== -1) {
      rows = rows.filter((r) => 
        String(r[currentSheetMandalIdx] || '').trim().toUpperCase() === selectedMandal
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      rows = rows.filter((r) => 
        r.some((cell) => String(cell || '').toLowerCase().includes(q))
      );
    }

    return rows;
  }, [currentSheet.rows, selectedMandal, currentSheetMandalIdx, searchTerm]);

  const activeDisplayLength = viewMode === 'CONSOLIDATED' 
    ? filteredConsolidatedData.length 
    : filteredSingleSheetRows.length;

  const paginatedConsolidated = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredConsolidatedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredConsolidatedData, currentPage, rowsPerPage]);

  const handlePrint = () => {
    if (viewMode === 'CONSOLIDATED') {
      const trs = filteredConsolidatedData.map((item, idx) => `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
          <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 10px;">${idx + 1}</td>
          <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a; text-align: center; font-size: 10px;">${item.sheetName}</td>
          <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace; text-align: center; font-size: 10px; white-space: nowrap;">${item.appNo}</td>
          <td style="padding: 6px 6px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 10.5px; text-align: left;">${item.applicantName}</td>
          <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; font-size: 9.5px;">${item.mandalName}</td>
          <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px; white-space: nowrap;">${item.villageName}</td>
          <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: 600; text-align: center; font-size: 9.5px; font-family: monospace;">${item.surveyNo}</td>
        </tr>
      `).join('');

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; table-layout: fixed;">
          <thead>
            <tr style="background-color: #061122; color: #fbbf24; text-transform: uppercase;">
              <th style="padding: 6px 3px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">S.No</th>
              <th style="padding: 6px 3px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">Module</th>
              <th style="padding: 6px 3px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">App / Txn ID</th>
              <th style="padding: 6px 6px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: left;">Applicant Name</th>
              <th style="padding: 6px 3px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">Mandal</th>
              <th style="padding: 6px 3px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">Village</th>
              <th style="padding: 6px 3px; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">Survey / Sub-Div</th>
            </tr>
          </thead>
          <tbody>${trs}</tbody>
        </table>
      `;

      printTableReport(tableHtml, {
        title: `BHU BHARATI RDO PENDENCY - CONSOLIDATED MANDAL REPORT (${selectedMandal})`,
        subtitle: `Revenue Divisional Office, Huzurnagar • Unique Files: ${uniqueConsolidatedCount} (Total Entries: ${filteredConsolidatedData.length})`,
        period: `Official Report as on ${new Date().toLocaleDateString('en-IN')}`,
        landscape: true,
        fileName: `RDO_Pendency_Consolidated_${selectedMandal}`,
        isOfficial,
      });
    } else {
      const ths = currentSheet.headers.map((h) => 
        `<th style="background-color: #061122; color: #fbbf24; padding: 6px 4px; border: 1px solid #cbd5e1; font-size: 9.5px; font-weight: bold; text-align: center;">${h}</th>`
      ).join('');

      const trs = filteredSingleSheetRows.map((row, rIdx) => {
        const tds = currentSheet.headers.map((_, cIdx) => {
          const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
          return `<td style="padding: 5px 4px; border: 1px solid #cbd5e1; font-size: 9px; text-align: center;">${val}</td>`;
        }).join('');
        return `<tr style="background: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">${tds}</tr>`;
      }).join('');

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif;">
          <thead><tr>${ths}</tr></thead>
          <tbody>${trs}</tbody>
        </table>
      `;

      printTableReport(tableHtml, {
        title: `BHU BHARATI PENDENCY AT RDO LOGIN - ${currentSheet.sheetName.toUpperCase()}`,
        subtitle: `Revenue Divisional Office, Huzurnagar • Mandal: ${selectedMandal}`,
        period: `Preview Report`,
        landscape: true,
        fileName: `RDO_Pendency_${currentSheet.sheetName}`,
        isOfficial,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-[#061826] via-[#0d2a42] to-[#061826] text-white p-5 md:p-6 rounded-2xl shadow-xl border-t-2 border-amber-400 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#071d2e] rounded-[14px] flex items-center justify-center text-amber-300">
                <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md">
                  RDO Login Pendency (Consolidated)
                </span>
                <span className="text-xs font-semibold text-amber-200">
                  Revenue Divisional Office, Huzurnagar
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
                BHU BHARATI PENDENCY AT RDO LOGIN
              </h1>
              <p className="text-xs text-sky-100 font-medium max-w-3xl">
                Module, Applicant, Application / Transaction ID, Mandal, Village mariyu Survey / Sub-Division No wisegaa clean consolidated pendency view.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
            <Clock className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <div className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">
                {selectedMandal === 'ALL' ? 'Total Unique Pending Files' : `${selectedMandal} Unique Files`}
              </div>
              <div className="text-lg font-black text-white leading-none">
                {uniqueConsolidatedCount.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-300">
                  Files ({activeDisplayLength.toLocaleString('en-IN')} Entries)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS & PRINT */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Display Mode:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('CONSOLIDATED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'CONSOLIDATED' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Mandal-Wise (Consolidated)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('SHEET_WISE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewMode === 'SHEET_WISE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Original Sheet View
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Anyone (Public and Staff) can print RDO Pendency Table */}
            {sheetsData.length > 0 && (
              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-sky-300" />
                <span>Print Table</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      {sheetsData.length > 0 && viewMode === 'CONSOLIDATED' && (
        <div className="overflow-x-auto border border-slate-300 rounded-lg bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#134674] text-white">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">S.No</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Module</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">App / Txn ID</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-left">Applicant Name</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Mandal</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Village</th>
                <th className="py-2.5 px-3 border-r border-slate-400 text-center">Survey / Sub-Div</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedConsolidated.map((item, rIdx) => (
                <tr key={rIdx} className="hover:bg-amber-50/60 transition-colors">
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">{(currentPage - 1) * rowsPerPage + rIdx + 1}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-blue-900">{item.sheetName}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">{item.appNo}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 font-bold">{item.applicantName}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-extrabold">{item.mandalName}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center">{item.villageName}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono">{item.surveyNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};