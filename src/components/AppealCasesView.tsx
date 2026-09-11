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
  appealCases,
  currentUser,
  onSaveCase,
  onUpdateCase,
  onDeleteCase,
  onViewFinalOrder,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';
  const canEditAndPrint = !isViewer;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMandal, setSelectedMandal] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<AppealCase | null>(null);
  const [caseForOrderUpload, setCaseForOrderUpload] = useState<AppealCase | null>(null);
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<AppealCase | null>(null);

  // Quick Hearing & Notice Entry inside Detail View
  const [isAddingHearingToCase, setIsAddingHearingToCase] = useState(false);
  const [quickNoticeDate, setQuickNoticeDate] = useState('');
  const [quickNextHearingDate, setQuickNextHearingDate] = useState('');
  const [quickHearingPurpose, setQuickHearingPurpose] = useState('FOR APPEARANCE & COUNTER');
  const [quickProceedings, setQuickProceedings] = useState('');
  const [stageFileBase64, setStageFileBase64] = useState('');
  const [stageFileName, setStageFileName] = useState('');
  const stageFileInputRef = useRef<HTMLInputElement>(null);
  const existingStageFileInputRef = useRef<HTMLInputElement>(null);
  const [targetStageIdForUpload, setTargetStageIdForUpload] = useState<string | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = appealCases.length;
    const finalOrders = appealCases.filter((c) =>
      c.status.toLowerCase().includes('final order') || Boolean(c.finalOrderNo)
    ).length;
    const allowed = appealCases.filter((c) =>
      c.status.toLowerCase().includes('allowed')
    ).length;
    const dismissed = appealCases.filter((c) =>
      c.status.toLowerCase().includes('dismissed')
    ).length;
    const remanded = appealCases.filter((c) =>
      c.status.toLowerCase().includes('remanded')
    ).length;
    const pending = appealCases.filter(
      (c) =>
        c.status.toLowerCase().includes('hearing') ||
        c.status.toLowerCase().includes('stay') ||
        c.status.toLowerCase().includes('reserved')
    ).length;

    return { total, finalOrders, allowed, dismissed, remanded, pending };
  }, [appealCases]);

  // Filtered list
  const filteredCases = useMemo(() => {
    return appealCases.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.caseNo.toLowerCase().includes(q) ||
        (c.registrationNo && c.registrationNo.toLowerCase().includes(q)) ||
        (c.bhuBharatiActSection && c.bhuBharatiActSection.toLowerCase().includes(q)) ||
        c.appealType.toLowerCase().includes(q) ||
        c.appellantName.toLowerCase().includes(q) ||
        c.respondentName.toLowerCase().includes(q) ||
        (c.appellantAdvocate && c.appellantAdvocate.toLowerCase().includes(q)) ||
        (c.respondentAdvocate && c.respondentAdvocate.toLowerCase().includes(q)) ||
        c.village.toLowerCase().includes(q) ||
        c.mandal.toLowerCase().includes(q) ||
        (c.surveyNo && c.surveyNo.toLowerCase().includes(q)) ||
        (c.finalOrderNo && c.finalOrderNo.toLowerCase().includes(q)) ||
        (c.finalOrderSummary && c.finalOrderSummary.toLowerCase().includes(q));

      const matchMandal = selectedMandal === 'ALL' || c.mandal === selectedMandal;
      const matchType =
        selectedTypeFilter === 'ALL' ||
        c.appealType === selectedTypeFilter ||
        (selectedTypeFilter === 'Other Revenue Appeal' &&
          (c.appealType === 'Other Revenue Appeal' ||
            c.appealType.startsWith('Other') ||
            !APPEAL_TYPES.includes(c.appealType as any)));

      let matchStatus = true;
      if (selectedStatusFilter === 'FINAL_ORDERS') {
        matchStatus = c.status.toLowerCase().includes('final order') || Boolean(c.finalOrderNo);
      } else if (selectedStatusFilter === 'ALLOWED') {
        matchStatus = c.status.toLowerCase().includes('allowed');
      } else if (selectedStatusFilter === 'DISMISSED_REMANDED') {
        matchStatus =
          c.status.toLowerCase().includes('dismissed') ||
          c.status.toLowerCase().includes('remanded');
      } else if (selectedStatusFilter === 'PENDING_STAY') {
        matchStatus =
          c.status.toLowerCase().includes('hearing') ||
          c.status.toLowerCase().includes('stay') ||
          c.status.toLowerCase().includes('reserved');
      }

      return matchSearch && matchMandal && matchType && matchStatus;
    });
  }, [appealCases, searchTerm, selectedMandal, selectedTypeFilter, selectedStatusFilter]);

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

        // Find header row
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
          const appellantAdv = getVal(['appellant advocate', 'app adv', 'petitioner counsel', 'appellant counsel']);
          const respondent = getVal(['respondent']) || 'Tahsildar & Others';
          const respondentAdv = getVal(['respondent advocate', 'resp adv', 'gp', 'respondent counsel']);
          const mandal = getVal(['mandal']) || 'HUZURNAGAR';
          const village = getVal(['village']) || 'Huzur Nagar';
          const surveyNo = getVal(['survey', 'sy']);
          const extent = getVal(['extent', 'ac']);
          const bhuBharatiActSection =
            getVal(['section', 'provision', 'bhu bharati', 'act section']) ||
            'Section 15(1) read with Rule 14 (Statutory RoR Appeal)';
          const appealType =
            getVal(['type', 'act', 'appeal type']) ||
            'Bhu Bharati Appeal (Sec 15(1) r/w Rule 14)';
          const impugnedOrderNo = getVal(['impugned', 'lower order', 'tahsildar order', 'procgs no']);
          const impugnedOrderDate = getVal(['impugned date', 'tahsildar date', 'lower date']);
          const status = getVal(['status', 'result']) || 'Under Hearing';
          const stagePurpose = getVal(['stage', 'purpose', 'listed for']) || 'SUMMONS & NOTICE ISSUED';
          const nextHearingDate = getVal(['next hearing', 'hearing date', 'next date']);
          const finalOrderNo = getVal(['order no', 'final procgs', 'final order']);
          const finalOrderDate = getVal(['final order date', 'disposal date']);
          const finalOrderSummary = getVal(['summary', 'gist', 'order copy', 'judgment', 'operative']);
          const remarks = getVal(['remarks', 'notes']);

          const curDateStr = new Date().toISOString().split('T')[0];
          const rawFilingDate = getVal(['filing date', 'filed on', 'institution date', 'filing']);
          const safeFilingDate = (rawFilingDate && rawFilingDate <= curDateStr) ? rawFilingDate : curDateStr;
          const noticeDate = getVal(['notice date', 'notice issued', 'summons date']);
          const regNo = getVal(['registration no', 'reg no', 'institution no']) || caseNo.replace(/[^0-9/]/g, '') || `${100 + idx}/2026`;
          const regDate = getVal(['registration date', 'reg date']) || safeFilingDate;
          const cnr = getVal(['cnr', 'cnr number']) || `TSHZNR04000${1000 + idx}2026`;

          newCases.push({
            id: Date.now() + idx + Math.floor(Math.random() * 1000),
            caseNo,
            registrationNo: regNo,
            registrationDate: regDate,
            cnrNumber: cnr,
            bhuBharatiActSection,
            appealType,
            mandal,
            village,
            surveyNo,
            extent,
            appellantName: appellant,
            appellantAdvocate: appellantAdv,
            respondentName: respondent,
            respondentAdvocate: respondentAdv,
            impugnedOrderNo,
            impugnedOrderDate,
            stagePurpose,
            nextHearingDate: nextHearingDate || (status.includes('Final Order') ? 'Disposed' : curDateStr),
            filingDate: safeFilingDate,
            noticeIssuedDate: noticeDate,
            noticeServedDate: '',
            firstHearingDate: nextHearingDate || safeFilingDate,
            hearingDate: nextHearingDate || curDateStr,
            status,
            finalOrderNo,
            finalOrderDate,
            finalOrderSummary,
            hasFinalOrderAttachment: Boolean(finalOrderNo || finalOrderSummary),
            remarks,
            caseHistory: [
              {
                id: `CH-${Date.now()}-${idx}`,
                judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
                businessDate: safeFilingDate,
                hearingDate: nextHearingDate || safeFilingDate,
                purpose: stagePurpose,
                proceedings: noticeDate ? `Statutory notice issued on ${noticeDate}.` : 'Notice issued to respondents.'
              }
            ]
          });
        });

        if (newCases.length > 0) {
          newCases.forEach((nc) => onSaveCase(nc));
          onShowToast(`Successfully imported ${newCases.length} Appeal Cases from Excel!`);
        } else {
          onShowToast('Could not parse valid appeal cases from file.');
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        onShowToast('Failed to parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  // Export to CSV with full Bhu Bharati Act details
  const handleExportCSV = () => {
    if (appealCases.length === 0) return;
    let csv =
      'Sl No,Case No,Bhu Bharati Act Section,Appeal Type,Mandal,Village,Survey No,Extent,Appellant,Appellant Advocate,Respondent,Respondent Advocate,Impugned Tahsildar Order,Impugned Order Date,Filing Date,Hearing Date,Next Hearing Date,Listed Stage,Status,Final Order No,Final Order Date,Operative Order Gist / Tahsildar Directives,Remarks\n';
    filteredCases.forEach((c, idx) => {
      const clean = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      csv += `${idx + 1},${clean(c.caseNo)},${clean(c.bhuBharatiActSection || 'Sec 15(1) r/w Rule 14')},${clean(c.appealType)},${clean(c.mandal)},${clean(c.village)},${clean(c.surveyNo)},${clean(c.extent)},${clean(c.appellantName)},${clean(c.appellantAdvocate)},${clean(c.respondentName)},${clean(c.respondentAdvocate)},${clean(c.impugnedOrderNo)},${clean(c.impugnedOrderDate)},${clean(c.filingDate)},${clean(c.hearingDate)},${clean(c.nextHearingDate)},${clean(c.stagePurpose)},${clean(c.status)},${clean(c.finalOrderNo)},${clean(c.finalOrderDate)},${clean(c.finalOrderSummary)},${clean(c.remarks)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RDO_Huzurnagar_Bhu_Bharati_Appeal_Cases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Appeal Cases CSV exported with complete Bhu Bharati details.');
  };

  // =========================================================================
  // PRINT 1: COMPLETE APPELLATE REGISTER (ALL CASES IN DATABASE - 100% COMPLETE)
  // =========================================================================
  const handlePrintAllCasesRegister = (useAllDatabaseCases = true) => {
    const listToPrint = useAllDatabaseCases ? appealCases : filteredCases;
    if (listToPrint.length === 0) {
      onShowToast('No cases to print.');
      return;
    }

    const ths = `
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 3.5%; word-break: break-word; font-size: 9pt; font-weight: 900;">Sl</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 12%; word-break: break-word; font-size: 9pt; font-weight: 900;">Case No &amp; Statutory Section<br/><span style="font-size: 8pt; font-weight: bold; color: #93c5fd;">Bhu Bharati Act 2025</span></th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 10%; word-break: break-word; font-size: 9pt; font-weight: 900;">Village &amp; Mandal</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; word-break: break-word; font-size: 9pt; font-weight: 900;">Sy.No / Extent</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 13%; word-break: break-word; font-size: 9pt; font-weight: 900;">Appellant &amp; Counsel</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 13%; word-break: break-word; font-size: 9pt; font-weight: 900;">Respondent &amp; Counsel</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8.5%; word-break: break-word; font-size: 9pt; font-weight: 900;">Impugned Order<br/><span style="font-size: 8pt; font-weight: bold; color: #cbd5e1;">Tahsildar Ref</span></th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; word-break: break-word; font-size: 9pt; font-weight: 900;">Filing &amp; Hearing Dt</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 7%; word-break: break-word; font-size: 9pt; font-weight: 900;">Status</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; word-break: break-word; font-size: 9pt; font-weight: 900;">Final Order / Dt</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 9%; word-break: break-word; font-size: 9pt; font-weight: 900;">Operative Order / Directives</th>
    `;

    const trs = listToPrint
      .map((c, idx) => {
        const isAllowed = c.status.toLowerCase().includes('allowed');
        const isDismissed = c.status.toLowerCase().includes('dismissed');
        const isRemanded = c.status.toLowerCase().includes('remanded');
        const statusBg = isAllowed
          ? 'background-color: #d1fae5; color: #065f46; font-weight: 900; border: 1px solid #6ee7b7;'
          : isDismissed
          ? 'background-color: #fee2e2; color: #991b1b; font-weight: 900; border: 1px solid #fca5a5;'
          : isRemanded
          ? 'background-color: #f3e8ff; color: #6b21a8; font-weight: 900; border: 1px solid #d8b4fe;'
          : 'background-color: #e0f2fe; color: #0369a1; font-weight: 900; border: 1px solid #7dd3fc;';

        return `
          <tr style="page-break-inside: avoid;">
            <td style="padding: 5px 3px; text-align: center; border: 1.2px solid #334155; font-weight: 900; font-size: 9pt; color: #000000; vertical-align: top; word-break: break-word;">${idx + 1}</td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; vertical-align: top; word-break: break-word;">
              <div style="font-weight: 900; color: #0f3b63; font-size: 9.5pt;">${c.caseNo}</div>
              <div style="font-size: 8.5pt; color: #1e3a8a; font-weight: 700; margin-top: 2px;">
                ${c.bhuBharatiActSection || c.appealType}
              </div>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; vertical-align: top; word-break: break-word;">
              <b style="color: #000000; font-size: 9pt;">${c.village}</b><br/>
              <span style="font-size: 8.5pt; color: #1e293b; font-weight: 600;">${c.mandal} Mandal</span>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; vertical-align: top; word-break: break-word;">
              <span style="font-weight: 900; color: #000000; font-size: 9pt;">${c.surveyNo || '-'}</span><br/>
              <span style="font-size: 8.5pt; color: #1e293b; font-weight: 600;">${c.extent || '-'}</span>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 9pt; vertical-align: top; word-break: break-word;">
              <b style="color: #000000;">${c.appellantName}</b>
              ${c.appellantAdvocate ? `<div style="font-size: 8.5pt; color: #1e3a8a; font-weight: 700; margin-top: 2px;">Adv: ${c.appellantAdvocate}</div>` : ''}
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 9pt; vertical-align: top; word-break: break-word;">
              <b style="color: #000000;">${c.respondentName}</b>
              ${c.respondentAdvocate ? `<div style="font-size: 8.5pt; color: #475569; font-weight: 700; margin-top: 2px;">Adv: ${c.respondentAdvocate}</div>` : ''}
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 8.5pt; vertical-align: top; word-break: break-word;">
              <b style="color: #000000;">${c.impugnedOrderNo || 'Tah. File'}</b><br/>
              <span style="color: #1e293b; font-weight: 600;">Dt: ${c.impugnedOrderDate || c.filingDate || '-'}</span>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 8.5pt; vertical-align: top; word-break: break-word;">
              <span style="color: #1e293b; font-weight: 600;">F: ${c.filingDate}</span><br/>
              <b style="color: #b91c1c; font-size: 9pt;">H: ${c.hearingDate || '-'}</b>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 8.5pt; vertical-align: top; word-break: break-word;">
              <span style="${statusBg} padding: 2px 4px; border-radius: 3px; display: inline-block;">${c.status}</span>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 8.5pt; vertical-align: top; word-break: break-word;">
              <b style="color: #065f46; font-size: 9pt;">${c.finalOrderNo || '-'}</b><br/>
              <span style="color: #1e293b; font-weight: 600;">${c.finalOrderDate || '-'}</span>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 8.5pt; color: #000000; line-height: 1.35; vertical-align: top; word-break: break-word;">
              ${c.finalOrderSummary || '<span style="color: #64748b; font-style: italic;">Proceedings under progress before the Revenue Court</span>'}
            </td>
          </tr>
        `;
      })
      .join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; line-height: 1.32;">
        <thead>
          <tr>${ths}</tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Complete Appellate Cases Register',
      subtitle: 'Court of the Revenue Divisional Officer & Sub-Divisional Magistrate, Huzurnagar',
      period: `Total Registered Appeals: ${listToPrint.length} Cases | As on: ${new Date().toLocaleDateString('en-IN')}`,
      landscape: true,
      fileName: 'RDO_Huzurnagar_Complete_Appellate_Register',
    });
  };

  // =========================================================================
  // PRINT 2: AUTHENTIC DAILY BENCH CAUSE LIST (CAUSE LIST)
  // =========================================================================
  const handlePrintDailyCauseList = () => {
    // Cause list uses all cases or filtered list
    const causeListCases = filteredCases.length > 0 ? filteredCases : appealCases;
    const todayStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const ths = `
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 4%; word-break: break-word; font-size: 9pt; font-weight: 900;">Item No</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 12%; word-break: break-word; font-size: 9pt; font-weight: 900;">Case No &amp; Statutory Provision<br/><span style="font-size: 8pt; font-weight: bold; color: #93c5fd;">Bhu Bharati Act 2025</span></th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 10%; word-break: break-word; font-size: 9pt; font-weight: 900;">Village &amp; Mandal</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; word-break: break-word; font-size: 9pt; font-weight: 900;">Sy.No / Extent</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 14%; word-break: break-word; font-size: 9pt; font-weight: 900;">Appellant(s) &amp; Advocate</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 14%; word-break: break-word; font-size: 9pt; font-weight: 900;">Respondent(s) &amp; Advocate</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 9%; word-break: break-word; font-size: 9pt; font-weight: 900;">Lower Order Ref</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 9%; word-break: break-word; font-size: 9pt; font-weight: 900;">Purpose / Stage</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: center; width: 8%; word-break: break-word; font-size: 9pt; font-weight: 900;">Status / Result</th>
      <th style="background-color: #0c2a47; color: #ffffff; padding: 6px 4px; border: 1.2px solid #334155; text-align: left; width: 12%; word-break: break-word; font-size: 9pt; font-weight: 900;">Daily Proceedings / Directives</th>
    `;

    const trs = causeListCases
      .map((c, idx) => {
        const isAllowed = c.status.toLowerCase().includes('allowed');
        const isDismissed = c.status.toLowerCase().includes('dismissed');
        const isRemanded = c.status.toLowerCase().includes('remanded');
        const statusBg = isAllowed
          ? 'background-color: #d1fae5; color: #065f46; font-weight: 900; border: 1px solid #6ee7b7;'
          : isDismissed
          ? 'background-color: #fee2e2; color: #991b1b; font-weight: 900; border: 1px solid #fca5a5;'
          : isRemanded
          ? 'background-color: #f3e8ff; color: #6b21a8; font-weight: 900; border: 1px solid #d8b4fe;'
          : 'background-color: #e0f2fe; color: #0369a1; font-weight: 900; border: 1px solid #7dd3fc;';

        return `
          <tr style="page-break-inside: avoid;">
            <td style="padding: 5px 3px; text-align: center; border: 1.2px solid #334155; font-weight: 900; font-size: 9.5pt; color: #000000; vertical-align: top; word-break: break-word;">${idx + 1}</td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; vertical-align: top; word-break: break-word;">
              <b style="color: #0f3b63; font-size: 9.5pt; font-weight: 900;">${c.caseNo}</b><br/>
              <span style="font-size: 8.5pt; color: #1e3a8a; font-weight: 700;">${c.bhuBharatiActSection || c.appealType}</span>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; vertical-align: top; word-break: break-word;">
              <b style="color: #000000; font-size: 9pt;">${c.village}</b><br/>
              <span style="font-size: 8.5pt; color: #1e293b; font-weight: 600;">${c.mandal} Mandal</span>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; vertical-align: top; word-break: break-word;">
              <b style="font-size: 9pt; font-weight: 900; color: #000000;">${c.surveyNo || '-'}</b><br/>
              <span style="font-size: 8.5pt; color: #1e293b; font-weight: 600;">${c.extent || '-'}</span>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 9pt; vertical-align: top; word-break: break-word;">
              <b style="color: #000000;">${c.appellantName}</b>
              <div style="font-size: 8.5pt; color: #1e3a8a; font-weight: 700; margin-top: 2px;">
                Adv: ${c.appellantAdvocate || 'Party in Person'}
              </div>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 9pt; vertical-align: top; word-break: break-word;">
              <b style="color: #000000;">${c.respondentName}</b>
              <div style="font-size: 8.5pt; color: #475569; font-weight: 700; margin-top: 2px;">
                Adv: ${c.respondentAdvocate || 'GP for Revenue'}
              </div>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 8.5pt; vertical-align: top; word-break: break-word;">
              <b style="color: #000000;">${c.impugnedOrderNo || 'Tahsildar File'}</b><br/>
              <span style="color: #1e293b; font-weight: 600;">Dt: ${c.impugnedOrderDate || c.filingDate || '-'}</span>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 9pt; font-weight: 900; color: #000000; vertical-align: top; word-break: break-word;">
              ${c.stagePurpose || 'For Hearing'}
              <div style="font-size: 8.5pt; font-weight: 800; color: #b91c1c; margin-top: 2px;">
                Hearing: ${c.hearingDate || c.nextHearingDate || '-'}
              </div>
            </td>
            <td style="padding: 5px 4px; text-align: center; border: 1.2px solid #334155; font-size: 8.5pt; vertical-align: top; word-break: break-word;">
              <span style="${statusBg} padding: 2px 4px; border-radius: 3px; display: inline-block;">${c.status}</span>
            </td>
            <td style="padding: 5px 4px; border: 1.2px solid #334155; font-size: 8.5pt; color: #000000; line-height: 1.35; vertical-align: top; word-break: break-word;">
              ${
                c.finalOrderSummary
                  ? `<b style="color: #065f46;">${c.finalOrderNo || 'Order Pronounced'}:</b> ${c.finalOrderSummary}`
                  : `<span style="color: #334155; font-weight: 500;">Hearing scheduled. Counter / Arguments called. Directives to Tahsildar to submit original records.</span>`
              }
            </td>
          </tr>
        `;
      })
      .join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; line-height: 1.32;">
        <thead>
          <tr>${ths}</tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Daily Bench Cause List',
      subtitle: 'Court of the Revenue Divisional Officer & Sub-Divisional Magistrate, Huzurnagar',
      period: `Cause List: ${todayStr} | Total Listed: ${causeListCases.length} Cases`,
      landscape: true,
      fileName: 'RDO_Huzurnagar_Daily_Cause_List',
    });
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('allowed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Allowed</span>
        </span>
      );
    }
    if (s.includes('dismissed')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Dismissed</span>
        </span>
      );
    }
    if (s.includes('remanded')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
          <RotateCcw className="w-3 h-3 text-purple-600" />
          <span>Remanded</span>
        </span>
      );
    }
    if (s.includes('stay')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>Stay in Force</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
        <Clock className="w-3 h-3 text-blue-600" />
        <span>Under Hearing</span>
      </span>
    );
  };

  // Quick Add Hearing & Notice to Selected Case
  const handleStageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('Stage document exceeds 8MB limit.');
      e.target.value = '';
      return;
    }
    setStageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setStageFileBase64(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocToExistingStage = (stageId: string) => {
    setTargetStageIdForUpload(stageId);
    if (existingStageFileInputRef.current) {
      existingStageFileInputRef.current.value = '';
      existingStageFileInputRef.current.click();
    }
  };

  const handleExistingStageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCaseForDetail || !targetStageIdForUpload) return;
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('File size exceeds 8MB.');
      e.target.value = '';
      return;
    }
    const docName = file.name;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      const history = selectedCaseForDetail.caseHistory || [];
      const updatedHistory = history.map((entry) => {
        if (entry.id === targetStageIdForUpload) {
          return {
            ...entry,
            documentFile: base64,
            documentName: docName,
            uploadedAt: new Date().toISOString().split('T')[0],
          };
        }
        return entry;
      });

      const updatedCase: AppealCase = {
        ...selectedCaseForDetail,
        caseHistory: updatedHistory,
      };

      await onUpdateCase(updatedCase);
      setSelectedCaseForDetail(updatedCase);
      setTargetStageIdForUpload(null);
      onShowToast(`Stage document "${docName}" attached successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleViewOrDownloadStageDoc = (entry: CaseHistoryEntry) => {
    if (!entry.documentFile) {
      onShowToast('No document attached for this stage.');
      return;
    }
    try {
      const isPdf = entry.documentFile.includes('application/pdf');
      const win = window.open();
      if (win) {
        win.document.write(
          `<title>${entry.documentName || 'Stage Document'}</title><iframe src="${entry.documentFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100vh;" allowfullscreen></iframe>`
        );
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    const link = document.createElement('a');
    link.href = entry.documentFile;
    link.download = entry.documentName || `Stage_Document_${entry.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickAddHearing = async () => {
    if (!selectedCaseForDetail) return;
    if (!quickNextHearingDate) {
      onShowToast('Please provide Next Hearing Date.');
      return;
    }

    const curToday = new Date().toISOString().split('T')[0];
    if (quickNoticeDate && quickNoticeDate > curToday) {
      onShowToast('Notice Issued Date cannot be in the future.');
      return;
    }

    const newHistoryEntry: CaseHistoryEntry = {
      id: `CH-${Date.now()}`,
      judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
      businessDate: curToday,
      hearingDate: quickNextHearingDate,
      purpose: quickHearingPurpose,
      proceedings: quickProceedings.trim() || (quickNoticeDate ? `Notice issued on ${quickNoticeDate}. Posted for ${quickHearingPurpose}.` : `${quickHearingPurpose} recorded on bench.`),
      documentFile: stageFileBase64 || undefined,
      documentName: stageFileName || undefined,
      uploadedAt: stageFileBase64 ? curToday : undefined,
    };

    const existingHistory = selectedCaseForDetail.caseHistory || [];
    const updatedHistory = [...existingHistory, newHistoryEntry];

    const updatedCase: AppealCase = {
      ...selectedCaseForDetail,
      noticeIssuedDate: quickNoticeDate || selectedCaseForDetail.noticeIssuedDate,
      hearingDate: quickNextHearingDate,
      nextHearingDate: quickNextHearingDate,
      stagePurpose: quickHearingPurpose,
      caseHistory: updatedHistory
    };

    await onUpdateCase(updatedCase);
    setSelectedCaseForDetail(updatedCase);
    setIsAddingHearingToCase(false);
    setQuickProceedings('');
    setStageFileBase64('');
    setStageFileName('');
    if (stageFileInputRef.current) stageFileInputRef.current.value = '';
    onShowToast('Case hearing schedule, stage details & document saved successfully!');
  };

  // Official Court Case Details & Hearing History Print Slip (Image 1 & 2 format)
  const handlePrintSingleCaseSlip = (c: AppealCase) => {
    const curDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const sanitizeEng = (str?: string) => {
      if (!str) return '';
      return str
        .replace(/\s*\([\u0C00-\u0C7F\s\/&,.-]+\)/g, '')
        .replace(/[\u0C00-\u0C7F]/g, '')
        .trim();
    };

    const cleanStage = sanitizeEng(c.stagePurpose) || 'FOR HEARING & ARGUMENTS';
    const cleanStatus = sanitizeEng(c.status) || 'Under Inquiry / Active';
    const cleanType = sanitizeEng(c.appealType);
    const cleanOrderSummary = sanitizeEng(c.finalOrderSummary);

    const historyRows: CaseHistoryEntry[] = (c.caseHistory && c.caseHistory.length > 0)
      ? c.caseHistory.map(h => ({
          ...h,
          purpose: sanitizeEng(h.purpose),
          proceedings: sanitizeEng(h.proceedings),
        }))
      : [
          {
            id: '1',
            judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
            businessDate: c.filingDate,
            hearingDate: c.firstHearingDate || c.hearingDate || c.filingDate,
            purpose: c.noticeIssuedDate ? 'SUMMONS & NOTICE ISSUED' : 'CASE ADMISSION & NOTICE',
            proceedings: c.noticeIssuedDate ? `Statutory notice issued to respondents on ${c.noticeIssuedDate}.` : 'Notice issued to respondents.'
          },
          ...(c.nextHearingDate && !c.nextHearingDate.toLowerCase().includes('disposed') ? [{
            id: '2',
            judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
            businessDate: c.hearingDate || c.filingDate,
            hearingDate: c.nextHearingDate,
            purpose: cleanStage,
            proceedings: `Next hearing posted on ${c.nextHearingDate} for ${cleanStage}.`
          }] : []),
          ...(c.status.includes('Final Order') && c.finalOrderDate ? [{
            id: '3',
            judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
            businessDate: c.finalOrderDate,
            hearingDate: c.finalOrderDate,
            purpose: 'FINAL ORDER PRONOUNCED / DISPOSED',
            proceedings: `Final order issued. Procgs No: ${c.finalOrderNo || '-'}. Result: ${cleanStatus}.`
          }] : [])
        ];

    const slipHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 11.5px; line-height: 1.45; color: #0f172a; width: 100%;">
        <!-- Sub-Banner Ribbon -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0f3b63; padding: 5px 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-radius: 3px;">
          <span style="font-size: 11px; font-weight: 800; color: #0f3b63; text-transform: uppercase; letter-spacing: 0.4px;">
            e-Courts Case Status &amp; Daily Hearing Record
          </span>
          <span style="font-size: 10.5px; font-weight: 700; color: #334155;">
            Court of RDO &amp; SDM Huzurnagar • Case: <span style="color: #0f3b63; font-weight: 900;">${c.caseNo}</span>
          </span>
        </div>

        <!-- Case Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid #64748b; font-size: 11px;">
          <tr style="background: #f1f5f9;">
            <th style="padding: 5px 8px; border: 1px solid #94a3b8; width: 22%; text-align: left; font-weight: 800; color: #1e293b;">Case Type</th>
            <td colspan="3" style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 800; color: #0c2a47; font-size: 11.5px;">${cleanType}</td>
          </tr>
          <tr>
            <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left; font-weight: 800; color: #1e293b;">Filing Number</th>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 900; color: #1e40af; font-size: 11.5px;">${c.caseNo}</td>
            <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left; font-weight: 800; color: #1e293b;">Filing Date</th>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 700; color: #0f172a;">${c.filingDate}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left; font-weight: 800; color: #1e293b;">Registration Number</th>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 700;">${c.registrationNo || c.caseNo.replace(/[^0-9/]/g, '') || '-'}</td>
            <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left; font-weight: 800; color: #1e293b;">Registration Date</th>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 700;">${c.registrationDate || c.filingDate}</td>
          </tr>
          <tr>
            <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left; font-weight: 800; color: #1e293b;">CNR Number</th>
            <td colspan="3" style="padding: 5px 8px; border: 1px solid #94a3b8; font-family: monospace; font-weight: 900; color: #065f46; font-size: 11.5px; letter-spacing: 0.5px;">
              <span style="background: #ecfdf5; padding: 1px 6px; border-radius: 3px; border: 1px solid #a7f3d0;">
                ${c.cnrNumber || 'TSHZNR04000' + String(c.id).slice(-4) + '2026'}
              </span>
            </td>
          </tr>
        </table>

        <!-- Case Status & Notice Tracking Box -->
        <div style="border: 1.5px solid #d97706; background: #fffbeb; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
          <div style="margin: 0 0 5px 0; color: #92400e; font-size: 11px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #fde68a; padding-bottom: 3px; letter-spacing: 0.3px;">
            Case Status &amp; Notice Tracking
          </div>
          <table style="width: 100%; font-size: 11px; border: none; margin-bottom: 0 !important;">
            <tr>
              <td style="width: 22%; font-weight: 700; color: #78350f; border: none; padding: 2px 4px;">First Hearing Date:</td>
              <td style="width: 28%; font-weight: 800; color: #0f172a; border: none; padding: 2px 4px;">${c.firstHearingDate || c.filingDate}</td>
              <td style="width: 22%; font-weight: 700; color: #78350f; border: none; padding: 2px 4px;">Next Hearing Date:</td>
              <td style="width: 28%; font-weight: 900; color: #b91c1c; font-size: 12px; border: none; padding: 2px 4px;">${c.nextHearingDate || (cleanStatus.includes('Final Order') ? 'Disposed' : '-')}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: #78350f; border: none; padding: 2px 4px;">Case Stage / Purpose:</td>
              <td style="font-weight: 800; color: #1e40af; border: none; padding: 2px 4px;">${cleanStage || cleanStatus}</td>
              <td style="font-weight: 700; color: #78350f; border: none; padding: 2px 4px;">Notice Status:</td>
              <td style="font-weight: 700; border: none; padding: 2px 4px;">${c.noticeIssuedDate ? `Issued: ${c.noticeIssuedDate}` : 'Notice Issued'} ${c.noticeServedDate ? `(Served: ${c.noticeServedDate})` : ''}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: #78350f; border: none; padding: 2px 4px;">Presiding Court:</td>
              <td colspan="3" style="font-weight: 800; color: #0c2a47; border: none; padding: 2px 4px;">Court of the Revenue Divisional Officer &amp; SDM, Huzurnagar</td>
            </tr>
          </table>
        </div>

        <!-- Parties & Advocates -->
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <div style="flex: 1; border: 1.5px solid #93c5fd; background: #eff6ff; border-radius: 6px; padding: 8px 12px;">
            <div style="color: #1e40af; font-size: 11px; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.3px;">
              Petitioner / Appellant(s) &amp; Advocate:
            </div>
            <div style="font-weight: 900; color: #0f172a; font-size: 12px; margin-bottom: 2px;">
              1) ${c.appellantName}
            </div>
            <div style="font-size: 10.5px; color: #334155; font-weight: 600;">
              Advocate: <span style="font-weight: 700; color: #1e40af;">${c.appellantAdvocate || 'Party in Person'}</span>
            </div>
          </div>
          <div style="flex: 1; border: 1.5px solid #d8b4fe; background: #faf5ff; border-radius: 6px; padding: 8px 12px;">
            <div style="color: #6b21a8; font-size: 11px; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.3px;">
              Respondent(s) &amp; Advocate:
            </div>
            <div style="font-weight: 900; color: #0f172a; font-size: 12px; margin-bottom: 2px;">
              1) ${c.respondentName}
            </div>
            <div style="font-size: 10.5px; color: #334155; font-weight: 600;">
              Advocate: <span style="font-weight: 700; color: #6b21a8;">${c.respondentAdvocate || 'Government Pleader for Revenue'}</span>
            </div>
          </div>
        </div>

        <!-- Acts & Property Details -->
        <div style="border: 1.5px solid #94a3b8; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; background: #f8fafc; font-size: 11px; line-height: 1.5;">
          <div style="color: #0c2a47; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.3px;">
            Statutory Enactments &amp; Disputed Land Schedule:
          </div>
          <div>
            <strong>Under Act:</strong> Telangana Bhu Bharati (Record of Rights in Land) Act, 2025 (Act 1 of 2025) &nbsp;|&nbsp;
            <strong>Section:</strong> <span style="font-weight: 800; color: #1e40af;">${c.bhuBharatiActSection || 'Section 15(1) read with Rule 14'}</span>
          </div>
          <div style="margin-top: 2px;">
            <strong>Land Schedule:</strong> Sy. No: <span style="font-weight: 900; color: #0f172a;">${c.surveyNo || '-'}</span> &nbsp;|&nbsp; Extent: <span style="font-weight: 900; color: #0f172a;">${c.extent || '-'}</span> &nbsp;|&nbsp; Village: <span style="font-weight: 900; color: #0f172a;">${c.village}</span> &nbsp;|&nbsp; Mandal: <span style="font-weight: 900; color: #0f172a;">${c.mandal} Mandal</span>
          </div>
        </div>

        <!-- Case History Table -->
        <div style="margin: 0 0 5px 0; color: #0c2a47; font-size: 11.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px;">
          Case History &amp; Proceedings Timeline
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid #64748b; font-size: 10px;">
          <thead>
            <tr style="background: #0c2a47; color: white;">
              <th style="padding: 5px 6px; border: 1px solid #475569; text-align: left; width: 24%; font-weight: 800;">Judge / Presiding Officer</th>
              <th style="padding: 5px 6px; border: 1px solid #475569; text-align: center; width: 12%; font-weight: 800;">Business Date</th>
              <th style="padding: 5px 6px; border: 1px solid #475569; text-align: center; width: 12%; font-weight: 800;">Hearing Date</th>
              <th style="padding: 5px 6px; border: 1px solid #475569; text-align: left; width: 18%; font-weight: 800;">Stage / Purpose</th>
              <th style="padding: 5px 6px; border: 1px solid #475569; text-align: left; width: 19%; font-weight: 800;">Daily Proceedings</th>
              <th style="padding: 5px 6px; border: 1px solid #475569; text-align: center; width: 15%; font-weight: 800;">Stage Document</th>
            </tr>
          </thead>
          <tbody>
            ${historyRows.map((h, i) => `
              <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 5px 6px; border: 1px solid #cbd5e1; font-weight: 800; color: #1e293b;">${h.judgeOfficer || 'Revenue Divisional Officer & SDM, Huzurnagar'}</td>
                <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #1e40af;">${h.businessDate}</td>
                <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #b45309;">${h.hearingDate}</td>
                <td style="padding: 5px 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #334155;">${h.purpose}</td>
                <td style="padding: 5px 6px; border: 1px solid #cbd5e1; color: #0f172a; line-height: 1.3;">${h.proceedings || '-'}</td>
                <td style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 9px;">${h.documentFile ? `<span style="color: #047857; font-weight: bold;">✔ Attached (${h.documentName || 'PDF'})</span>` : `<span style="color: #94a3b8;">-</span>`}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Final Order or Active Hearing Directive Box -->
        ${c.finalOrderNo || cleanOrderSummary || cleanStatus.includes('Final Order') ? `
          <div style="border: 1.5px solid #059669; background: #ecfdf5; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
            <div style="margin: 0 0 4px 0; color: #065f46; font-size: 11.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px;">
              Final Order / Judgment Pronouncement
            </div>
            <div style="font-size: 11px; line-height: 1.45; color: #064e3b;">
              <strong>Procgs / Order No:</strong> <span style="font-weight: 900; color: #065f46;">${c.finalOrderNo || 'Pending Issue'}</span> &nbsp;|&nbsp; 
              <strong>Order Date:</strong> <span style="font-weight: 800;">${c.finalOrderDate || '-'}</span> &nbsp;|&nbsp; 
              <strong>Status:</strong> <span style="font-weight: 900; color: #047857;">${cleanStatus}</span>
            </div>
            ${cleanOrderSummary ? `
              <div style="margin-top: 5px; padding: 6px 10px; background: #ffffff; border: 1px solid #a7f3d0; border-radius: 4px; font-size: 11px; color: #064e3b; line-height: 1.45;">
                ${cleanOrderSummary}
              </div>
            ` : ''}
          </div>
        ` : `
          <div style="border: 1.5px solid #3b82f6; background: #eff6ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
            <div style="margin: 0 0 3px 0; color: #1e40af; font-size: 11px; font-weight: 900; text-transform: uppercase;">
              Active Case Directives &amp; Compliance Instructions
            </div>
            <div style="font-size: 10.5px; color: #1e3a8a; line-height: 1.4;">
              This appeal is currently under inquiry before the Sub-Divisional Magistrate Court. Both parties are instructed to appear with supporting revenue records, link documents, and pahanies on the scheduled hearing date.
            </div>
          </div>
        `}

        <!-- Verification & Statutory Extract Note -->
        <div style="border-top: 1px dashed #94a3b8; padding-top: 6px; margin-top: 8px; font-size: 10px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
          <span>
            <b>Official Extract:</b> Certified copy generated from e-Revenue Court Records Management System, Huzurnagar.
          </span>
          <span style="font-weight: bold; color: #0c2a47;">
            Division: Huzurnagar • Dist: Suryapet
          </span>
        </div>
      </div>
    `;

    printTableReport(slipHtml, {
      title: `Case Status Sheet - ${c.caseNo}`,
      subtitle: `Court of the Revenue Divisional Officer, Huzurnagar • Telangana Bhu Bharati Act, 2025`,
      period: `Case No: ${c.caseNo} | CNR: ${c.cnrNumber || '-'}`,
      landscape: false,
      fileName: `Case_Status_${c.caseNo.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* COURT HEADER BANNER (AUTHENTIC REVENUE COURT DESIGN) */}
      {/* ============================================================ */}
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
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/40 text-blue-100 rounded-md border border-blue-300/30">
                  Telangana Bhu Bharati Act, 2025
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  Huzurnagar Division • Suryapet District
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white mt-0.5">
                COURT OF THE REVENUE DIVISIONAL OFFICER &amp; SDM
              </h1>
              <p className="text-xs text-blue-100 font-medium">
                Appellate Court Register, Daily Cause List &amp; Final Judgment Tracker under Telangana Bhu Bharati Act, 2025 (Sec 15(1), Rule 14 &amp; Sec 6)
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15">
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

      {/* ============================================================ */}
      {/* SUMMARY STAT CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Appeals */}
        <div
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedStatusFilter === 'ALL'
              ? 'bg-gradient-to-br from-blue-50/90 via-white to-blue-100/40 border-2 border-blue-600 shadow-[0_12px_24px_-6px_rgba(37,99,235,0.3)] ring-2 ring-blue-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-blue-400 hover:shadow-[0_14px_28px_-6px_rgba(37,99,235,0.25)] hover:-translate-y-1.5'
          }`}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">Total Appeals</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-blue-950 group-hover:text-blue-600 group-hover:scale-105 origin-left transition-all duration-300">
            {stats.total}
          </div>
          <p className="relative z-10 text-[11px] text-blue-700 font-semibold mt-0.5 flex items-center gap-1">
            All registered cases →
          </p>
        </div>

        {/* Card 2: Final Orders Issued */}
        <div
          onClick={() => setSelectedStatusFilter('FINAL_ORDERS')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedStatusFilter === 'FINAL_ORDERS'
              ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/40 border-2 border-emerald-600 shadow-[0_12px_24px_-6px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.25)] hover:-translate-y-1.5'
          }`}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Final Orders Issued
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-emerald-700 group-hover:text-emerald-600 group-hover:scale-105 origin-left transition-all duration-300">
            {stats.finalOrders}
          </div>
          <p className="relative z-10 text-[11px] text-emerald-700 font-semibold mt-0.5">Disposed with Orders →</p>
        </div>

        {/* Card 3: Allowed (Relief) */}
        <div
          onClick={() => setSelectedStatusFilter('ALLOWED')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedStatusFilter === 'ALLOWED'
              ? 'bg-gradient-to-br from-teal-50/90 via-white to-teal-100/40 border-2 border-teal-600 shadow-[0_12px_24px_-6px_rgba(20,184,166,0.3)] ring-2 ring-teal-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(20,184,166,0.25)] hover:-translate-y-1.5'
          }`}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800">
              Allowed (Relief)
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
              <Gavel className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-teal-700 group-hover:text-teal-600 group-hover:scale-105 origin-left transition-all duration-300">
            {stats.allowed}
          </div>
          <p className="relative z-10 text-[11px] text-teal-700 font-semibold mt-0.5">Appeals Allowed →</p>
        </div>

        {/* Card 4: Dismissed / Remand */}
        <div
          onClick={() => setSelectedStatusFilter('DISMISSED_REMANDED')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            selectedStatusFilter === 'DISMISSED_REMANDED'
              ? 'bg-gradient-to-br from-rose-50/90 via-white to-rose-100/40 border-2 border-rose-600 shadow-[0_12px_24px_-6px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-rose-400 hover:shadow-[0_14px_28px_-6px_rgba(244,63,94,0.25)] hover:-translate-y-1.5'
          }`}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
              Dismissed / Remand
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-200">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-rose-700 group-hover:text-rose-600 group-hover:scale-105 origin-left transition-all duration-300">
            {stats.dismissed + stats.remanded}
          </div>
          <p className="relative z-10 text-[11px] text-rose-700 font-semibold mt-0.5">
            {stats.dismissed} Dismissed • {stats.remanded} Remanded →
          </p>
        </div>

        {/* Card 5: Under Hearing / Stay */}
        <div
          onClick={() => setSelectedStatusFilter('PENDING_STAY')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 col-span-2 sm:col-span-1 ${
            selectedStatusFilter === 'PENDING_STAY'
              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 border-2 border-amber-500 shadow-[0_12px_24px_-6px_rgba(217,119,6,0.3)] ring-2 ring-amber-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-amber-400 hover:shadow-[0_14px_28px_-6px_rgba(217,119,6,0.25)] hover:-translate-y-1.5'
          }`}
        >
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Under Hearing / Stay
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors duration-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-amber-700 group-hover:text-amber-600 group-hover:scale-105 origin-left transition-all duration-300">
            {stats.pending}
          </div>
          <p className="relative z-10 text-[11px] text-amber-700 font-semibold mt-0.5">Active hearing cases →</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONTROLS & ACTION BUTTONS */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Case No, Appellant, Village, Order No, Survey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <>
                <button
                  onClick={() => {
                    setCaseToEdit(null);
                    setIsNewModalOpen(true);
                  }}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
                  <Plus className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Register New Appeal</span>
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
                  className="group relative overflow-hidden bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs hover:shadow-md hover:border-slate-400 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                  title="Upload court cases from Excel"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Cases (Excel)</span>
                </button>

                <button
                  onClick={handlePrintDailyCauseList}
                  className="group relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:shadow-slate-900/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                  title="Print Daily Bench Cause List under Telangana Bhu Bharati Act"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-xl" />
                  <Printer className="w-3.5 h-3.5 text-amber-300 relative z-10" />
                  <span className="relative z-10">Print Cause List</span>
                </button>

                <button
                  onClick={() => handlePrintAllCasesRegister(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:shadow-blue-900/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                  title="Print Complete Appellate Cases Register with all details"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-xl" />
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-300 relative z-10" />
                  <span className="relative z-10">Print All Cases ({appealCases.length})</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-xl" />
                  <Download className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Export CSV</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>

            {/* Mandal Selector */}
            <select
              value={selectedMandal}
              onChange={(e) => setSelectedMandal(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 font-semibold rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Mandals ({MANDAL_LIST.length})</option>
              {MANDAL_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Appeal Type Selector */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 font-semibold rounded-md px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none max-w-xs truncate"
            >
              <option value="ALL">All Appeal Acts / Sections</option>
              {APPEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-slate-100 via-slate-150 to-slate-200/90 p-1.5 rounded-xl border border-slate-300/80 shadow-inner">
              <button
                onClick={() => setSelectedStatusFilter('ALL')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-lg font-black transition-all duration-200 text-xs cursor-pointer ${
                  selectedStatusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 -translate-y-0.5'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-lg" />
                <span className="relative z-10">All</span>
              </button>
              <button
                onClick={() => setSelectedStatusFilter('FINAL_ORDERS')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-lg font-black transition-all duration-200 text-xs cursor-pointer ${
                  selectedStatusFilter === 'FINAL_ORDERS'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 -translate-y-0.5'
                    : 'text-slate-700 hover:text-emerald-700 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-lg" />
                <span className="relative z-10">Final Orders</span>
              </button>
              <button
                onClick={() => setSelectedStatusFilter('ALLOWED')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-lg font-black transition-all duration-200 text-xs cursor-pointer ${
                  selectedStatusFilter === 'ALLOWED'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30 -translate-y-0.5'
                    : 'text-slate-700 hover:text-teal-700 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-lg" />
                <span className="relative z-10">Allowed</span>
              </button>
              <button
                onClick={() => setSelectedStatusFilter('DISMISSED_REMANDED')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-lg font-black transition-all duration-200 text-xs cursor-pointer ${
                  selectedStatusFilter === 'DISMISSED_REMANDED'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 -translate-y-0.5'
                    : 'text-slate-700 hover:text-rose-700 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-lg" />
                <span className="relative z-10">Dismissed / Remanded</span>
              </button>
              <button
                onClick={() => setSelectedStatusFilter('PENDING_STAY')}
                className={`relative overflow-hidden px-3 py-1.5 rounded-lg font-black transition-all duration-200 text-xs cursor-pointer ${
                  selectedStatusFilter === 'PENDING_STAY'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 -translate-y-0.5'
                    : 'text-slate-700 hover:text-amber-700 hover:bg-white/80 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-lg" />
                <span className="relative z-10">Under Hearing</span>
              </button>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-blue-700 font-black">{filteredCases.length}</span> of{' '}
            {appealCases.length} Cases
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* REVENUE COURT REGISTER TABLE (LOCKED BLUE THEAD) */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px]">
          <table className="w-full text-xs text-left border-separate border-spacing-0 border-t border-l border-slate-300 bg-white">
            {/* LOCKED THEAD - 1st & 2nd Rows stay locked in Blue with White fonts */}
            <thead className="sticky top-0 z-30 shadow-md">
              {/* Row 1: Merged Title row */}
              <tr className="sticky top-0 z-40 bg-[#134674]" style={{ height: '44px' }}>
                <th
                  colSpan={8}
                  className="sticky top-0 left-0 z-40 bg-[#134674] text-white px-4 py-2.5 border-b-2 border-r border-[#0e3253] text-center select-none shadow-sm"
                  style={{ backgroundColor: '#134674' }}
                >
                  <div className="flex items-center justify-center gap-2 text-center">
                    <Scale className="w-4 h-4 text-amber-300" />
                    <span className="text-sm font-black text-white tracking-wide">
                      COURT OF THE REVENUE DIVISIONAL OFFICER, HUZURNAGAR — TELANGANA BHU BHARATI ACT, 2025 APPEAL CASES &amp; FINAL ORDER REGISTER
                    </span>
                  </div>
                </th>
              </tr>

              {/* Row 2: Column Headers */}
              <tr className="sticky top-[44px] z-30 bg-[#164875]" style={{ height: '38px' }}>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-center font-bold text-[11px] w-12"
                  style={{ backgroundColor: '#164875' }}
                >
                  S.No
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-center font-bold text-[11px] min-w-[130px]"
                  style={{ backgroundColor: '#164875' }}
                >
                  Case No &amp; Provision
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-center font-bold text-[11px] min-w-[150px]"
                  style={{ backgroundColor: '#164875' }}
                >
                  Location & Land
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-left font-bold text-[11px] min-w-[200px]"
                  style={{ backgroundColor: '#164875' }}
                >
                  Parties (Appellant vs Respondent)
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-center font-bold text-[11px] min-w-[140px]"
                  style={{ backgroundColor: '#164875' }}
                >
                  Status &amp; Next Hearing
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-left font-bold text-[11px] min-w-[220px]"
                  style={{ backgroundColor: '#164875' }}
                >
                  Final Order Details & Gist
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-center font-bold text-[11px] min-w-[130px]"
                  style={{ backgroundColor: '#164875' }}
                >
                  Final Order Copy
                </th>
                <th
                  className="sticky top-[44px] z-30 bg-[#164875] text-white py-2.5 px-3 border-b border-r border-slate-400/50 text-center font-bold text-[11px] w-28"
                  style={{ backgroundColor: '#164875' }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Scrollable Body */}
            <tbody className="divide-y divide-slate-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 border-r border-b">
                    <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No Appeal Cases found matching your search.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedMandal('ALL');
                        setSelectedStatusFilter('ALL');
                        setSelectedTypeFilter('ALL');
                      }}
                      className="mt-2 text-blue-600 hover:underline font-bold text-xs"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c, idx) => {
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                  const hasOrder = Boolean(c.finalOrderNo || c.finalOrderSummary || c.hasFinalOrderAttachment);

                  return (
                    <tr key={c.id} className={`${rowBg} hover:bg-blue-50/60 transition-colors`}>
                      {/* S.No */}
                      <td className="py-3 px-3 border-r border-b border-slate-200 text-center font-bold text-slate-600">
                        {idx + 1}
                      </td>

                      {/* Case No & Act */}
                      <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                        <div
                          onClick={() => setSelectedCaseForDetail(c)}
                          className="font-black text-blue-900 hover:text-blue-700 cursor-pointer hover:underline text-xs"
                        >
                          {c.caseNo}
                        </div>
                        {c.registrationNo && (
                          <div className="text-[9.5px] font-bold text-slate-700">
                            Reg: {c.registrationNo}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 line-clamp-1" title={c.appealType}>
                          {c.appealType}
                        </div>
                        {c.bhuBharatiActSection && (
                          <div className="text-[9.5px] text-blue-700 font-semibold line-clamp-1" title={c.bhuBharatiActSection}>
                            Sec: {c.bhuBharatiActSection}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Filing: <strong className="text-slate-600">{c.filingDate}</strong>
                        </div>
                      </td>

                      {/* Location & Land */}
                      <td className="py-3 px-3 border-r border-b border-slate-200">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{c.village}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-600 font-semibold pl-4">
                          {c.mandal} Mandal
                        </div>
                        {(c.surveyNo || c.extent) && (
                          <div className="text-[10px] text-slate-500 font-medium pl-4 mt-0.5">
                            Sy: <strong className="text-slate-800">{c.surveyNo || '-'}</strong> • Ext: <strong className="text-slate-800">{c.extent || '-'}</strong>
                          </div>
                        )}
                      </td>

                      {/* Parties */}
                      <td className="py-3 px-3 border-r border-b border-slate-200">
                        <div className="text-xs">
                          <div className="text-blue-950 font-bold">
                            <span className="text-blue-700 font-black">App: </span>
                            {c.appellantName}
                          </div>
                          {c.appellantAdvocate && (
                            <div className="text-[10px] text-slate-500 italic pl-3">
                              Adv: {c.appellantAdvocate}
                            </div>
                          )}
                          <div className="text-slate-700 font-medium mt-1">
                            <span className="text-slate-500 font-bold">Resp: </span>
                            {c.respondentName}
                          </div>
                          {c.respondentAdvocate && (
                            <div className="text-[10px] text-slate-500 italic pl-3">
                              Adv: {c.respondentAdvocate}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status & Next Hearing Badge */}
                      <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                        {renderStatusBadge(c.status)}

                        {/* Next Hearing Date */}
                        {c.nextHearingDate && (
                          <div className="mt-1">
                            {c.nextHearingDate.toLowerCase().includes('disposed') || c.status.includes('Final Order') ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Disposed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                                <Calendar className="w-2.5 h-2.5 text-amber-700" />
                                Next: {c.nextHearingDate}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stage / Purpose */}
                        {c.stagePurpose && (
                          <div className="text-[9px] text-slate-600 font-semibold mt-0.5 max-w-[130px] mx-auto truncate" title={c.stagePurpose}>
                            {c.stagePurpose}
                          </div>
                        )}

                        {/* Notice Issued Date */}
                        {c.noticeIssuedDate && (
                          <div className="text-[8.5px] text-blue-700 font-semibold mt-0.5">
                            Notice: {c.noticeIssuedDate}
                          </div>
                        )}
                      </td>

                      {/* Final Order Details */}
                      <td className="py-3 px-3 border-r border-b border-slate-200 text-xs">
                        {c.finalOrderNo ? (
                          <div className="font-extrabold text-blue-900 text-[11px]">
                            {c.finalOrderNo}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Under proceedings</span>
                        )}

                        {c.finalOrderDate && (
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Date: {c.finalOrderDate}
                          </div>
                        )}

                        {c.finalOrderSummary ? (
                          <div
                            className="text-[10.5px] text-slate-700 font-medium mt-1 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer bg-slate-50 p-1.5 rounded border border-slate-200"
                            title={c.finalOrderSummary}
                          >
                            {c.finalOrderSummary}
                          </div>
                        ) : null}
                      </td>

                      {/* Final Order Copy (Upload or View) */}
                      <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                        {c.hasFinalOrderAttachment || c.finalOrderFile || c.finalOrderNo ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              onClick={() => onViewFinalOrder(c)}
                              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs hover:shadow-md hover:shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                              title="View Official Final Order Copy"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Order (PDF)</span>
                            </button>
                            {!isViewer && (
                              <button
                                onClick={() => setCaseForOrderUpload(c)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-semibold transition hover:scale-105"
                              >
                                Replace / Update
                              </button>
                            )}
                          </div>
                        ) : !isViewer ? (
                          <button
                            onClick={() => setCaseForOrderUpload(c)}
                            className="group relative overflow-hidden bg-gradient-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-950 border border-amber-300 text-[10.5px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-2xs hover:shadow-sm transform hover:-translate-y-0.5 cursor-pointer mx-auto"
                            title="Upload final order copy for this case"
                          >
                            <Upload className="w-3 h-3 text-amber-800" />
                            <span>Upload Order</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Order Uploaded</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 border-r border-b border-slate-200 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Anyone can view case details */}
                          <button
                            onClick={() => setSelectedCaseForDetail(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-100/80 hover:shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer"
                            title="View Case Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print / Download Case Slip */}
                          <button
                            onClick={() => handlePrintSingleCaseSlip(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-amber-100/80 hover:shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer"
                            title="Download Case Status Slip (PDF)"
                          >
                            <Download className="w-4 h-4 text-amber-600" />
                          </button>

                          {/* Edit case: Staff and Admin only */}
                          {!isViewer && (
                            <button
                              onClick={() => {
                                setCaseToEdit(c);
                                setIsNewModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-100/80 hover:shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer"
                              title="Edit Case"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete case: ADMIN ONLY */}
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteCase(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-100/80 hover:shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer"
                              title="Delete Case (Administrator Only)"
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

        {/* Table Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex flex-wrap justify-between items-center text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-bold text-emerald-800">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Allowed</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-800">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span>Dismissed</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-purple-800">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span>Remanded</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-800">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Stay</span>
            </span>
          </div>
          <span className="font-semibold text-slate-500">
            Court of the Revenue Divisional Officer • Huzurnagar
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: ADD / EDIT APPEAL CASE */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* MODAL 2: DIRECT FINAL ORDER UPLOAD */}
      {/* ============================================================ */}
      <UploadFinalOrderModal
        isOpen={Boolean(caseForOrderUpload)}
        onClose={() => setCaseForOrderUpload(null)}
        appealCase={caseForOrderUpload}
        onSaveOrder={async (updatedCase, fileBase64) => {
          await onUpdateCase(updatedCase, fileBase64);
        }}
        onShowToast={onShowToast}
      />

      {/* ============================================================ */}
      {/* MODAL 3: CASE DETAIL QUICK INSPECT DRAWER / MODAL (Image 1 & 2 format) */}
      {/* ============================================================ */}
      {selectedCaseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0c2a47] via-[#134674] to-[#1e5a92] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Scale className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded">
                      e-Courts Case Details
                    </span>
                    <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-blue-500/40 text-blue-100 rounded border border-blue-300/30">
                      Telangana Bhu Bharati Act, 2025
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-black tracking-wide mt-1">
                    Case No: {selectedCaseForDetail.caseNo}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Court of the Revenue Divisional Officer &amp; Sub-Divisional Magistrate, Huzurnagar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => handlePrintSingleCaseSlip(selectedCaseForDetail)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-sm transition cursor-pointer"
                    title="Download Official Case Status Slip (PDF)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Case Slip</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCaseForDetail(null);
                    setIsAddingHearingToCase(false);
                  }}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Table 1: Case Details (Image 1 style) */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-black text-slate-800 text-[11px] uppercase tracking-wider">
                  Case Details &amp; Registration Info
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4 border-r border-slate-200">Case Type</th>
                      <td colSpan={3} className="py-2 px-3 font-extrabold text-blue-950">{selectedCaseForDetail.appealType}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4 border-r border-slate-200">Filing Number</th>
                      <td className="py-2 px-3 font-black text-blue-900 w-1/4 border-r border-slate-200">{selectedCaseForDetail.caseNo}</td>
                      <th className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4 border-r border-slate-200">Filing Date</th>
                      <td className="py-2 px-3 font-extrabold text-slate-800">{selectedCaseForDetail.filingDate}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4 border-r border-slate-200">Registration Number</th>
                      <td className="py-2 px-3 font-bold text-slate-800 w-1/4 border-r border-slate-200">{selectedCaseForDetail.registrationNo || selectedCaseForDetail.caseNo.replace(/[^0-9/]/g, '') || '-'}</td>
                      <th className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4 border-r border-slate-200">Registration Date</th>
                      <td className="py-2 px-3 font-bold text-slate-800">{selectedCaseForDetail.registrationDate || selectedCaseForDetail.filingDate}</td>
                    </tr>
                    <tr>
                      <th className="py-2 px-3 bg-slate-50 font-bold text-slate-600 w-1/4 border-r border-slate-200">CNR Number</th>
                      <td colSpan={3} className="py-2 px-3 font-mono font-bold text-emerald-800 tracking-wider">
                        {selectedCaseForDetail.cnrNumber || `TSHZNR04000${String(selectedCaseForDetail.id).slice(-4)}2026`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Box 2: Case Status Card (Image 1 style) */}
              <div className="border-2 border-amber-400 bg-amber-50/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <h4 className="font-black text-rose-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-700" />
                    <span>Case Status &amp; Notice Tracking</span>
                  </h4>
                  {renderStatusBadge(selectedCaseForDetail.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">First Hearing Date</span>
                    <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">
                      {selectedCaseForDetail.firstHearingDate || selectedCaseForDetail.filingDate}
                    </span>
                  </div>

                  <div className="bg-amber-100/70 p-2.5 rounded-lg border-2 border-amber-400">
                    <span className="text-amber-950 font-black block text-[10px] uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-700" /> Next Hearing Date
                    </span>
                    <span className="font-black text-amber-950 text-sm mt-0.5 block">
                      {selectedCaseForDetail.nextHearingDate || (selectedCaseForDetail.status.includes('Final Order') ? 'Disposed' : '-')}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Notice Issued Date</span>
                    <span className="font-extrabold text-blue-900 text-xs mt-0.5 block">
                      {selectedCaseForDetail.noticeIssuedDate || 'Summons Issued'}
                      {selectedCaseForDetail.noticeServedDate && (
                        <span className="text-[10px] text-emerald-700 block">Served: {selectedCaseForDetail.noticeServedDate}</span>
                      )}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Case Stage / Purpose</span>
                    <span className="font-black text-rose-900 text-xs mt-0.5 block line-clamp-1" title={selectedCaseForDetail.stagePurpose}>
                      {selectedCaseForDetail.stagePurpose || selectedCaseForDetail.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-amber-200">
                  <span className="font-bold text-amber-900">Court Number and Judge:</span>
                  <span className="font-black text-blue-950">Court of the Revenue Divisional Officer &amp; Sub-Divisional Magistrate, Huzurnagar</span>
                </div>
              </div>

              {/* Box 3: Petitioner and Advocate & Respondent and Advocate (Image 1 style) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-blue-200 bg-blue-50/60 p-3.5 rounded-xl">
                  <span className="font-black text-blue-900 block text-xs mb-1.5 uppercase tracking-wide">
                    Petitioner and Advocate
                  </span>
                  <div className="font-bold text-slate-900 text-xs">
                    1) {selectedCaseForDetail.appellantName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 pl-4">
                    Advocate - <strong className="text-slate-800">{selectedCaseForDetail.appellantAdvocate || 'None'}</strong>
                  </div>
                </div>

                <div className="border border-purple-200 bg-purple-50/60 p-3.5 rounded-xl">
                  <span className="font-black text-purple-900 block text-xs mb-1.5 uppercase tracking-wide">
                    Respondent and Advocate
                  </span>
                  <div className="font-bold text-slate-900 text-xs">
                    1) {selectedCaseForDetail.respondentName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 pl-4">
                    Advocate - <strong className="text-slate-800">{selectedCaseForDetail.respondentAdvocate || 'GP for Revenue'}</strong>
                  </div>
                </div>
              </div>

              {/* Box 4: Acts & Property Details (Image 2 style) */}
              <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-xl space-y-1.5">
                <div className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  Acts &amp; Property Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold">Under Act(s): </span>
                    <span className="font-extrabold text-blue-950">Telangana Bhu Bharati (Record of Rights in Land) Act, 2025</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Under Section(s): </span>
                    <span className="font-extrabold text-blue-900">{selectedCaseForDetail.bhuBharatiActSection || 'Section 15(1) read with Rule 14'}</span>
                  </div>
                </div>
                <div className="text-xs pt-1 border-t border-slate-200 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>
                    Location: <strong>Sy.No. {selectedCaseForDetail.surveyNo || '-'}</strong> ({selectedCaseForDetail.extent || '-'}) • <strong>{selectedCaseForDetail.village}</strong> Village, <strong>{selectedCaseForDetail.mandal}</strong> Mandal
                  </span>
                </div>
              </div>

              {/* Box 5: Case History Table (Image 2 style) */}
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Case History &amp; Proceedings Timeline</span>
                  </div>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingHearingToCase(!isAddingHearingToCase);
                        setQuickNextHearingDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
                        setQuickNoticeDate(selectedCaseForDetail.noticeIssuedDate || new Date().toISOString().split('T')[0]);
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10.5px] px-2.5 py-1 rounded flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingHearingToCase ? 'Cancel' : '+ Record Notice / Next Hearing'}</span>
                    </button>
                  )}
                </div>

                {/* Quick Add Hearing Sub-Form */}
                {!isViewer && isAddingHearingToCase && (
                  <div className="p-4 bg-amber-50/80 border-b-2 border-amber-300 space-y-3">
                    <span className="font-black text-amber-950 text-xs block">
                      Record Next Hearing Date, Notice Proceedings &amp; Stage Document:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-slate-700 font-bold text-[10.5px] mb-0.5">
                          Notice Issued Date
                        </label>
                        <input
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={quickNoticeDate}
                          onChange={(e) => setQuickNoticeDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold text-[10.5px] mb-0.5">
                          Next Hearing Date <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={quickNextHearingDate}
                          onChange={(e) => setQuickNextHearingDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-amber-400 rounded text-xs font-black text-amber-950"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold text-[10.5px] mb-0.5">
                          Purpose of Hearing
                        </label>
                        <select
                          value={quickHearingPurpose}
                          onChange={(e) => setQuickHearingPurpose(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                        >
                          <option value="SUMMONS & NOTICE ISSUED">SUMMONS &amp; NOTICE ISSUED</option>
                          <option value="FOR APPEARANCE & COUNTER">FOR APPEARANCE &amp; COUNTER</option>
                          <option value="FOR TAHSILDAR FIELD REPORT">FOR TAHSILDAR FIELD REPORT</option>
                          <option value="FOR ARGUMENTS OF BOTH PARTIES">FOR ARGUMENTS OF BOTH PARTIES</option>
                          <option value="RESERVED FOR ORDERS">RESERVED FOR ORDERS</option>
                          <option value="FINAL ORDER PRONOUNCED">FINAL ORDER PRONOUNCED</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleQuickAddHearing}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer shadow-xs"
                        >
                          Save Update &amp; Stage
                        </button>
                      </div>
                    </div>

                    {/* Stage Document Upload Box */}
                    <div className="border border-dashed border-amber-400 bg-amber-100/50 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-800 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-950 text-[11px] block">
                            Attach Stage Document / Notice Copy (PDF / Image)
                          </span>
                          {stageFileName ? (
                            <span className="text-[10px] font-black text-emerald-800 block">
                              Selected: {stageFileName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 block">
                              Optional: Attach summons, interim notice, or proceedings report
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={stageFileInputRef}
                          accept=".pdf,image/*"
                          onChange={handleStageFileChange}
                          className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                        />
                        {stageFileName && (
                          <button
                            type="button"
                            onClick={() => {
                              setStageFileBase64('');
                              setStageFileName('');
                              if (stageFileInputRef.current) stageFileInputRef.current.value = '';
                            }}
                            className="text-[10px] text-rose-700 hover:underline font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Daily court order / proceedings note (e.g. Notice served on Tahsildar. Call on next date for field verification report.)"
                        value={quickProceedings}
                        onChange={(e) => setQuickProceedings(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Hidden input for uploading doc to existing stage */}
                <input
                  type="file"
                  ref={existingStageFileInputRef}
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleExistingStageFileChange}
                />

                {/* Case History Table Rows */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 font-bold text-[10.5px] w-1/5">Judge / Presiding Officer</th>
                        <th className="py-2 px-3 font-bold text-[10.5px] text-center w-20">Business Date</th>
                        <th className="py-2 px-3 font-bold text-[10.5px] text-center w-20">Hearing Date</th>
                        <th className="py-2 px-3 font-bold text-[10.5px] w-1/5">Purpose / Stage</th>
                        <th className="py-2 px-3 font-bold text-[10.5px]">Daily Proceedings</th>
                        <th className="py-2 px-2.5 font-bold text-[10.5px] text-center w-28">Stage Document</th>
                        {!isViewer && (
                          <th className="py-2 px-2 font-bold text-[10.5px] text-center w-20">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {((selectedCaseForDetail.caseHistory && selectedCaseForDetail.caseHistory.length > 0)
                        ? selectedCaseForDetail.caseHistory
                        : [
                            {
                              id: '1',
                              judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
                              businessDate: selectedCaseForDetail.filingDate,
                              hearingDate: selectedCaseForDetail.firstHearingDate || selectedCaseForDetail.hearingDate || selectedCaseForDetail.filingDate,
                              purpose: selectedCaseForDetail.noticeIssuedDate ? 'SUMMONS & NOTICE ISSUED' : 'CASE ADMISSION & NOTICE',
                              proceedings: selectedCaseForDetail.noticeIssuedDate ? `Statutory notice issued to Tahsildar and Respondents on ${selectedCaseForDetail.noticeIssuedDate}.` : 'Notice issued to respondents.'
                            },
                            ...(selectedCaseForDetail.nextHearingDate && !selectedCaseForDetail.nextHearingDate.toLowerCase().includes('disposed') ? [{
                              id: '2',
                              judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
                              businessDate: selectedCaseForDetail.hearingDate || selectedCaseForDetail.filingDate,
                              hearingDate: selectedCaseForDetail.nextHearingDate,
                              purpose: selectedCaseForDetail.stagePurpose || 'FOR APPEARANCE & COUNTER',
                              proceedings: `Next hearing posted on ${selectedCaseForDetail.nextHearingDate} for ${selectedCaseForDetail.stagePurpose || 'hearing'}.`
                            }] : []),
                            ...(selectedCaseForDetail.status.includes('Final Order') && selectedCaseForDetail.finalOrderDate ? [{
                              id: '3',
                              judgeOfficer: 'Revenue Divisional Officer & SDM, Huzurnagar',
                              businessDate: selectedCaseForDetail.finalOrderDate,
                              hearingDate: selectedCaseForDetail.finalOrderDate,
                              purpose: 'FINAL ORDER PRONOUNCED',
                              proceedings: `Final order issued. Procgs No: ${selectedCaseForDetail.finalOrderNo || '-'}. Result: ${selectedCaseForDetail.status}.`
                            }] : [])
                          ]
                      ).map((h, i) => (
                        <tr key={h.id || i} className="hover:bg-amber-50/40">
                          <td className="py-2 px-3 font-bold text-slate-800 text-[11px]">
                            {h.judgeOfficer || 'Revenue Divisional Officer & SDM, Huzurnagar'}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-900 text-center text-[11px]">
                            {h.businessDate}
                          </td>
                          <td className="py-2 px-3 font-black text-amber-900 text-center text-[11px]">
                            {h.hearingDate}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 text-[11px]">
                            {h.purpose}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {h.proceedings || '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {h.documentFile ? (
                              <button
                                type="button"
                                onClick={() => handleViewOrDownloadStageDoc(h)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                title={`View/Download ${h.documentName || 'Stage Doc'}`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>{h.documentName ? (h.documentName.length > 10 ? h.documentName.substring(0, 8) + '...' : h.documentName) : 'View Doc'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No File</span>
                            )}
                          </td>
                          {!isViewer && (
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleUploadDocToExistingStage(h.id)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                title="Upload or Replace document for this stage"
                              >
                                <Upload className="w-2.5 h-2.5" />
                                <span>{h.documentFile ? 'Replace' : 'Upload'}</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 6: Final Order / Judgment Section (If Disposed) */}
              {(selectedCaseForDetail.finalOrderNo || selectedCaseForDetail.finalOrderSummary || selectedCaseForDetail.status.includes('Final Order')) && (
                <div className="border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Final Order / Judgment Pronounced
                    </span>
                    {renderStatusBadge(selectedCaseForDetail.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block">Final Order / Procgs No:</span>
                      <p className="font-black text-blue-950 mt-0.5">
                        {selectedCaseForDetail.finalOrderNo || 'Procgs Pending'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Disposal Date:</span>
                      <p className="font-extrabold text-slate-800 mt-0.5">
                        {selectedCaseForDetail.finalOrderDate || selectedCaseForDetail.hearingDate || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedCaseForDetail.finalOrderSummary && (
                    <div>
                      <span className="text-slate-600 font-bold block mb-1">
                        Operative Portion / Directives to Tahsildar under Telangana Bhu Bharati Act, 2025:
                      </span>
                      <p className="p-3 bg-white rounded-lg border border-emerald-200 text-slate-800 leading-relaxed font-medium text-xs">
                        {selectedCaseForDetail.finalOrderSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 gap-2">
                <div className="flex items-center gap-2">
                  {!isViewer && (
                    <>
                      <button
                        onClick={() => {
                          const c = selectedCaseForDetail;
                          setSelectedCaseForDetail(null);
                          setCaseForOrderUpload(c);
                        }}
                        className="text-blue-700 hover:text-blue-900 font-bold text-xs flex items-center gap-1 p-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Final Order Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          const c = selectedCaseForDetail;
                          setSelectedCaseForDetail(null);
                          setCaseToEdit(c);
                          setIsNewModalOpen(true);
                        }}
                        className="text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1 p-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Full Case</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onViewFinalOrder(selectedCaseForDetail);
                      setSelectedCaseForDetail(null);
                    }}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Official Order PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCaseForDetail(null);
                      setIsAddingHearingToCase(false);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg transition cursor-pointer text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
