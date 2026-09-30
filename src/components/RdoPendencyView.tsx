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
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);
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

  // Real-time Firestore Sync (vere systems lo instant ga data raavadaniki)
  useEffect(() => {
    setIsLoadingFirestore(true);
    const docRef = doc(db, 'rdo_pendency', 'live_data');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData && Array.isArray(cloudData.sheets) && cloudData.sheets.length > 0) {
            setSheetsData(cloudData.sheets);
            safeSaveLocalStorage('rdo_pendency_sheets_local', cloudData.sheets);
          }
        }
        setIsLoadingFirestore(false);
      },
      (error) => {
        console.error('Firestore Realtime Sync Error:', error);
        setIsLoadingFirestore(false);
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

  // Card Icon, Subtext and Hover Glow Styling Configurations
  const getCardStyle = (label: string) => {
    const norm = label.toLowerCase().trim();
    
    if (norm === 'total' || norm.includes('total')) {
      return {
        borderColor: 'border-blue-500 hover:border-blue-600 hover:ring-2 hover:ring-blue-400 hover:shadow-blue-100',
        textColor: 'text-blue-600',
        iconBg: 'bg-blue-600 text-white',
        icon: Scale,
        subText: 'Total Pending Files'
      };
    }
    if (norm === 'pm' || norm.includes('partition')) {
      return {
        borderColor: 'border-slate-200 hover:border-amber-500 hover:ring-2 hover:ring-amber-300 hover:shadow-amber-100',
        textColor: 'text-slate-900',
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
        icon: FileText,
        subText: 'Partition Mutation'
      };
    }
    if (norm === 'cci' || norm.includes('court')) {
      return {
        borderColor: 'border-slate-200 hover:border-sky-500 hover:ring-2 hover:ring-sky-300 hover:shadow-sky-100',
        textColor: 'text-sky-700',
        iconBg: 'bg-sky-50 text-sky-600 border border-sky-200',
        icon: Scale,
        subText: 'Court Case Intimation'
      };
    }
    if (norm === 'pdc') {
      return {
        borderColor: 'border-slate-200 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-300 hover:shadow-emerald-100',
        textColor: 'text-emerald-700',
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        icon: CheckCircle2,
        subText: 'PDC Regularisation'
      };
    }
    if (norm.includes('issue of ppb') || norm.includes('issue')) {
      return {
        borderColor: 'border-slate-200 hover:border-teal-500 hover:ring-2 hover:ring-teal-300 hover:shadow-teal-100',
        textColor: 'text-teal-700',
        iconBg: 'bg-teal-50 text-teal-600 border border-teal-200',
        icon: BookmarkCheck,
        subText: 'Issue of PPB'
      };
    }
    if (norm.includes('nala')) {
      return {
        borderColor: 'border-slate-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-300 hover:shadow-indigo-100',
        textColor: 'text-indigo-700',
        iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
        icon: Building2,
        subText: 'Nala without PPB'
      };
    }
    if (norm.includes('land nature') || norm.includes('nature') || norm === 'lnc') {
      return {
        borderColor: 'border-slate-200 hover:border-orange-500 hover:ring-2 hover:ring-orange-300 hover:shadow-orange-100',
        textColor: 'text-orange-700',
        iconBg: 'bg-orange-50 text-orange-600 border border-orange-200',
        icon: FileEdit,
        subText: 'Land Nature Correction'
      };
    }
    if (norm.includes('org ppb') || norm.includes('organization') || norm.includes('org')) {
      return {
        borderColor: 'border-slate-200 hover:border-cyan-500 hover:ring-2 hover:ring-cyan-300 hover:shadow-cyan-100',
        textColor: 'text-cyan-700',
        iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
        icon: FolderTree,
        subText: 'Organization of PPB'
      };
    }
    if (norm === 'pp' || norm.includes('prohibited')) {
      return {
        borderColor: 'border-slate-200 hover:border-rose-500 hover:ring-2 hover:ring-rose-300 hover:shadow-rose-100',
        textColor: 'text-rose-700',
        iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
        icon: AlertCircle,
        subText: 'Prohibited Properties'
      };
    }
    if (norm === 'succ' || norm.includes('succession')) {
      return {
        borderColor: 'border-slate-200 hover:border-purple-500 hover:ring-2 hover:ring-purple-300 hover:shadow-purple-100',
        textColor: 'text-purple-700',
        iconBg: 'bg-purple-50 text-purple-600 border border-purple-200',
        icon: Compass,
        subText: 'Succession Files'
      };
    }
    
    return {
      borderColor: 'border-slate-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-200 hover:shadow-blue-50',
      textColor: 'text-slate-800',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
      icon: FileCheck,
      subText: label
    };
  };

  const abstractGrandTotalCards = useMemo(() => {
    const abstractSheet = sheetsData.find((s) => isAbstractSheet(s.sheetName));
    if (!abstractSheet || !abstractSheet.rows || abstractSheet.rows.length === 0) return [];

    const totalRow = abstractSheet.rows.find((row) => {
      const c0 = String(row[0] || '').toLowerCase().trim();
      const c1 = String(row[1] || '').toLowerCase().trim();
      return c0.includes('grand') || c0.includes('total') || c1.includes('grand') || c1.includes('total');
    });

    if (!totalRow) return [];

    const cards: Array<{ label: string; value: string; style: any }> = [];

    abstractSheet.headers.forEach((h, idx) => {
      if (idx < 2) return;
      const val = totalRow[idx] !== undefined && totalRow[idx] !== null ? String(totalRow[idx]) : '0';
      const label = String(h || `Module ${idx - 1}`).trim();
      cards.push({
        label,
        value: val,
        style: getCardStyle(label)
      });
    });

    return cards;
  }, [sheetsData]);

  const allAvailableMandals = useMemo(() => {
    const set = new Set<string>();
    sheetsData.forEach((sheet) => {
      if (isAbstractSheet(sheet.sheetName)) return;

      const mIdx = getMandalColIndex(sheet.headers);
      if (mIdx !== -1) {
        sheet.rows.forEach((row) => {
          const val = String(row[mIdx] || '').trim();
          if (val && val !== '-' && val.toLowerCase() !== 'null') {
            set.add(val.toUpperCase());
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [sheetsData]);

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

  const getMandalUniqueCount = (mandal: string) => {
    const items = mandal === 'ALL' 
      ? consolidatedRowsWithSheet 
      : consolidatedRowsWithSheet.filter((r) => r.mandalName === mandal);
    return new Set(items.map((i) => i.uniqueKey)).size;
  };

  const mandalSheetBreakdown = useMemo(() => {
    return sheetsData
      .filter((sheet) => !isAbstractSheet(sheet.sheetName))
      .map((sheet) => {
        const matching = consolidatedRowsWithSheet.filter((item) => 
          item.sheetName === sheet.sheetName && (selectedMandal === 'ALL' || item.mandalName === selectedMandal)
        );
        const uniqueCount = new Set(matching.map((i) => i.uniqueKey)).size;
        return {
          sheetName: sheet.sheetName,
          count: uniqueCount,
          totalEntries: matching.length,
        };
      });
  }, [sheetsData, consolidatedRowsWithSheet, selectedMandal]);

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

  const totalPages = Math.max(1, Math.ceil(activeDisplayLength / rowsPerPage));

  const paginatedConsolidated = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredConsolidatedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredConsolidatedData, currentPage, rowsPerPage]);

  const paginatedSingleSheet = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredSingleSheetRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSingleSheetRows, currentPage, rowsPerPage]);

  // Excel Upload Handler with Firestore Persistence
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.XLSX) {
      onShowToast('SheetJS library load avthundhi, okka kshanam aagandi.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) {
          setIsUploading(false);
          return;
        }

        const data = new Uint8Array(buffer as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });

        const extractedSheets: RdoPendencySheet[] = [];

        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[][] = window.XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          });

          if (rawRows && rawRows.length > 0) {
            let headerIdx = 0;
            for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
              if (rawRows[i] && rawRows[i].filter((c: any) => String(c).trim() !== '').length > 2) {
                headerIdx = i;
                break;
              }
            }

            const headers = (rawRows[headerIdx] || []).map((h: any, i: number) => 
              String(h || `Column ${i + 1}`).trim()
            );

            const rows = rawRows.slice(headerIdx + 1).filter((r: any[]) =>
              r && r.some((cell: any) => String(cell || '').trim() !== '')
            );

            extractedSheets.push({
              sheetName: sheetName.trim(),
              headers,
              rows,
            });
          }
        });

        if (extractedSheets.length === 0) {
          onShowToast('Excel file lo valid sheets levu.');
          setIsUploading(false);
          return;
        }

        // Local State Update
        setSheetsData(extractedSheets);
        safeSaveLocalStorage('rdo_pendency_sheets_local', extractedSheets);

        // Save to Firebase Firestore Live Database
        try {
          const docRef = doc(db, 'rdo_pendency', 'live_data');
          await setDoc(docRef, {
            sheets: extractedSheets,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Staff User'
          });
          onShowToast('Bhu Bharati Pendency data live Firestore lo save ayyindi!');
        } catch (dbErr) {
          console.error('Firestore save error:', dbErr);
          onShowToast('Firestore lo save cheyyadam lo error vachindi, locally saved.');
        }

        setActiveSheetIndex(0);
        setSelectedMandal('ALL');
        setSearchTerm('');
        setCurrentPage(1);
      } catch (err) {
        console.error('Excel upload error:', err);
        onShowToast('Excel file read cheyyadam lo error vacchindi.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleClear = async () => {
    setSheetsData([]);
    localStorage.removeItem('rdo_pendency_sheets_local');
    try {
      const docRef = doc(db, 'rdo_pendency', 'live_data');
      await setDoc(docRef, { sheets: [], updatedAt: new Date().toISOString() });
    } catch (e) {
      console.error('Firestore clear error:', e);
    }
    onShowToast('Data clear cheyabadindhi.');
  };

  const handleExportCSV = () => {
    if (viewMode === 'CONSOLIDATED') {
      if (!filteredConsolidatedData.length) return;
      const csvLines = [
        'S.No,Module Name,Application / Transaction ID,Applicant Name,Mandal,Village,Survey / Sub-Division No',
        ...filteredConsolidatedData.map((item, idx) => {
          return `"${idx + 1}","${item.sheetName}","${item.appNo}","${item.applicantName.replace(/"/g, '""')}","${item.mandalName}","${item.villageName.replace(/"/g, '""')}","${item.surveyNo.replace(/"/g, '""')}"`;
        })
      ];
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RDO_Pendency_${selectedMandal}_Clean_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast(`Exported clean list for ${selectedMandal} to CSV.`);
    } else {
      if (!currentSheet.rows.length) return;
      const headerLine = currentSheet.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
      const rowsLines = filteredSingleSheetRows.map((row) => 
        row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      );
      const blob = new Blob([[headerLine, ...rowsLines].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RDO_Pendency_${currentSheet.sheetName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast(`Exported ${currentSheet.sheetName} to CSV.`);
    }
  };

  const handlePrint = () => {
    if (viewMode === 'CONSOLIDATED') {
      const trs = filteredConsolidatedData.map((item, idx) => {
        return `
          <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
            <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 10px;">${idx + 1}</td>
            <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a; text-align: center; font-size: 10px;">${item.sheetName}</td>
            <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace; text-align: center; font-size: 10px; white-space: nowrap;">${item.appNo}</td>
            <td style="padding: 6px 6px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 10.5px; text-align: left;">${item.applicantName}</td>
            <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: bold; text-align: center; font-size: 9.5px; line-height: 1.2;">${item.mandalName}</td>
            <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px; white-space: nowrap;">${item.villageName}</td>
            <td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-weight: 600; text-align: center; font-size: 9.5px; font-family: monospace; word-break: break-word;">${item.surveyNo}</td>
          </tr>
        `;
      }).join('');

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; table-layout: fixed;">
          <colgroup>
            <col style="width: 5%;">
            <col style="width: 10%;">
            <col style="width: 15%;">
            <col style="width: 28%;">
            <col style="width: 18%;">
            <col style="width: 12%;">
            <col style="width: 12%;">
          </colgroup>
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
        period: `Official Live Report as on ${new Date().toLocaleDateString('en-IN')}`,
        landscape: true,
        fileName: `RDO_Pendency_Consolidated_${selectedMandal}`,
      });
    } else {
      const ths = currentSheet.headers.map((h) => 
        `<th style="background-color: #061122; color: #fbbf24; padding: 6px 4px; border: 1px solid #cbd5e1; font-size: 9.5px; font-weight: bold; text-align: center;">${h}</th>`
      ).join('');

      const trs = filteredSingleSheetRows.map((row, rIdx) => {
        const firstCell = String(row[0] || '').toLowerCase().trim();
        const secondCell = String(row[1] || '').toLowerCase().trim();
        const isTotalRow = firstCell.includes('total') || secondCell.includes('total') || firstCell.includes('grand') || secondCell.includes('grand');

        if (isTotalRow) {
          const restTds = currentSheet.headers.slice(2).map((_, cIdx) => {
            const actualColIdx = cIdx + 2;
            const val = row[actualColIdx] !== undefined && row[actualColIdx] !== null ? String(row[actualColIdx]) : '';
            return `<td style="padding: 6px 4px; border: 1px solid #cbd5e1; font-size: 10px; font-weight: bold; text-align: center; background-color: #fef3c7;">${val}</td>`;
          }).join('');

          return `
            <tr style="background-color: #fef3c7; page-break-inside: avoid; font-weight: bold;">
              <td colspan="2" style="padding: 6px 4px; border: 1px solid #cbd5e1; font-size: 10px; font-weight: bold; text-align: center; text-transform: uppercase;">Grand Total</td>
              ${restTds}
            </tr>
          `;
        }

        const tds = currentSheet.headers.map((_, cIdx) => {
          const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
          return `<td style="padding: 5px 4px; border: 1px solid #cbd5e1; font-size: 9px; text-align: center;">${val}</td>`;
        }).join('');
        return `<tr style="background: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">${tds}</tr>`;
      }).join('');

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; table-layout: auto;">
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

      {/* ABSTRACT GRAND TOTAL SUMMARY CARDS: 5 Per Row, Hover Lift & Border Highlight Glow */}
      {abstractGrandTotalCards.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {abstractGrandTotalCards.map((card, cIdx) => {
              const IconComp = card.style.icon;
              return (
                <div
                  key={cIdx}
                  className={`bg-white rounded-2xl border p-4 shadow-xs transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between cursor-pointer group ${card.style.borderColor}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black tracking-wider uppercase text-slate-600 group-hover:text-slate-900 truncate transition-colors" title={card.label}>
                        {card.label}
                      </div>
                      <div className={`text-2xl font-black mt-1 ${card.style.textColor}`}>
                        {card.value}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${card.style.iconBg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500 font-bold truncate group-hover:text-slate-800 transition-colors">
                      {card.style.subText}
                    </span>
                    <span className="font-extrabold text-blue-600 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="bg-white border-2 border-[#134674] rounded-xl shadow-lg overflow-hidden space-y-4 p-4 md:p-5">
        {/* TOP ACTION & VIEW TOGGLE BAR */}
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-1">Display Mode:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setViewMode('CONSOLIDATED');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'CONSOLIDATED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Mandal-Wise (Clean Consolidated View)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('SHEET_WISE');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'SHEET_WISE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Original Sheet View</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xls,.xlsx,.csv"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
                <button
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#134674] hover:bg-[#0f3b63] disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Upload Pendency Excel</span>
                </button>
              </>
            )}

            {sheetsData.length > 0 && (
              <>
                <button
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-300" />
                  <span>Print Table</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {!isViewer && isAdmin && (
                  <button
                    onClick={handleClear}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Data</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* MANDAL SELECTION BUTTONS */}
        {allAvailableMandals.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Select Mandal (Click cheyagane aa mandal details clean ga vasthayi):</span>
              </span>
              {selectedMandal !== 'ALL' && (
                <button
                  onClick={() => setSelectedMandal('ALL')}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Show All Mandals</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setSelectedMandal('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  selectedMandal === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                ALL MANDALS ({getMandalUniqueCount('ALL')})
              </button>

              {allAvailableMandals.map((mandal) => {
                const isSelected = selectedMandal === mandal;
                const uniqueCount = getMandalUniqueCount(mandal);

                return (
                  <button
                    key={mandal}
                    onClick={() => {
                      setSelectedMandal(mandal);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 font-black'
                        : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{mandal}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {uniqueCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SUMMARY CARDS: Sheet Breakdown */}
        {sheetsData.length > 0 && selectedMandal !== 'ALL' && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
              {selectedMandal} Unique Pending Files breakdown across Sheets / Modules:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {mandalSheetBreakdown.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    const sheetOriginalIndex = sheetsData.findIndex((s) => s.sheetName === item.sheetName);
                    if (sheetOriginalIndex !== -1) {
                      setActiveSheetIndex(sheetOriginalIndex);
                      setViewMode('SHEET_WISE');
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    item.count > 0 
                      ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100' 
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                  title="Click to view original sheet"
                >
                  <div className="text-[11px] font-bold text-slate-700 truncate">{item.sheetName}</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {item.count}{' '}
                    <span className="text-[10px] font-normal text-slate-500">
                      files {item.totalEntries > item.count ? `(${item.totalEntries} rows)` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IF SHEET_WISE VIEW: Selector Buttons */}
        {viewMode === 'SHEET_WISE' && sheetsData.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-100">
            {sheetsData.map((sheet, sIdx) => {
              const isActive = sIdx === activeSheetIndex;
              return (
                <button
                  key={sIdx}
                  onClick={() => {
                    setActiveSheetIndex(sIdx);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>{sheet.sheetName}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* SEARCH & ROWS PER PAGE */}
        {sheetsData.length > 0 && (
          <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Applicant, App / Txn ID, Village, Survey No..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span>rows</span>
              </div>

              <span className="text-xs font-bold text-slate-600">
                Showing <strong className="text-blue-700">{activeDisplayLength.toLocaleString('en-IN')}</strong> Records ({uniqueConsolidatedCount} Unique Files)
              </span>
            </div>
          </div>
        )}

        {/* DATA TABLES */}
        {sheetsData.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">
              {isLoadingFirestore ? 'Loading Live Data from Cloud...' : 'No RDO Pendency Data Loaded Yet'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {!isViewer 
                ? "Please click Upload Pendency Excel above to load the file." 
                : "No pendency records have been published yet. Please check back later."}
            </p>
            {!isViewer && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Upload Excel File
              </button>
            )}
          </div>
        ) : viewMode === 'CONSOLIDATED' ? (
          /* CONSOLIDATED TABLE */
          <>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-300 rounded-lg shadow-sm">
              <table className="w-full text-xs text-left border-separate border-spacing-0 border-t border-l border-slate-300 bg-white">
                <thead className="sticky top-0 z-30 shadow-md">
                  <tr className="sticky top-0 z-40 bg-[#134674]">
                    <th
                      colSpan={7}
                      className="sticky top-0 left-0 z-40 bg-[#134674] text-white px-4 py-2.5 border-b-2 border-r border-[#0e3253] text-center select-none"
                    >
                      <span className="text-sm md:text-base font-black text-white tracking-wide uppercase">
                        PENDING FILES: {selectedMandal === 'ALL' ? 'ALL MANDALS' : selectedMandal}
                      </span>
                    </th>
                  </tr>

                  <tr className="sticky top-[42px] z-30 bg-[#164875]">
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-center text-[11px] w-[50px]">
                      S.No
                    </th>
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-amber-300 text-center text-[11px] w-[150px]">
                      Module / Category
                    </th>
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-center text-[11px] w-[160px]">
                      App / Transaction ID
                    </th>
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-left text-[11px] pl-4 min-w-[190px]">
                      Applicant Name
                    </th>
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-center text-[11px] w-[130px]">
                      Mandal
                    </th>
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-center text-[11px] w-[130px]">
                      Village
                    </th>
                    <th className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-amber-300 text-center text-[11px] w-[140px]">
                      Survey / Sub-Division No
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {paginatedConsolidated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 border-r border-b border-slate-200 font-bold">
                        No pending records found for {selectedMandal}.
                      </td>
                    </tr>
                  ) : (
                    paginatedConsolidated.map((item, rIdx) => {
                      const rowBg = rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
                      const sNo = (currentPage - 1) * rowsPerPage + rIdx + 1;

                      return (
                        <tr 
                          key={rIdx} 
                          onClick={() => setSelectedRowDetail({
                            sheetName: item.sheetName,
                            headers: item.headers,
                            row: item.row
                          })}
                          className={`${rowBg} hover:bg-amber-50/60 transition-colors cursor-pointer group`}
                          title="Click to view full record details"
                        >
                          <td className="py-2.5 px-3 border-r border-b border-slate-200 text-center font-bold text-slate-700 w-[50px]">
                            {sNo}
                          </td>
                          <td className="py-2.5 px-3 border-r border-b border-slate-200 text-center font-bold text-blue-900 w-[150px]">
                            <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded text-[11px] border border-blue-200 font-bold block truncate">
                              {item.sheetName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-b border-slate-200 text-center font-mono font-bold text-slate-900 text-xs">
                            {item.appNo}
                          </td>
                          <td className="py-2.5 px-4 border-r border-b border-slate-200 font-bold text-slate-900 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span>{item.applicantName}</span>
                              <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-b border-slate-200 text-center font-extrabold text-slate-900 text-xs">
                            {item.mandalName}
                          </td>
                          <td className="py-2.5 px-3 border-r border-b border-slate-200 text-center font-semibold text-slate-700 text-xs">
                            {item.villageName}
                          </td>
                          <td className="py-2.5 px-3 border-r border-b border-slate-200 text-center font-bold text-indigo-900 text-xs font-mono">
                            {item.surveyNo}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="text-slate-600 font-semibold">
                Showing{' '}
                <strong className="text-slate-900">
                  {filteredConsolidatedData.length === 0 ? 0 : ((currentPage - 1) * rowsPerPage + 1).toLocaleString('en-IN')}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900">
                  {Math.min(currentPage * rowsPerPage, filteredConsolidatedData.length).toLocaleString('en-IN')}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900">
                  {filteredConsolidatedData.length.toLocaleString('en-IN')}
                </strong>{' '}
                entries (<strong className="text-blue-700">{uniqueConsolidatedCount}</strong> Unique Files)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1 font-semibold text-slate-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded border border-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1 font-semibold text-slate-700"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ORIGINAL SHEET VIEW */
          <>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-300 rounded-lg shadow-sm">
              <table className="w-full text-xs text-left border-separate border-spacing-0 border-t border-l border-slate-300 bg-white">
                <thead className="sticky top-0 z-30 shadow-md">
                  <tr className="sticky top-0 z-40 bg-[#134674]">
                    <th
                      colSpan={currentSheet.headers.length || 1}
                      className="sticky top-0 left-0 z-40 bg-[#134674] text-white px-4 py-2.5 border-b-2 border-r border-[#0e3253] text-center select-none"
                    >
                      <span className="text-sm md:text-base font-black text-white tracking-wide">
                        MODULE: {currentSheet.sheetName.toUpperCase()} — {selectedMandal}
                      </span>
                    </th>
                  </tr>

                  <tr className="sticky top-[42px] z-30 bg-[#164875]">
                    {currentSheet.headers.map((colName, cIdx) => (
                      <th
                        key={cIdx}
                        className="sticky top-[42px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-center shadow-xs text-[11px]"
                      >
                        {colName}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {paginatedSingleSheet.length === 0 ? (
                    <tr>
                      <td colSpan={currentSheet.headers.length || 1} className="py-10 text-center text-slate-400 border-r border-b border-slate-200">
                        No matching records found in {currentSheet.sheetName} for {selectedMandal}.
                      </td>
                    </tr>
                  ) : (
                    paginatedSingleSheet.map((row, rIdx) => {
                      const firstCell = String(row[0] || '').toLowerCase().trim();
                      const secondCell = String(row[1] || '').toLowerCase().trim();
                      const isTotalRow = firstCell.includes('total') || secondCell.includes('total') || firstCell.includes('grand') || secondCell.includes('grand');

                      if (isTotalRow) {
                        return (
                          <tr key={rIdx} className="bg-amber-100/90 font-black text-slate-950 border-t-2 border-slate-400">
                            <td 
                              colSpan={2} 
                              className="py-2.5 px-4 border-r border-b border-slate-300 text-center font-black uppercase tracking-wider text-xs bg-amber-200/90 text-slate-950"
                            >
                              Grand Total
                            </td>
                            {currentSheet.headers.slice(2).map((_, cIdx) => {
                              const actualColIdx = cIdx + 2;
                              const val = row[actualColIdx] !== undefined && row[actualColIdx] !== null ? String(row[actualColIdx]) : '';
                              return (
                                <td
                                  key={actualColIdx}
                                  className="py-2 px-3 border-r border-b border-slate-300 whitespace-nowrap text-center font-black text-xs text-slate-950"
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }

                      const rowBg = rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
                      return (
                        <tr key={rIdx} className={`${rowBg} hover:bg-blue-50/60 transition-colors`}>
                          {currentSheet.headers.map((_, cIdx) => {
                            const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
                            const isMandalCol = cIdx === currentSheetMandalIdx;
                            return (
                              <td
                                key={cIdx}
                                className={`py-2 px-3 border-r border-b border-slate-200 whitespace-nowrap text-[11.5px] ${
                                  isMandalCol 
                                    ? 'font-bold text-blue-900 text-left pl-4' 
                                    : 'font-medium text-slate-800 text-center'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* SINGLE SHEET PAGINATION */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="text-slate-600 font-semibold">
                Showing{' '}
                <strong className="text-slate-900">
                  {filteredSingleSheetRows.length === 0 ? 0 : ((currentPage - 1) * rowsPerPage + 1).toLocaleString('en-IN')}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900">
                  {Math.min(currentPage * rowsPerPage, filteredSingleSheetRows.length).toLocaleString('en-IN')}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900">
                  {filteredSingleSheetRows.length.toLocaleString('en-IN')}
                </strong>{' '}
                records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1 font-semibold text-slate-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded border border-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1 font-semibold text-slate-700"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* POPUP MODAL */}
      {selectedRowDetail && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="bg-[#061122] text-white px-5 py-4 flex justify-between items-center border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">
                  Complete File Details: {selectedRowDetail.sheetName}
                </span>
              </div>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedRowDetail.headers.map((h, i) => {
                  const val = selectedRowDetail.row[i];
                  return (
                    <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] font-black uppercase text-slate-500">{h}</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5 break-words">
                        {val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="px-4 py-2 bg-[#134674] hover:bg-[#0f3b63] text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};