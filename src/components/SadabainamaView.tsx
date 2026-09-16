import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  X,
  CheckCircle2,
  AlertCircle,
  Printer,
  Clock,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { db } from "../utils/firebase";
import { safeSaveLocalStorage } from '../utils/storage';
import { DEFAULT_SADABAINAMA_ABSTRACT, DEFAULT_SADABAINAMA_REPORT } from '../data/sadabainamaData';
import { printTableReport } from '../utils/printReport';
import { StaffUser } from '../types';

interface SadabainamaViewProps {
  abstractData: any[][] | null;
  reportData: any[][] | null;
  currentUser?: StaffUser | null;
  onUpdateAbstract: (data: any[][] | null) => void;
  onUpdateReport: (data: any[][] | null) => void;
  onShowToast: (msg: string) => void;
}

export const SadabainamaView: React.FC<SadabainamaViewProps> = ({
  abstractData,
  reportData,
  currentUser,
  onUpdateAbstract,
  onUpdateReport,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';
  const [isUploading, setIsUploading] = useState(false);
  const [abstractSearch, setAbstractSearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [selectedAbstractCard, setSelectedAbstractCard] = useState<'all' | 'pending_tahsildar' | 'pending_rdo' | 'approved_synos' | 'total_surveys'>('all');
  const [selectedDetailFilter, setSelectedDetailFilter] = useState<'all' | 'approved' | 'rejected' | 'pending_tahsildar' | 'pending_rdo'>('all');

  // Performance: Pagination Controls
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const CHUNK_SIZE = 150;

  const fetchDetailedReportFromChunks = async () => {
    try {
      const chunksColl = collection(db, 'sadabainama_report_chunks');
      const querySnap = await getDocs(chunksColl);

      if (!querySnap.empty) {
        const sortedDocs = querySnap.docs.sort((a, b) => {
          const idxA = parseInt(a.id.replace('chunk_', ''), 10) || 0;
          const idxB = parseInt(b.id.replace('chunk_', ''), 10) || 0;
          return idxA - idxB;
        });

        let fullRows: any[][] = [];
        sortedDocs.forEach((d) => {
          const chunkData = d.data();
          if (chunkData?.rows) {
            try {
              const parsed = JSON.parse(chunkData.rows);
              fullRows = fullRows.concat(parsed);
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        });

        if (fullRows.length > 0) {
          onUpdateReport(fullRows);
          safeSaveLocalStorage('rdo_sadabainama_report', fullRows);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching detailed chunks:', err);
    }
  };

  useEffect(() => {
    const unsubAbstract = onSnapshot(doc(db, 'sadabainama_data', 'abstract'), (snap) => {
      if (snap.exists() && snap.data()?.rows) {
        try {
          const rows = JSON.parse(snap.data().rows);
          onUpdateAbstract(rows);
          safeSaveLocalStorage('rdo_sadabainama_abstract', rows);
        } catch (e) {
          console.error(e);
        }
      }
    }, (error) => {
      console.error('Firestore Abstract sync error:', error);
    });

    const unsubReportMeta = onSnapshot(doc(db, 'sadabainama_data', 'report_meta'), (snap) => {
      if (snap.exists()) {
        fetchDetailedReportFromChunks();
      }
    }, (error) => {
      console.error('Firestore Report sync error:', error);
    });

    return () => {
      unsubAbstract();
      unsubReportMeta();
    };
  }, [onUpdateAbstract, onUpdateReport]);

  const currentAbstract = abstractData || DEFAULT_SADABAINAMA_ABSTRACT;
  const currentReport = reportData || DEFAULT_SADABAINAMA_REPORT;

  const abstractFileInputRef = useRef<HTMLInputElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'abstract' | 'report') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.XLSX) {
      onShowToast('SheetJS library is still initializing. Please wait a moment.');
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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[][] = window.XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        });

        if (!rawRows || rawRows.length === 0) {
          onShowToast('Uploaded Excel file is empty.');
          setIsUploading(false);
          return;
        }

        if (type === 'abstract') {
          const rowsJson = JSON.stringify(rawRows);
          await setDoc(doc(db, 'sadabainama_data', 'abstract'), {
            rows: rowsJson,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Staff'
          });
          onUpdateAbstract(rawRows);
          safeSaveLocalStorage('rdo_sadabainama_abstract', rawRows);
          onShowToast('Sadabainama Abstract uploaded & synced to all systems!');
        } else {
          const chunksColl = collection(db, 'sadabainama_report_chunks');
          const existingSnap = await getDocs(chunksColl);

          if (!existingSnap.empty) {
            const deleteBatch = writeBatch(db);
            existingSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
            await deleteBatch.commit();
          }

          const totalChunks = Math.ceil(rawRows.length / CHUNK_SIZE);
          for (let i = 0; i < totalChunks; i++) {
            const slice = rawRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkDocRef = doc(db, 'sadabainama_report_chunks', `chunk_${i.toString().padStart(4, '0')}`);
            await setDoc(chunkDocRef, {
              rows: JSON.stringify(slice),
              chunkIndex: i
            });
          }

          await setDoc(doc(db, 'sadabainama_data', 'report_meta'), {
            totalRows: rawRows.length,
            totalChunks,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.name || 'Staff'
          });

          onUpdateReport(rawRows);
          safeSaveLocalStorage('rdo_sadabainama_report', rawRows);
          setCurrentPage(1);
          onShowToast(`Sadabainama Detailed Report (${rawRows.length} rows) synced to all systems!`);
        }
      } catch (err) {
        console.error('Excel parse or sync error:', err);
        onShowToast('Error saving data to Cloud. Check internet connection.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleClear = async (type: 'abstract' | 'report') => {
    try {
      if (type === 'abstract') {
        await deleteDoc(doc(db, 'sadabainama_data', 'abstract'));
        onUpdateAbstract(null);
        localStorage.removeItem('rdo_sadabainama_abstract');
        setAbstractSearch('');
        onShowToast('Sadabainama Abstract removed from cloud across all systems.');
      } else {
        const chunksColl = collection(db, 'sadabainama_report_chunks');
        const existingSnap = await getDocs(chunksColl);
        if (!existingSnap.empty) {
          const deleteBatch = writeBatch(db);
          existingSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
          await deleteBatch.commit();
        }
        await deleteDoc(doc(db, 'sadabainama_data', 'report_meta'));
        onUpdateReport(null);
        localStorage.removeItem('rdo_sadabainama_report');
        setReportSearch('');
        setCurrentPage(1);
        onShowToast('Sadabainama Report removed from cloud across all systems.');
      }
    } catch (err) {
      console.error('Clear error:', err);
      onShowToast('Error clearing data from Cloud.');
    }
  };

  const handleResetAbstract = async () => {
    try {
      await setDoc(doc(db, 'sadabainama_data', 'abstract'), {
        rows: JSON.stringify(DEFAULT_SADABAINAMA_ABSTRACT),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Default'
      });
      onUpdateAbstract(DEFAULT_SADABAINAMA_ABSTRACT);
      safeSaveLocalStorage('rdo_sadabainama_abstract', DEFAULT_SADABAINAMA_ABSTRACT);
      setAbstractSearch('');
      onShowToast('Reset to official Huzurnagar Sadabainama Abstract across all systems!');
    } catch (err) {
      console.error(err);
      onShowToast('Error resetting abstract.');
    }
  };

  const handleResetReport = async () => {
    try {
      const rawRows = DEFAULT_SADABAINAMA_REPORT;
      const chunksColl = collection(db, 'sadabainama_report_chunks');
      const existingSnap = await getDocs(chunksColl);
      if (!existingSnap.empty) {
        const deleteBatch = writeBatch(db);
        existingSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
        await deleteBatch.commit();
      }

      const totalChunks = Math.ceil(rawRows.length / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const slice = rawRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkDocRef = doc(db, 'sadabainama_report_chunks', `chunk_${i.toString().padStart(4, '0')}`);
        await setDoc(chunkDocRef, {
          rows: JSON.stringify(slice),
          chunkIndex: i
        });
      }

      await setDoc(doc(db, 'sadabainama_data', 'report_meta'), {
        totalRows: rawRows.length,
        totalChunks,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Default'
      });

      onUpdateReport(DEFAULT_SADABAINAMA_REPORT);
      safeSaveLocalStorage('rdo_sadabainama_report', DEFAULT_SADABAINAMA_REPORT);
      setReportSearch('');
      setCurrentPage(1);
      onShowToast('Reset to official Huzurnagar Sadabainama Detailed Report across all systems!');
    } catch (err) {
      console.error(err);
      onShowToast('Error resetting report.');
    }
  };

  const handleExportCSV = (rows: any[][], fileName: string) => {
    if (!rows || rows.length === 0) return;
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell !== undefined && cell !== null ? cell : '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`${fileName}.csv downloaded.`);
  };

  const getColType = (colName: any, idx: number): 'tahsildarPending' | 'rdoPending' | 'mandal' | 'sno' | 'normal' => {
    const name = String(colName || '').toLowerCase().trim();
    if (name.includes('s. no') || name.includes('s.no') || (idx === 0 && name.includes('no'))) {
      return 'sno';
    }
    if (name.includes('mandal')) {
      return 'mandal';
    }
    if (
      (name.includes('pending') && name.includes('tahsildar') && (name.includes('application') || !name.includes('survey'))) ||
      idx === 5
    ) {
      return 'tahsildarPending';
    }
    if (
      (name.includes('pending') && name.includes('rdo') && (name.includes('application') || !name.includes('survey'))) ||
      idx === 6
    ) {
      return 'rdoPending';
    }
    return 'normal';
  };

  const parsedAbstract = useMemo(() => {
    if (!currentAbstract || currentAbstract.length === 0) {
      return { 
        header: [], 
        dataRows: [], 
        totalRow: null, 
        reportTitle: 'Sadabainama Abstract Report' 
      };
    }

    let reportTitle = 'Sadabainama Abstract Report as on 05-09-2026 17.56.04';
    let headerRowIdx = 0;

    const row0 = currentAbstract[0] || [];
    const row1 = currentAbstract[1] || [];

    const row0FirstCell = String(row0[0] || '').trim();
    const row0NonEmptyCount = row0.filter((c) => String(c || '').trim() !== '').length;

    const isRow0Title =
      row0FirstCell.toLowerCase().includes('sadabainama') ||
      row0FirstCell.toLowerCase().includes('abstract') ||
      (row0NonEmptyCount <= 2 && row1 && row1.length > 2 && (
        String(row1[0] || '').toLowerCase().includes('s. no') ||
        String(row1[0] || '').toLowerCase().includes('s.no') ||
        String(row1[1] || '').toLowerCase().includes('mandal') ||
        String(row1[2] || '').toLowerCase().includes('application')
      ));

    if (isRow0Title) {
      reportTitle = row0FirstCell || reportTitle;
      headerRowIdx = 1;
    }

    const header = currentAbstract[headerRowIdx] || [];
    const rest = currentAbstract.slice(headerRowIdx + 1);

    let totalRow: any[] | null = null;
    const dataRows: any[][] = [];

    for (const row of rest) {
      const isTotal = row.some((c) => String(c || '').trim().toUpperCase() === 'TOTAL');
      if (isTotal) {
        totalRow = row;
      } else if (row.some((c) => String(c || '').trim() !== '')) {
        dataRows.push(row);
      }
    }

    return { header, dataRows, totalRow, reportTitle };
  }, [currentAbstract]);

  const abstractStats = useMemo(() => {
    const { header, dataRows, totalRow } = parsedAbstract;
    const headerNormalized = (header || []).map((h: any) =>
      String(h || '').trim().toLowerCase()
    );

    const totalAppsIdx = headerNormalized.findIndex(
      (h: string) =>
        (h.includes('total application') || h.includes('total apps') || h === 'applications' || h === 'total applications') &&
        !h.includes('pending') &&
        !h.includes('completed')
    );
    const pendingTahIdx = headerNormalized.findIndex(
      (h: string) =>
        (h.includes('pending at tahsildar') || h.includes('pending_tahsildar')) &&
        !h.includes('survey')
    );
    const pendingRdoIdx = headerNormalized.findIndex(
      (h: string) =>
        (h.includes('pending at rdo') || h.includes('pending_rdo')) &&
        !h.includes('survey')
    );
    const approvedSyNosIdx = headerNormalized.findIndex(
      (h: string) =>
        h.includes('approved by rdo') ||
        h.includes('survey approved') ||
        h.includes('approved sy') ||
        h.includes('approved synos') ||
        (h.includes('approved') && h.includes('survey'))
    );
    const totalSurveysIdx = headerNormalized.findIndex(
      (h: string) =>
        (h.includes('total survey') || h.includes('survey numbers') || h === 'survey numbers' || h === 'total survey numbers') &&
        !h.includes('pending') &&
        !h.includes('approved') &&
        !h.includes('rejected')
    );

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
        cols: { appsCol, surveysCol, pendingTahCol, pendingRdoCol, approvedSyNosCol },
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
      cols: { appsCol, surveysCol, pendingTahCol, pendingRdoCol, approvedSyNosCol },
    };
  }, [parsedAbstract]);

  const filteredAbstractDataRows = useMemo(() => {
    let rows = parsedAbstract.dataRows;

    if (selectedAbstractCard !== 'all' && abstractStats.cols) {
      const { cols } = abstractStats;
      const parseNum = (val: any) => {
        const cleaned = String(val || '').replace(/,/g, '').trim();
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      };

      if (selectedAbstractCard === 'pending_tahsildar') {
        rows = rows.filter((r) => parseNum(r[cols.pendingTahCol]) > 0);
      } else if (selectedAbstractCard === 'pending_rdo') {
        rows = rows.filter((r) => parseNum(r[cols.pendingRdoCol]) > 0);
      } else if (selectedAbstractCard === 'approved_synos') {
        rows = rows.filter((r) => parseNum(r[cols.approvedSyNosCol]) > 0);
      } else if (selectedAbstractCard === 'total_surveys') {
        rows = rows.filter((r) => parseNum(r[cols.surveysCol]) > 0);
      }
    }

    if (!abstractSearch.trim()) return rows;
    const q = abstractSearch.toLowerCase().trim();
    return rows.filter((row) =>
      row.some((cell) => String(cell || '').toLowerCase().includes(q))
    );
  }, [parsedAbstract.dataRows, abstractSearch, selectedAbstractCard, abstractStats]);

  const displayTotalRow = useMemo(() => {
    if (!parsedAbstract.header.length) return null;
    
    if (!abstractSearch.trim() && selectedAbstractCard === 'all' && parsedAbstract.totalRow) {
      return parsedAbstract.totalRow;
    }

    const colsCount = parsedAbstract.header.length;
    const sumRow: any[] = new Array(colsCount).fill('');
    
    sumRow[0] = '';
    const mandalIdx = parsedAbstract.header.findIndex((h) => String(h).toLowerCase().includes('mandal'));
    sumRow[mandalIdx >= 0 ? mandalIdx : 1] = (abstractSearch.trim() || selectedAbstractCard !== 'all')
      ? `TOTAL (${filteredAbstractDataRows.length} MANDALS)` 
      : 'TOTAL';

    for (let c = 0; c < colsCount; c++) {
      if (c === 0 || c === mandalIdx) continue;
      let colSum = 0;
      let hasNumbers = false;
      for (const row of filteredAbstractDataRows) {
        const val = String(row[c] || '').replace(/,/g, '').trim();
        const num = parseFloat(val);
        if (!isNaN(num)) {
          colSum += num;
          hasNumbers = true;
        }
      }
      if (hasNumbers) {
        sumRow[c] = colSum.toLocaleString('en-IN');
      } else {
        sumRow[c] = '';
      }
    }

    return sumRow;
  }, [parsedAbstract.header, parsedAbstract.totalRow, filteredAbstractDataRows, abstractSearch, selectedAbstractCard]);

  const parsedDetailedReport = useMemo(() => {
    if (!currentReport || currentReport.length === 0) {
      return {
        reportTitle: 'Sadabainama Detailed Report as on 05-09-2026 17.56.04',
        header: [] as any[],
        dataRows: [] as any[][],
      };
    }

    let reportTitle = 'Sadabainama Detailed Report as on 05-09-2026 17.56.04';
    let headerRowIdx = 0;

    const row0 = currentReport[0] || [];
    const row1 = currentReport[1] || [];

    const row0FirstCell = String(row0[0] || '').trim();
    const row0NonEmptyCount = row0.filter((c) => String(c || '').trim() !== '').length;

    const isRow0Title =
      row0FirstCell.toLowerCase().includes('sadabainama') ||
      row0FirstCell.toLowerCase().includes('detailed') ||
      row0FirstCell.toLowerCase().includes('report as on') ||
      (row0NonEmptyCount <= 2 && row1 && row1.length > 2 && (
        String(row1[0] || '').toLowerCase().includes('s. no') ||
        String(row1[0] || '').toLowerCase().includes('s.no') ||
        String(row1[1] || '').toLowerCase().includes('mandal') ||
        String(row1[2] || '').toLowerCase().includes('village') ||
        String(row1[3] || '').toLowerCase().includes('application')
      ));

    if (isRow0Title) {
      reportTitle = row0FirstCell || reportTitle;
      headerRowIdx = 1;
    }

    const header = currentReport[headerRowIdx] || [];
    const rawData = currentReport.slice(headerRowIdx + 1);
    const dataRows = rawData.filter((row) => row.some((c) => String(c || '').trim() !== ''));

    return {
      reportTitle,
      header,
      dataRows,
    };
  }, [currentReport]);

  const detailedStats = useMemo(() => {
    const { header, dataRows } = parsedDetailedReport;

    if (!dataRows || dataRows.length === 0) {
      return {
        totalApps: 0,
        approvedApps: 0,
        rejectedApps: 0,
        pendingTahsildar: 0,
        pendingRdo: 0,
        appMap: new Map<string, { status: 'approved' | 'rejected' | 'pending_tahsildar' | 'pending_rdo' | 'other'; appNo: string }>(),
      };
    }

    const headerNormalized = (header || []).map((h: any) =>
      String(h || '').trim().toLowerCase()
    );

    const appNoIdx = headerNormalized.findIndex((h: string) =>
      h.includes('application no') ||
      h.includes('application_no') ||
      h.includes('appl no') ||
      h.includes('app no') ||
      h.includes('application id') ||
      h.includes('application number') ||
      h === 'app_no' ||
      h === 'appl_no' ||
      h === 'application'
    );

    const statusIdx = headerNormalized.findIndex((h: string) =>
      h.includes('current status') ||
      h.includes('status') ||
      h.includes('stage') ||
      h.includes('disposal')
    );

    const pendingOfficeIdx = headerNormalized.findIndex((h: string) =>
      h.includes('pending office') ||
      h.includes('pending level') ||
      h.includes('pending at') ||
      h.includes('pending with') ||
      h.includes('office') ||
      h.includes('level')
    );

    const actionTakenIdx = headerNormalized.findIndex((h: string) =>
      h.includes('action taken') ||
      h.includes('remarks') ||
      h.includes('order') ||
      h.includes('action')
    );

    type AppStatus = 'approved' | 'rejected' | 'pending_tahsildar' | 'pending_rdo' | 'other';
    const appMap = new Map<string, { status: AppStatus; appNo: string }>();

    dataRows.forEach((row: any[], rowIdx: number) => {
      if (!row || row.length === 0) return;
      const appNoRaw = appNoIdx !== -1 ? String(row[appNoIdx] || '').trim() : '';
      const appKey = appNoRaw && appNoRaw !== '-' && appNoRaw.toLowerCase() !== 'null'
        ? appNoRaw
        : `row_${rowIdx}`;

      const statusText = [
        statusIdx !== -1 ? String(row[statusIdx] || '') : '',
        pendingOfficeIdx !== -1 ? String(row[pendingOfficeIdx] || '') : '',
        actionTakenIdx !== -1 ? String(row[actionTakenIdx] || '') : '',
      ].join(' ').toLowerCase();

      const searchTarget = (statusIdx !== -1 || pendingOfficeIdx !== -1 || actionTakenIdx !== -1)
        ? statusText
        : row.join(' ').toLowerCase();

      let rowStatus: AppStatus = 'other';

      if (
        searchTarget.includes('reject') ||
        searchTarget.includes('dismiss') ||
        searchTarget.includes('disapprov') ||
        searchTarget.includes('cancel') ||
        searchTarget.includes('drop') ||
        searchTarget.includes('invalid')
      ) {
        rowStatus = 'rejected';
      } else if (
        searchTarget.includes('approv') ||
        searchTarget.includes('complet') ||
        searchTarget.includes('regulariz') ||
        searchTarget.includes('sanction') ||
        searchTarget.includes('13-b') ||
        searchTarget.includes('orders issued') ||
        searchTarget.includes('order issued') ||
        searchTarget.includes('accepted')
      ) {
        rowStatus = 'approved';
      } else if (
        searchTarget.includes('tahsildar') ||
        searchTarget.includes('mro') ||
        searchTarget.includes('vro') ||
        searchTarget.includes('field enquiry')
      ) {
        rowStatus = 'pending_tahsildar';
      } else if (
        searchTarget.includes('rdo') ||
        searchTarget.includes('sub collector') ||
        searchTarget.includes('dao')
      ) {
        rowStatus = 'pending_rdo';
      }

      if (!appMap.has(appKey)) {
        appMap.set(appKey, {
          status: rowStatus,
          appNo: appKey,
        });
      } else {
        const existing = appMap.get(appKey)!;
        if (rowStatus === 'rejected') {
          existing.status = 'rejected';
        } else if (existing.status !== 'rejected' && rowStatus === 'approved') {
          existing.status = 'approved';
        } else if (existing.status === 'other' && rowStatus !== 'other') {
          existing.status = rowStatus;
        }
      }
    });

    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingTahsildarCount = 0;
    let pendingRdoCount = 0;

    appMap.forEach((val) => {
      if (val.status === 'approved') approvedCount++;
      else if (val.status === 'rejected') rejectedCount++;
      else if (val.status === 'pending_tahsildar') pendingTahsildarCount++;
      else if (val.status === 'pending_rdo') pendingRdoCount++;
    });

    return {
      totalApps: appMap.size,
      approvedApps: approvedCount,
      rejectedApps: rejectedCount,
      pendingTahsildar: pendingTahsildarCount,
      pendingRdo: pendingRdoCount,
      appMap,
    };
  }, [parsedDetailedReport]);

  const filteredDetailedDataRows = useMemo(() => {
    let rows = parsedDetailedReport.dataRows;

    if (selectedDetailFilter !== 'all' && detailedStats.appMap.size > 0) {
      const { appMap } = detailedStats;
      const { header } = parsedDetailedReport;
      const headerNormalized = (header || []).map((h: any) => String(h || '').trim().toLowerCase());
      const appNoIdx = headerNormalized.findIndex((h: string) =>
        h.includes('application no') || h.includes('app no') || h === 'app_no' || h.includes('application number')
      );

      rows = rows.filter((row, rowIdx) => {
        const appNoRaw = appNoIdx !== -1 ? String(row[appNoIdx] || '').trim() : '';
        const appKey = appNoRaw && appNoRaw !== '-' && appNoRaw.toLowerCase() !== 'null'
          ? appNoRaw
          : `row_${rowIdx}`;
        const appInfo = appMap.get(appKey);
        return appInfo && appInfo.status === selectedDetailFilter;
      });
    }

    if (!reportSearch.trim()) return rows;
    const q = reportSearch.toLowerCase().trim();
    return rows.filter((row) =>
      row.some((cell) => String(cell || '').toLowerCase().includes(q))
    );
  }, [parsedDetailedReport.dataRows, parsedDetailedReport.header, reportSearch, selectedDetailFilter, detailedStats.appMap]);

  // Reset to page 1 whenever filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [reportSearch, selectedDetailFilter]);

  // Fast slice: Paginated Rows for Ultra-Smooth DOM rendering
  const paginatedDetailedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredDetailedDataRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredDetailedDataRows, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredDetailedDataRows.length / rowsPerPage));

  const handlePrintAbstract = () => {
    const colgroup = `
      <colgroup>
        <col style="width: 3.5%;" />
        <col style="width: 19%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
        <col style="width: 7.75%;" />
      </colgroup>
    `;

    const ths = parsedAbstract.header.map((colName: any, idx: number) => {
      const colType = getColType(colName, idx);
      const isMandal = colType === 'mandal';
      const align = isMandal ? 'text-align: left; padding-left: 8px; white-space: nowrap !important;' : 'text-align: center;';
      return `<th style="background-color: #ffffff !important; background: #ffffff !important; color: #000000 !important; font-size: 9.5px; font-weight: 800; padding: 6px 3px; border: 1px solid #334155 !important; ${align}">${colName}</th>`;
    }).join('');

    const trs = filteredAbstractDataRows.map((row: any[]) => {
      const tds = parsedAbstract.header.map((colName: any, cIdx: number) => {
        const colType = getColType(colName, cIdx);
        const isTahsildarPending = colType === 'tahsildarPending';
        const isRdoPending = colType === 'rdoPending';
        const isMandal = colType === 'mandal';
        const isSno = colType === 'sno';
        const val = row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : '';
        const style = isTahsildarPending 
          ? 'background-color: #ffffc8 !important; font-weight: 900; text-align: center;' 
          : isRdoPending 
          ? 'background-color: #ffedd5 !important; font-weight: 900; text-align: center;' 
          : isMandal 
          ? 'text-align: left; font-weight: 800; padding-left: 8px; white-space: nowrap !important; font-size: 9.5px;' 
          : isSno 
          ? 'text-align: center; font-weight: 700;' 
          : 'text-align: center; font-weight: 600;';
        return `<td style="${style} padding: 4.5px 3px; border: 1px solid #94a3b8;">${val}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    let totalTr = '';
    if (displayTotalRow) {
      const tds = parsedAbstract.header.map((colName: any, cIdx: number) => {
        const colType = getColType(colName, cIdx);
        const isTahsildarPending = colType === 'tahsildarPending';
        const isRdoPending = colType === 'rdoPending';
        const val = displayTotalRow[cIdx] !== undefined && displayTotalRow[cIdx] !== null ? displayTotalRow[cIdx] : '';
        const bg = isTahsildarPending 
          ? '#fef08a' 
          : isRdoPending 
          ? '#fed7aa' 
          : '#e9ecf5';
        const align = cIdx === 1 ? 'text-align: left; padding-left: 8px; white-space: nowrap !important;' : 'text-align: center;';
        return `<td style="background-color: ${bg} !important; font-weight: 900; ${align} padding: 6px 3px; border: 1px solid #64748b;">${val}</td>`;
      }).join('');
      totalTr = `<tfoot><tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">${tds}</tr></tfoot>`;
    }

    const titleTh = `
      <tr>
        <th colspan="${parsedAbstract.header.length}" style="background-color: #134674 !important; color: #ffffff !important; font-size: 13px; font-weight: 900; text-align: center; padding: 9px; border: 1px solid #94a3b8;">
          ${parsedAbstract.reportTitle}
        </th>
      </tr>
    `;

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
        ${colgroup}
        <thead>
          ${titleTh}
          <tr>${ths}</tr>
        </thead>
        <tbody>${trs}</tbody>
        ${totalTr}
      </table>
    `;

    printTableReport(tableHtml, {
      title: parsedAbstract.reportTitle,
      subtitle: 'Revenue Divisional Office, Huzurnagar • Suryapet District',
      period: '05-09-2026 17:56:04',
      landscape: true,
      fileName: 'Sadabainama_Abstract_Report',
    });
  };

  const handlePrintDetailed = () => {
    if (!parsedDetailedReport.header.length) {
      onShowToast('No detailed report data loaded to print.');
      return;
    }
    const header = parsedDetailedReport.header;
    const dataRows = filteredDetailedDataRows;

    const detailedColgroup = `
      <colgroup>
        <col style="width: 3%;" />
        <col style="width: 8.5%;" />
        <col style="width: 8.5%;" />
        <col style="width: 8.5%;" />
        <col style="width: 5%;" />
        <col style="width: 6%;" />
        <col style="width: 5.5%;" />
        <col style="width: 10%;" />
        <col style="width: 9%;" />
        <col style="width: 9%;" />
        <col style="width: 7%;" />
        <col style="width: 9.5%;" />
        <col style="width: 6.5%;" />
        <col style="width: 4%;" />
      </colgroup>
    `;

    const titleTh = `
      <tr>
        <th colspan="${header.length}" style="background-color: #134674 !important; color: #ffffff !important; font-size: 12px; font-weight: 900; text-align: center; padding: 7px; border: 1px solid #94a3b8;">
          ${parsedDetailedReport.reportTitle}
        </th>
      </tr>
    `;

    const ths = header.map((col: any) => 
      `<th style="background-color: #ffffff !important; background: #ffffff !important; color: #000000 !important; padding: 4px 2px !important; border: 1px solid #334155 !important; font-size: 8px !important; font-weight: 800; text-align: center; line-height: 1.2;">${col}</th>`
    ).join('');

    const trs = dataRows.map((row: any[]) => {
      const tds = header.map((_: any, idx: number) => {
        const val = row[idx] !== undefined && row[idx] !== null ? String(row[idx]) : '';
        const isPendingTah = val.toLowerCase().includes('pending at tahsildar');
        const isPendingRdo = val.toLowerCase().includes('pending at rdo');
        const bg = isPendingTah 
          ? 'background-color: #ffffc8 !important; font-weight: bold;' 
          : isPendingRdo 
          ? 'background-color: #ffedd5 !important; font-weight: bold;' 
          : '';
        return `<td style="padding: 3px 2px !important; text-align: center; border: 1px solid #94a3b8 !important; font-size: 7.5px !important; line-height: 1.2; ${bg}">${val}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    const tableHtml = `
      <table style="width: 100% !important; border-collapse: collapse !important; font-size: 8px !important;">
        ${detailedColgroup}
        <thead>
          ${titleTh}
          <tr>${ths}</tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: parsedDetailedReport.reportTitle,
      subtitle: 'Revenue Divisional Office, Huzurnagar • Suryapet District',
      period: '05-09-2026 17:56:04',
      landscape: true,
      fileName: 'Sadabainama_Detailed_Report',
    });
  };

  return (
    <div className="space-y-6">
      {/* TOP DASHBOARD BANNER */}
      <div className="bg-gradient-to-r from-[#072418] via-[#0f402c] to-[#072418] text-white p-5 md:p-6 rounded-2xl shadow-xl border-t-2 border-amber-400 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 p-0.5 shadow-lg shadow-emerald-950/40 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#092b1d] rounded-[14px] flex items-center justify-center text-emerald-300">
                <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md shadow-xs">
                  Section 5A Regularization
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 rounded-md border border-emerald-400/30">
                  Telangana RoR Act &amp; Bhu Bharati Sec 6
                </span>
                <span className="text-xs font-semibold text-emerald-200">
                  Huzurnagar Division • 7 Mandals Regularization Tracker
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white drop-shadow-sm">
                SADABAINAMA REGULARIZATION &amp; SCRUTINY DASHBOARD
              </h1>
              <p className="text-xs text-emerald-100 font-medium max-w-3xl">
                Official tracking of unregistered sale deeds (Sadabainama), field verification, Tahsildar recommendations &amp; RDO final orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">
                Approved Sy.Nos
              </div>
              <div className="text-lg font-black text-white leading-none">
                {abstractStats.approvedSyNos}{' '}
                <span className="text-xs font-medium text-emerald-200">
                  / {abstractStats.totalSurveys} Survey Nos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => {
            setSelectedAbstractCard('all');
            setAbstractSearch('');
          }}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedAbstractCard === 'all'
              ? 'bg-gradient-to-br from-blue-50/90 via-white to-blue-100/40 border-2 border-blue-600 shadow-[0_12px_24px_-6px_rgba(37,99,235,0.3)] ring-2 ring-blue-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-blue-400 hover:shadow-[0_14px_28px_-6px_rgba(37,99,235,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">
              Total Applications
            </span>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
              selectedAbstractCard === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
            }`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-blue-950 group-hover:text-blue-600 group-hover:scale-105 origin-left transition-all duration-300">
            {abstractStats.totalApps}
          </div>
          <p className="relative z-10 text-[11px] text-blue-700 font-semibold mt-0.5">
            Total applications filed →
          </p>
        </div>

        <div
          onClick={() => setSelectedAbstractCard((prev) => (prev === 'pending_tahsildar' ? 'all' : 'pending_tahsildar'))}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedAbstractCard === 'pending_tahsildar'
              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 border-2 border-amber-500 shadow-[0_12px_24px_-6px_rgba(217,119,6,0.3)] ring-2 ring-amber-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-amber-400 hover:shadow-[0_14px_28px_-6px_rgba(217,119,6,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Pending at Tahsildar
            </span>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
              selectedAbstractCard === 'pending_tahsildar'
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-amber-700 group-hover:text-amber-600 group-hover:scale-105 origin-left transition-all duration-300">
            {abstractStats.pendingTah}
          </div>
          <p className="relative z-10 text-[11px] text-amber-700 font-semibold mt-0.5">
            Field inquiry pending →
          </p>
        </div>

        <div
          onClick={() => setSelectedAbstractCard((prev) => (prev === 'pending_rdo' ? 'all' : 'pending_rdo'))}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedAbstractCard === 'pending_rdo'
              ? 'bg-gradient-to-br from-purple-50/90 via-white to-purple-100/40 border-2 border-purple-600 shadow-[0_12px_24px_-6px_rgba(147,51,234,0.3)] ring-2 ring-purple-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-purple-400 hover:shadow-[0_14px_28px_-6px_rgba(147,51,234,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
              Pending at RDO
            </span>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
              selectedAbstractCard === 'pending_rdo'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-purple-50 border-purple-200 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-purple-700 group-hover:text-purple-600 group-hover:scale-105 origin-left transition-all duration-300">
            {abstractStats.pendingRdo}
          </div>
          <p className="relative z-10 text-[11px] text-purple-700 font-semibold mt-0.5">
            Final sanction awaited →
          </p>
        </div>

        <div
          onClick={() => setSelectedAbstractCard((prev) => (prev === 'approved_synos' ? 'all' : 'approved_synos'))}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedAbstractCard === 'approved_synos'
              ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/40 border-2 border-emerald-600 shadow-[0_12px_24px_-6px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Approved Sy.Nos
            </span>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
              selectedAbstractCard === 'approved_synos'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-emerald-700 group-hover:text-emerald-600 group-hover:scale-105 origin-left transition-all duration-300">
            {abstractStats.approvedSyNos}
          </div>
          <p className="relative z-10 text-[11px] text-emerald-700 font-semibold mt-0.5">
            Approved by RDO →
          </p>
        </div>

        <div
          onClick={() => {
            setSelectedAbstractCard((prev) => (prev === 'total_surveys' ? 'all' : 'total_surveys'));
          }}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 col-span-2 sm:col-span-1 ${
            selectedAbstractCard === 'total_surveys'
              ? 'bg-gradient-to-br from-teal-50/90 via-white to-teal-100/40 border-2 border-teal-600 shadow-[0_12px_24px_-6px_rgba(20,184,166,0.3)] ring-2 ring-teal-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(20,184,166,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800">
              Total Survey Numbers
            </span>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
              selectedAbstractCard === 'total_surveys'
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-teal-50 border-teal-200 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-teal-700 group-hover:text-teal-600 group-hover:scale-105 origin-left transition-all duration-300">
            {abstractStats.totalSurveys}
          </div>
          <p className="relative z-10 text-[11px] text-teal-700 font-semibold mt-0.5">
            Total land parcels covered →
          </p>
        </div>
      </div>

      {/* SECTION 1: SADABAINAMA ABSTRACT REPORT */}
      <div className="bg-white border-2 border-[#134674] rounded-xl shadow-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="abstractSearchInput"
                placeholder="Search Mandal, S.No, numbers, status..."
                value={abstractSearch}
                onChange={(e) => setAbstractSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs font-medium"
              />
              {abstractSearch && (
                <button
                  onClick={() => setAbstractSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isViewer && (
                <>
                  <input
                    type="file"
                    ref={abstractFileInputRef}
                    accept=".xls,.xlsx,.csv"
                    className="hidden"
                    onChange={(e) => handleExcelUpload(e, 'abstract')}
                  />
                  <button
                    disabled={isUploading}
                    onClick={() => abstractFileInputRef.current?.click()}
                    className="bg-[#134674] hover:bg-[#0f3b63] disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Upload custom Excel or CSV and sync with all systems"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload Abstract Excel</span>
                  </button>

                  <button
                    onClick={handlePrintAbstract}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Print official Sadabainama Abstract Table"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-300" />
                    <span>Print Abstract Table</span>
                  </button>

                  <button
                    onClick={() => handleExportCSV(currentAbstract, 'Sadabainama_Abstract_Huzurnagar')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Export as CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleResetAbstract}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    title="Reset to official Huzurnagar dataset across cloud"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Official</span>
                  </button>

                  {isAdmin && abstractData && (
                    <button
                      onClick={() => handleClear('abstract')}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      title="Clear uploaded file (Administrator Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-slate-500 font-bold mr-1">Filter Mandal:</span>
            <button
              onClick={() => setAbstractSearch('')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                !abstractSearch
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({parsedAbstract.dataRows.length})
            </button>
            {parsedAbstract.dataRows.map((r, i) => {
              const mandal = String(r[1] || '').trim();
              if (!mandal) return null;
              const isSelected = abstractSearch.toLowerCase().trim() === mandal.toLowerCase();
              return (
                <button
                  key={i}
                  onClick={() => setAbstractSearch(isSelected ? '' : mandal)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mandal.replace(/ \(.*\)/, '')}
                </button>
              );
            })}
          </div>
        </div>

        {(abstractSearch.trim() || selectedAbstractCard !== 'all') && (
          <div className="bg-blue-50/90 border-b border-blue-200 px-4 py-2 text-xs font-bold text-blue-900 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {selectedAbstractCard !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-extrabold uppercase">
                  {selectedAbstractCard === 'pending_tahsildar' && 'Pending at Tahsildar > 0'}
                  {selectedAbstractCard === 'pending_rdo' && 'Pending at RDO > 0'}
                  {selectedAbstractCard === 'approved_synos' && 'Approved Sy.Nos > 0'}
                  {selectedAbstractCard === 'total_surveys' && 'Survey Numbers > 0'}
                </span>
              )}
              <span>
                Showing {filteredAbstractDataRows.length} of {parsedAbstract.dataRows.length} mandals
                {abstractSearch.trim() ? ` for "${abstractSearch}"` : ''}
              </span>
            </div>
            <button
              onClick={() => {
                setAbstractSearch('');
                setSelectedAbstractCard('all');
              }}
              className="text-blue-700 hover:text-blue-950 hover:underline cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter (Show All)</span>
            </button>
          </div>
        )}

        <div 
          className="relative overflow-x-auto overflow-y-auto max-h-[620px] bg-white select-none"
          style={{ scrollBehavior: 'smooth' }}
        >
          <table className="w-full text-xs text-left border-separate border-spacing-0 border-t border-l border-slate-300">
            <thead className="sticky top-0 z-30 shadow-md">
              <tr className="sticky top-0 z-40 bg-[#134674]" style={{ height: '46px' }}>
                <th
                  colSpan={parsedAbstract.header.length || 12}
                  className="sticky top-0 left-0 z-40 bg-[#134674] text-white px-4 py-2.5 border-b-2 border-r border-[#0e3253] text-center select-none shadow-sm"
                  style={{ backgroundColor: '#134674', height: '46px' }}
                >
                  <div className="w-full flex items-center justify-center text-center">
                    <span className="text-sm md:text-base font-black text-white tracking-wide">
                      {parsedAbstract.reportTitle}
                    </span>
                  </div>
                </th>
              </tr>

              <tr className="sticky top-[46px] z-30 bg-[#164875]">
                {parsedAbstract.header.map((colName: any, idx: number) => {
                  const colType = getColType(colName, idx);
                  const isTahsildarPending = colType === 'tahsildarPending';
                  const isRdoPending = colType === 'rdoPending';
                  const isMandal = colType === 'mandal';
                  const isSno = colType === 'sno';

                  return (
                    <th
                      key={idx}
                      className={`sticky top-[46px] z-30 bg-[#164875] py-3.5 px-3 border-b-2 border-r border-slate-400/60 font-black text-xs tracking-wider select-none whitespace-normal ${
                        isTahsildarPending 
                          ? 'text-[#ffff00] text-center min-w-[130px] max-w-[140px]' 
                          : isRdoPending 
                          ? 'text-[#fed7aa] text-center min-w-[130px] max-w-[140px]'
                          : isMandal 
                          ? 'text-white text-left min-w-[240px] pl-4' 
                          : isSno 
                          ? 'text-white text-center w-[55px] min-w-[55px] max-w-[55px]' 
                          : 'text-white text-center min-w-[110px]'
                      }`}
                      style={{ backgroundColor: '#164875' }}
                    >
                      {String(colName || '')}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredAbstractDataRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={parsedAbstract.header.length || 12}
                    className="py-12 text-center text-slate-500 bg-slate-50 font-medium border-b border-r border-slate-300"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                      <p className="text-sm font-bold text-slate-700">
                        No matching records found for "{abstractSearch}"
                      </p>
                      <button
                        onClick={() => setAbstractSearch('')}
                        className="text-xs text-blue-600 hover:underline font-bold mt-1 cursor-pointer"
                      >
                        Reset Search to Show All Mandals
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAbstractDataRows.map((row, rIdx) => {
                  return (
                    <tr 
                      key={rIdx} 
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {parsedAbstract.header.map((colName: any, cIdx: number) => {
                        const colType = getColType(colName, cIdx);
                        const isTahsildarPending = colType === 'tahsildarPending';
                        const isRdoPending = colType === 'rdoPending';
                        const isMandal = colType === 'mandal';
                        const isSno = colType === 'sno';
                        const val = String(row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : '');

                        return (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 border-b border-r border-slate-300 text-xs ${
                              isTahsildarPending
                                ? 'bg-[#ffffc8] text-slate-950 font-black text-center text-sm'
                                : isRdoPending
                                ? 'bg-[#ffedd5] text-slate-950 font-black text-center text-sm'
                                : isMandal
                                ? 'bg-white text-slate-900 font-bold text-left pl-4 min-w-[240px]'
                                : isSno
                                ? 'bg-white text-slate-800 font-bold text-center w-[55px] min-w-[55px] max-w-[55px]'
                                : 'bg-white text-slate-800 font-bold text-center'
                            }`}
                            style={{
                              backgroundColor: isTahsildarPending 
                                ? '#ffffc8' 
                                : isRdoPending 
                                ? '#ffedd5' 
                                : '#ffffff'
                            }}
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

            {displayTotalRow && (
              <tfoot className="sticky bottom-0 z-30 shadow-md">
                <tr className="font-black bg-[#e9ecf5]">
                  {parsedAbstract.header.map((colName: any, cIdx: number) => {
                    const colType = getColType(colName, cIdx);
                    const isTahsildarPending = colType === 'tahsildarPending';
                    const isRdoPending = colType === 'rdoPending';
                    const isMandal = colType === 'mandal';
                    const isSno = colType === 'sno';
                    const val = String(displayTotalRow[cIdx] !== undefined && displayTotalRow[cIdx] !== null ? displayTotalRow[cIdx] : '');

                    return (
                      <td
                        key={cIdx}
                        className={`sticky bottom-0 z-30 py-3 px-3 border-t-2 border-b-2 border-r border-slate-400 font-black text-xs ${
                          isTahsildarPending
                            ? 'bg-[#fef08a] text-slate-950 text-center text-sm'
                            : isRdoPending
                            ? 'bg-[#fed7aa] text-slate-950 text-center text-sm'
                            : isMandal
                            ? 'bg-[#e9ecf5] text-slate-950 text-left pl-4 uppercase tracking-wider text-sm min-w-[240px]'
                            : isSno
                            ? 'bg-[#e9ecf5] text-slate-950 text-center w-[55px] min-w-[55px] max-w-[55px]'
                            : 'bg-[#e9ecf5] text-slate-950 text-center text-sm'
                        }`}
                        style={{
                          backgroundColor: isTahsildarPending 
                            ? '#fef08a' 
                            : isRdoPending 
                            ? '#fed7aa' 
                            : '#e9ecf5',
                        }}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="bg-slate-100 border-t border-slate-300 px-4 py-2.5 flex flex-wrap justify-between items-center text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3.5 h-3.5 rounded bg-[#ffffc8] border border-amber-300 inline-block"></span>
              <span>Pending at Tahsildar</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3.5 h-3.5 rounded bg-[#ffedd5] border border-orange-300 inline-block"></span>
              <span>Pending at RDO</span>
            </span>
          </div>
          <span className="font-semibold text-slate-500">
            Official Revenue Portal • Huzurnagar Division
          </span>
        </div>
      </div>

      {/* SECTION 2: SADABAINAMA DETAILED REPORT (HIGH-SPEED PAGINATION) */}
      <div className="bg-white border border-slate-200 border-t-4 border-t-blue-600 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Sadabainama Detailed Report</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Instant loading with high-speed pagination • {filteredDetailedDataRows.length.toLocaleString('en-IN')} Total Records
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isViewer && (
              <>
                <input
                  type="file"
                  ref={reportFileInputRef}
                  accept=".xls,.xlsx,.csv"
                  className="hidden"
                  onChange={(e) => handleExcelUpload(e, 'report')}
                />
                <button
                  disabled={isUploading}
                  onClick={() => reportFileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Upload Report Excel</span>
                </button>
                <button
                  onClick={handleResetReport}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-300 shadow-xs transition cursor-pointer"
                  title="Reset to official Huzurnagar sample report across cloud"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reset Sample</span>
                </button>
                {parsedDetailedReport.header.length > 0 && (
                  <button
                    onClick={handlePrintDetailed}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Print Detailed Report"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-300" />
                    <span>Print Detailed Report</span>
                  </button>
                )}
                {parsedDetailedReport.header.length > 0 && (
                  <button
                    onClick={() => handleExportCSV(currentReport || [], 'Sadabainama_Detailed_Report')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                )}
                {isAdmin && reportData && (
                  <button
                    onClick={() => handleClear('report')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    title="Clear uploaded report (Administrator Only)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Filter, Search & Rows per page */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Mandal, Village, Applicant, App No, Survey..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
              {reportSearch && (
                <button 
                  onClick={() => setReportSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedDetailFilter !== 'all' && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1 rounded-lg text-xs font-semibold">
                <span>
                  Card Filter: <strong className="font-extrabold uppercase">{selectedDetailFilter.replace('_', ' ')}</strong>
                </span>
                <button
                  onClick={() => setSelectedDetailFilter('all')}
                  className="text-blue-600 hover:text-blue-900 font-bold ml-1 cursor-pointer flex items-center gap-0.5"
                  title="Clear card filter"
                >
                  <X className="w-3 h-3" />
                  <span>Show All</span>
                </button>
              </div>
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

            <span className="text-xs font-bold text-slate-500">
              Total <span className="text-blue-700 font-extrabold">{filteredDetailedDataRows.length.toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>

        {parsedDetailedReport.header.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-lg space-y-2">
            <div>No Detailed Report data loaded yet.</div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => reportFileInputRef.current?.click()}
                className="text-blue-600 hover:underline font-bold"
              >
                Upload Report Excel
              </button>
              <span>or</span>
              <button
                onClick={handleResetReport}
                className="text-blue-600 hover:underline font-bold"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-auto max-h-[520px] border border-slate-300 rounded-lg shadow-sm">
              <table className="w-full text-xs text-left border-separate border-spacing-0 border-t border-l border-slate-300 bg-white">
                <thead className="sticky top-0 z-30 shadow-md">
                  <tr className="sticky top-0 z-40 bg-[#134674]" style={{ height: '46px' }}>
                    <th
                      colSpan={parsedDetailedReport.header.length || 1}
                      className="sticky top-0 left-0 z-40 bg-[#134674] text-white px-4 py-2.5 border-b-2 border-r border-[#0e3253] text-center select-none shadow-sm"
                      style={{ backgroundColor: '#134674', height: '46px' }}
                    >
                      <div className="w-full flex items-center justify-center text-center">
                        <span className="text-sm md:text-base font-black text-white tracking-wide">
                          {parsedDetailedReport.reportTitle}
                        </span>
                      </div>
                    </th>
                  </tr>

                  <tr className="sticky top-[46px] z-30 bg-[#164875]" style={{ height: '38px' }}>
                    {parsedDetailedReport.header.map((colName: any, idx: number) => (
                      <th
                        key={idx}
                        className="sticky top-[46px] z-30 bg-[#164875] py-2.5 px-3 border-b border-r border-slate-400/50 whitespace-nowrap font-bold text-white text-center shadow-xs text-[11px]"
                        style={{ backgroundColor: '#164875' }}
                      >
                        {String(colName || '')}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {paginatedDetailedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={parsedDetailedReport.header.length || 1}
                        className="py-8 text-center text-slate-400 border-r border-b border-slate-200"
                      >
                        No matching records found for "{reportSearch}".
                      </td>
                    </tr>
                  ) : (
                    paginatedDetailedRows.map((row, rIdx) => {
                      const rowBg = rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                      return (
                        <tr key={rIdx} className={`${rowBg} hover:bg-blue-50/60 transition-colors`}>
                          {parsedDetailedReport.header.map((colName: any, cIdx: number) => {
                            const val = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '';
                            const lowerVal = val.toLowerCase();
                            const isPendingTah = lowerVal.includes('pending at tahsildar') || lowerVal.includes('field enquiry');
                            const isPendingRdo = lowerVal.includes('pending at rdo');
                            const isRejected = lowerVal.includes('reject') || lowerVal.includes('dismiss') || lowerVal.includes('disapprov');
                            const isCompleted = lowerVal.includes('approved') || lowerVal.includes('regulariz') || lowerVal.includes('completed') || lowerVal.includes('orders issued') || lowerVal.includes('13-b');

                            let cellBgClass = '';
                            let textClass = 'text-slate-800';

                            if (isRejected) {
                              cellBgClass = 'bg-rose-50 font-bold text-rose-800';
                            } else if (isCompleted) {
                              cellBgClass = 'bg-emerald-50 font-bold text-emerald-800';
                            } else if (isPendingTah) {
                              cellBgClass = 'bg-[#ffffc8]/90 font-bold text-amber-900';
                            } else if (isPendingRdo) {
                              cellBgClass = 'bg-[#ffedd5]/90 font-bold text-orange-950';
                            }

                            return (
                              <td
                                key={cIdx}
                                className={`py-2 px-3 border-r border-b border-slate-200 whitespace-nowrap text-center text-[11px] font-medium ${cellBgClass || textClass}`}
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

            {/* Pagination Controls Bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="text-slate-600 font-semibold">
                Showing{' '}
                <strong className="text-slate-900">
                  {((currentPage - 1) * rowsPerPage + 1).toLocaleString('en-IN')}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900">
                  {Math.min(currentPage * rowsPerPage, filteredDetailedDataRows.length).toLocaleString('en-IN')}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900">
                  {filteredDetailedDataRows.length.toLocaleString('en-IN')}
                </strong>{' '}
                records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-slate-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded border border-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-slate-700"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
          </>
        )}

        <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 flex flex-wrap justify-between items-center text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400 inline-block"></span>
              <span>Approved</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-400 inline-block"></span>
              <span>Rejected</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3.5 h-3.5 rounded bg-[#ffffc8] border border-amber-300 inline-block"></span>
              <span>Pending at Tahsildar</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-3.5 h-3.5 rounded bg-[#ffedd5] border border-orange-300 inline-block"></span>
              <span>Pending at RDO</span>
            </span>
          </div>
          <span className="font-semibold text-slate-500">
            Huzurnagar Revenue Division • Official Detailed Records
          </span>
        </div>
      </div>
    </div>
  );
};