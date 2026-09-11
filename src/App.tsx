import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './utils/firebase';
import {
  BhuFile,
  InwardTapal,
  OutwardDespatch,
  StaffUser,
  AdminProfile,
  AppealCase,
  AuditLogEntry,
} from './types';
import {
  safeGetLocalStorage,
  safeSaveLocalStorage,
  getAttachmentFromDB,
  deleteAttachmentFromDB,
  setAttachmentInDB,
  INITIAL_FILES,
  INITIAL_INWARD,
  INITIAL_OUTWARD,
  INITIAL_STAFF,
  INITIAL_ADMIN_PROFILE,
} from './utils/storage';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { BhuBharatiView } from './components/BhuBharatiView';
import { TapalRegisterView } from './components/TapalRegisterView';
import { SadabainamaView } from './components/SadabainamaView';
import { AppealCasesView } from './components/AppealCasesView';
import { AdminView } from './components/AdminView';
import { ColorSplashCursor } from './components/ColorSplashCursor';
import { DEFAULT_SADABAINAMA_ABSTRACT, DEFAULT_SADABAINAMA_REPORT } from './data/sadabainamaData';
import { INITIAL_APPEAL_CASES } from './data/appealCasesData';
import { INITIAL_AUDIT_LOGS } from './data/initialAuditLogs';
import { generateOfficialOrderPdf } from './utils/orderPdfGenerator';

// Modals
import { FileModal } from './components/modals/FileModal';
import { StatusModal } from './components/modals/StatusModal';
import { InwardModal } from './components/modals/InwardModal';
import { InwardStatusModal } from './components/modals/InwardStatusModal';
import { OutwardModal } from './components/modals/OutwardModal';
import { PdfViewerModal } from './components/modals/PdfViewerModal';
import { PrintSlipModal } from './components/modals/PrintSlipModal';
import { PrintReportModal } from './components/modals/PrintReportModal';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal';
import { LoginModal } from './components/modals/LoginModal';
import { AddUserModal } from './components/modals/AddUserModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { PrintReportPayload } from './utils/printReport';

export default function App() {
  // Application State
  const [files, setFiles] = useState<BhuFile[]>(() =>
    safeGetLocalStorage('rdo_files', INITIAL_FILES)
  );
  const [inwards, setInwards] = useState<InwardTapal[]>(() =>
    safeGetLocalStorage('rdo_inward_tapal', INITIAL_INWARD)
  );
  const [outwards, setOutwards] = useState<OutwardDespatch[]>(() =>
    safeGetLocalStorage('rdo_outward', INITIAL_OUTWARD)
  );
  const [staff, setStaff] = useState<StaffUser[]>(() => {
    const loaded = safeGetLocalStorage<StaffUser[]>('rdo_staff', INITIAL_STAFF);
    return loaded.map((s, idx) => ({
      ...s,
      phone: s.phone || (INITIAL_STAFF.find((is) => is.id === s.id)?.phone || `949012345${idx + 1}`),
      password: s.password || 'staff',
    }));
  });
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    const loaded = safeGetLocalStorage<AdminProfile>('rdo_admin_profile', INITIAL_ADMIN_PROFILE);
    return {
      ...INITIAL_ADMIN_PROFILE,
      ...loaded,
    };
  });
  const [sadabainamaAbstract, setSadabainamaAbstract] = useState<any[][] | null>(() =>
    safeGetLocalStorage('rdo_sadabainama_abstract', DEFAULT_SADABAINAMA_ABSTRACT)
  );
  const [sadabainamaReport, setSadabainamaReport] = useState<any[][] | null>(() =>
    safeGetLocalStorage('rdo_sadabainama_report', DEFAULT_SADABAINAMA_REPORT)
  );
  const [appealCases, setAppealCases] = useState<AppealCase[]>(() =>
    safeGetLocalStorage('rdo_appeal_cases', INITIAL_APPEAL_CASES)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    safeGetLocalStorage('rdo_audit_logs', INITIAL_AUDIT_LOGS)
  );

  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboardTab');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pre-filter transfers from dashboard
  const [bhuInitialStatus, setBhuInitialStatus] = useState<string>('');
  const [inwardInitialStatus, setInwardInitialStatus] = useState<string>('');
  const [outwardInitialSentTo, setOutwardInitialSentTo] = useState<string>('');

  // Modal States
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedFileForStatus, setSelectedFileForStatus] = useState<BhuFile | null>(null);

  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [selectedInwardForEdit, setSelectedInwardForEdit] = useState<InwardTapal | null>(null);
  const [isInwardStatusModalOpen, setIsInwardStatusModalOpen] = useState(false);
  const [selectedInwardForStatus, setSelectedInwardForStatus] = useState<InwardTapal | null>(null);

  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [preselectedInwardId, setPreselectedInwardId] = useState<number | null>(null);
  const [editingOutward, setEditingOutward] = useState<OutwardDespatch | null>(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSubtitle, setPdfSubtitle] = useState('');
  const [pdfFileName, setPdfFileName] = useState('Official_Document');

  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [selectedFileForSlip, setSelectedFileForSlip] = useState<BhuFile | null>(null);

  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);
  const [printReportData, setPrintReportData] = useState<PrintReportPayload | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalTitle, setDeleteModalTitle] = useState('');
  const [deleteModalDetails, setDeleteModalDetails] = useState<React.ReactNode>(null);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => Promise<void>) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Global listener for table print preview requests across all tabs
  useEffect(() => {
    const handleOpenPrintPreview = (e: any) => {
      if (e.detail) {
        setPrintReportData(e.detail);
        setIsPrintReportModalOpen(true);
      }
    };
    window.addEventListener('app-open-print-preview', handleOpenPrintPreview);
    return () => {
      window.removeEventListener('app-open-print-preview', handleOpenPrintPreview);
    };
  }, []);

  // Firebase Realtime Listeners
  useEffect(() => {
    const unsubFiles = onSnapshot(collection(db, 'bhu_files'), (snapshot) => {
      if (!snapshot.empty) {
        const list: BhuFile[] = [];
        snapshot.forEach((d) => list.push(d.data() as BhuFile));
        setFiles(list);
        safeSaveLocalStorage('rdo_files', list);
      }
    });

    const unsubInwards = onSnapshot(collection(db, 'inward_tapals'), (snapshot) => {
      if (!snapshot.empty) {
        const list: InwardTapal[] = [];
        snapshot.forEach((d) => list.push(d.data() as InwardTapal));
        setInwards(list);
        safeSaveLocalStorage('rdo_inward_tapal', list);
      }
    });

    const unsubOutwards = onSnapshot(collection(db, 'outward_despatches'), (snapshot) => {
      if (!snapshot.empty) {
        const list: OutwardDespatch[] = [];
        snapshot.forEach((d) => list.push(d.data() as OutwardDespatch));
        setOutwards(list);
        safeSaveLocalStorage('rdo_outward', list);
      }
    });

    const unsubAppeals = onSnapshot(collection(db, 'appeal_cases'), (snapshot) => {
      if (!snapshot.empty) {
        const list: AppealCase[] = [];
        snapshot.forEach((d) => list.push(d.data() as AppealCase));
        setAppealCases(list);
        safeSaveLocalStorage('rdo_appeal_cases', list);
      }
    });

    return () => {
      unsubFiles();
      unsubInwards();
      unsubOutwards();
      unsubAppeals();
    };
  }, []);

  // Toast handler
  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Dashboard navigation router
  const handleDashboardNavigate = (targetTab: ActiveTab, filters?: any) => {
    if (filters) {
      if (targetTab === 'bhuBharatiTab' && filters.status !== undefined) {
        setBhuInitialStatus(filters.status);
      }
      if (targetTab === 'tapalTab') {
        if (filters.status !== undefined) setInwardInitialStatus(filters.status);
        if (filters.sentTo !== undefined) setOutwardInitialSentTo(filters.sentTo);
      }
    }
    setActiveTab(targetTab);
  };

  // Staff admin navigation guard
  const handleOpenAdminFromDashboard = () => {
    if (currentUser && currentUser.role === 'ADMIN') {
      setActiveTab('adminTab');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Activity & File Audit Logger
  const logActivity = (
    module: 'Bhu Bharati' | 'Tapal Inward' | 'Tapal Outward' | 'Appeal Cases' | 'Sadabainama' | 'Staff Admin',
    recordId: string,
    actionType: 'ENTRY' | 'EDIT' | 'STATUS_CHANGE' | 'DELETE' | 'ORDER_UPLOAD',
    details: string
  ) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const timestamp = `${formattedDate}, ${formattedTime}`;

    const performedBy = currentUser
      ? `${currentUser.name} (${currentUser.cadre || currentUser.role})`
      : 'Desk Officer (Staff)';
    const userRole = currentUser?.role || 'STAFF';

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      module,
      recordId,
      actionType,
      performedBy,
      userRole,
      details,
    };

    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      safeSaveLocalStorage('rdo_audit_logs', updated);
      return updated;
    });
  };

  // Bhu Bharati File Handlers (Firestore Sync Enabled)
  const handleSaveFile = async (newFile: BhuFile) => {
    const updated = [newFile, ...files.filter((f) => f.id !== newFile.id)];
    setFiles(updated);
    safeSaveLocalStorage('rdo_files', updated);
    try {
      await setDoc(doc(db, 'bhu_files', String(newFile.id)), newFile);
    } catch (err) {
      console.error('Firebase save error:', err);
    }
    logActivity(
      'Bhu Bharati',
      newFile.appNumber,
      'ENTRY',
      `New Bhu Bharati file registered for ${newFile.applicantName}, Village: ${newFile.village}, Mandal: ${newFile.mandal}, Module: ${newFile.module}.`
    );
  };

  const handleUpdateFileStatus = (file: BhuFile) => {
    setSelectedFileForStatus(file);
    setIsStatusModalOpen(true);
  };

  const handleSaveFileStatus = async (updatedFile: BhuFile) => {
    const updated = files.map((f) => (f.id === updatedFile.id ? updatedFile : f));
    setFiles(updated);
    safeSaveLocalStorage('rdo_files', updated);
    try {
      await setDoc(doc(db, 'bhu_files', String(updatedFile.id)), updatedFile);
    } catch (err) {
      console.error('Firebase update error:', err);
    }
    logActivity(
      'Bhu Bharati',
      updatedFile.appNumber,
      'STATUS_CHANGE',
      `Status updated to "${updatedFile.status}". Remarks: ${updatedFile.remarks || 'Scrutiny updated'}.`
    );
  };

  const handleSwitchToStatusFromModal = (fileId: number) => {
    const target = files.find((f) => f.id === fileId);
    if (target) {
      handleUpdateFileStatus(target);
    }
  };

  const handlePrintSlip = (file: BhuFile) => {
    setSelectedFileForSlip(file);
    setIsPrintSlipOpen(true);
  };

  const handleViewBhuPdf = async (file: BhuFile) => {
    let docAttachment = file.fileAttachment;
    if (!docAttachment && (file.attachmentKey || file.hasAttachment)) {
      docAttachment = (await getAttachmentFromDB(file.attachmentKey || `bhu_${file.id}`)) || undefined;
    }
    if (!docAttachment) {
      showToast('No document attached for this Bhu Bharati file.');
      return;
    }
    setPdfData(docAttachment);
    setPdfTitle(`📂 Bhu Bharati Dossier: ${file.appNumber} (${file.applicantName})`);
    setPdfSubtitle(
      `Mandal: <strong>${file.mandal}</strong> • Village: <strong>${file.village}</strong> • Module: <strong>${file.module}</strong> • Status: <strong>${file.status}</strong>`
    );
    setPdfFileName(`${file.appNumber}_Bhu_Bharati_Dossier`);
    setIsPdfModalOpen(true);
  };

  const handleDeleteBhuFilePrompt = (file: BhuFile) => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('⚠️ Access restricted: Only Administrator can delete records.');
      return;
    }
    setDeleteModalTitle('📂 Bhu Bharati File Record');
    setDeleteModalDetails(
      <div className="space-y-1">
        <div><strong>Application No:</strong> {file.appNumber}</div>
        <div><strong>Applicant:</strong> {file.applicantName}</div>
        <div><strong>Mandal &amp; Village:</strong> {file.mandal} ({file.village})</div>
        <div><strong>Survey No:</strong> {file.surveyNo}</div>
        <div><strong>Module:</strong> {file.module}</div>
      </div>
    );
    setPendingDeleteAction(() => async () => {
      if (file.attachmentKey) await deleteAttachmentFromDB(file.attachmentKey);
      const updated = files.filter((f) => f.id !== file.id);
      setFiles(updated);
      safeSaveLocalStorage('rdo_files', updated);
      try {
        await deleteDoc(doc(db, 'bhu_files', String(file.id)));
      } catch (err) {
        console.error('Firebase delete error:', err);
      }
      logActivity(
        'Bhu Bharati',
        file.appNumber,
        'DELETE',
        `File record deleted for applicant ${file.applicantName} (${file.appNumber}).`
      );
      showToast(`Bhu Bharati file record (${file.appNumber}) deleted successfully.`);
    });
    setIsDeleteModalOpen(true);
  };

  // Inward Tapal Handlers (Firestore Sync Enabled)
  const handleSaveInward = async (savedTapal: InwardTapal) => {
    const exists = inwards.some((t) => t.id === savedTapal.id);
    let updated: InwardTapal[];
    if (exists) {
      updated = inwards.map((t) => (t.id === savedTapal.id ? savedTapal : t));
      logActivity(
        'Tapal Inward',
        savedTapal.inwardNo,
        'EDIT',
        `Inward record updated/returned. Sender: ${savedTapal.sender}. Mandal: ${savedTapal.mandal}, Village: ${savedTapal.village || 'General'}. Status: ${savedTapal.status}.`
      );
    } else {
      updated = [savedTapal, ...inwards];
      logActivity(
        'Tapal Inward',
        savedTapal.inwardNo,
        'ENTRY',
        `New Inward Tapal received from ${savedTapal.sender} (${savedTapal.mandal || 'GENERAL'}, ${savedTapal.village || 'General'}). Subject: ${savedTapal.subject}.`
      );
    }
    setInwards(updated);
    safeSaveLocalStorage('rdo_inward_tapal', updated);
    try {
      await setDoc(doc(db, 'inward_tapals', String(savedTapal.id)), savedTapal);
    } catch (err) {
      console.error('Firebase inward save error:', err);
    }
  };

  const handleEditInward = (tapal: InwardTapal) => {
    setSelectedInwardForEdit(tapal);
    setIsInwardModalOpen(true);
  };

  const handleUpdateInwardStatus = (tapal: InwardTapal) => {
    setSelectedInwardForStatus(tapal);
    setIsInwardStatusModalOpen(true);
  };

  const handleSaveInwardStatus = async (updatedTapal: InwardTapal) => {
    const updated = inwards.map((t) => (t.id === updatedTapal.id ? updatedTapal : t));
    setInwards(updated);
    safeSaveLocalStorage('rdo_inward_tapal', updated);
    try {
      await setDoc(doc(db, 'inward_tapals', String(updatedTapal.id)), updatedTapal);
    } catch (err) {
      console.error('Firebase inward status update error:', err);
    }
    logActivity(
      'Tapal Inward',
      updatedTapal.inwardNo,
      'STATUS_CHANGE',
      `Inward Tapal status updated to "${updatedTapal.status}". Assigned seat: ${updatedTapal.seat || 'D Section'}.`
    );
  };

  const handleViewInwardPdf = async (tapal: InwardTapal) => {
    let docAttachment = tapal.fileAttachment;
    if (!docAttachment && (tapal.attachmentKey || tapal.hasAttachment)) {
      docAttachment = (await getAttachmentFromDB(tapal.attachmentKey || `inw_${tapal.id}`)) || undefined;
    }
    if (!docAttachment) {
      showToast('No document attached for this Inward Tapal.');
      return;
    }
    setPdfData(docAttachment);
    setPdfTitle(`📬 Inward Tapal: ${tapal.inwardNo}`);
    setPdfSubtitle(
      `Sender: <strong>${tapal.sender}</strong> • Mandal: <strong>${tapal.mandal}</strong> • Received Date: <strong>${tapal.receivedDate}</strong>`
    );
    setPdfFileName(`${tapal.inwardNo}_Inward_Document`);
    setIsPdfModalOpen(true);
  };

  const handleDeleteInwardPrompt = (tapal: InwardTapal) => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('⚠️ Access restricted: Only Administrator can delete records.');
      return;
    }
    setDeleteModalTitle('📬 Inward Tapal Record');
    setDeleteModalDetails(
      <div className="space-y-1">
        <div><strong>Inward / Tapal No:</strong> {tapal.inwardNo}</div>
        <div><strong>Sender:</strong> {tapal.sender} • <strong>Date:</strong> {tapal.receivedDate}</div>
        <div><strong>Subject:</strong> {tapal.subject}</div>
      </div>
    );
    setPendingDeleteAction(() => async () => {
      if (tapal.attachmentKey) await deleteAttachmentFromDB(tapal.attachmentKey);
      const updated = inwards.filter((t) => t.id !== tapal.id);
      setInwards(updated);
      safeSaveLocalStorage('rdo_inward_tapal', updated);
      try {
        await deleteDoc(doc(db, 'inward_tapals', String(tapal.id)));
      } catch (err) {
        console.error('Firebase delete error:', err);
      }
      logActivity(
        'Tapal Inward',
        tapal.inwardNo,
        'DELETE',
        `Inward Tapal #${tapal.inwardNo} from ${tapal.sender} deleted.`
      );
      showToast(`Inward Tapal (${tapal.inwardNo}) deleted successfully.`);
    });
    setIsDeleteModalOpen(true);
  };

  // Outward Despatch Handlers (Firestore Sync Enabled)
  const handleOpenOutward = (linkedId?: number) => {
    setEditingOutward(null);
    setPreselectedInwardId(linkedId || null);
    setIsOutwardModalOpen(true);
  };

  const handleEditOutward = (outward: OutwardDespatch) => {
    setEditingOutward(outward);
    setPreselectedInwardId(null);
    setIsOutwardModalOpen(true);
  };

  const handleSaveOutward = async (
    savedOutward: OutwardDespatch,
    shouldDisposeInwardId?: number | null,
    isEdit?: boolean
  ) => {
    let updatedOutwards: OutwardDespatch[];
    if (isEdit) {
      updatedOutwards = outwards.map((o) =>
        o.id === savedOutward.id ? savedOutward : o
      );
      logActivity(
        'Tapal Outward',
        savedOutward.outwardNo,
        'EDIT',
        `Updated Outward Despatch #${savedOutward.outwardNo} to ${savedOutward.sentTo}. Subject: ${savedOutward.subject}`
      );
    } else {
      updatedOutwards = [savedOutward, ...outwards];
      logActivity(
        'Tapal Outward',
        savedOutward.outwardNo,
        'ENTRY',
        `Official outward correspondence dispatched to ${savedOutward.sentTo} via ${savedOutward.mode}. Subject: ${savedOutward.subject}.`
      );
    }
    setOutwards(updatedOutwards);
    safeSaveLocalStorage('rdo_outward', updatedOutwards);
    try {
      await setDoc(doc(db, 'outward_despatches', String(savedOutward.id)), savedOutward);
    } catch (err) {
      console.error('Firebase outward save error:', err);
    }

    if (shouldDisposeInwardId) {
      const targetInward = inwards.find((t) => t.id === shouldDisposeInwardId);
      if (targetInward) {
        const disposed = { ...targetInward, status: 'Disposed' as const };
        const updatedInwards = inwards.map((t) =>
          t.id === shouldDisposeInwardId ? disposed : t
        );
        setInwards(updatedInwards);
        safeSaveLocalStorage('rdo_inward_tapal', updatedInwards);
        try {
          await setDoc(doc(db, 'inward_tapals', String(disposed.id)), disposed);
        } catch (err) {
          console.error('Firebase inward dispose error:', err);
        }
      }
    }
    setEditingOutward(null);
  };

  const handleViewOutwardPdf = async (outward: OutwardDespatch) => {
    let docAttachment = outward.fileAttachment;
    if (!docAttachment && (outward.attachmentKey || outward.hasAttachment)) {
      docAttachment = (await getAttachmentFromDB(outward.attachmentKey || `out_${outward.id}`)) || undefined;
    }
    if (!docAttachment) {
      showToast('No document attached for this Outward Despatch.');
      return;
    }
    setPdfData(docAttachment);
    setPdfTitle(`📤 Outward Despatch: ${outward.outwardNo}`);
    setPdfSubtitle(
      `Dispatched To: <strong>${outward.sentTo}</strong> • Date: <strong>${outward.outwardDate}</strong> • Mode: <strong>${outward.mode}</strong>`
    );
    setPdfFileName(`${outward.outwardNo.replace(/\//g, '_')}_Outward_Despatch`);
    setIsPdfModalOpen(true);
  };

  const handleDeleteOutwardPrompt = (outward: OutwardDespatch) => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('⚠️ Access restricted: Only Administrator can delete records.');
      return;
    }
    setDeleteModalTitle('📤 Outward Despatch Record');
    setDeleteModalDetails(
      <div className="space-y-1">
        <div><strong>Despatch No:</strong> {outward.outwardNo}</div>
        <div><strong>Dispatched To:</strong> {outward.sentTo} • <strong>Date:</strong> {outward.outwardDate}</div>
        <div><strong>Subject:</strong> {outward.subject}</div>
      </div>
    );
    setPendingDeleteAction(() => async () => {
      if (outward.attachmentKey) await deleteAttachmentFromDB(outward.attachmentKey);
      const updated = outwards.filter((o) => o.id !== outward.id);
      setOutwards(updated);
      safeSaveLocalStorage('rdo_outward', updated);
      try {
        await deleteDoc(doc(db, 'outward_despatches', String(outward.id)));
      } catch (err) {
        console.error('Firebase delete outward error:', err);
      }
      logActivity(
        'Tapal Outward',
        outward.outwardNo,
        'DELETE',
        `Outward despatch #${outward.outwardNo} to ${outward.sentTo} deleted.`
      );
      showToast(`Outward Despatch (${outward.outwardNo}) deleted successfully.`);
    });
    setIsDeleteModalOpen(true);
  };

  // Appeal Cases Handlers (Firestore Sync Enabled)
  const handleSaveAppealCase = async (newCase: AppealCase, rawFileString?: string) => {
    let caseToSave = { ...newCase };
    if (rawFileString) {
      const key = `appeal_order_${newCase.id}`;
      await setAttachmentInDB(key, rawFileString);
      caseToSave.attachmentKey = key;
      caseToSave.hasFinalOrderAttachment = true;
    }
    const updated = [caseToSave, ...appealCases.filter((c) => c.id !== newCase.id)];
    setAppealCases(updated);
    safeSaveLocalStorage('rdo_appeal_cases', updated);
    try {
      await setDoc(doc(db, 'appeal_cases', String(caseToSave.id)), caseToSave);
    } catch (err) {
      console.error('Firebase appeal case save error:', err);
    }
    logActivity(
      'Appeal Cases',
      newCase.caseNo,
      rawFileString ? 'ORDER_UPLOAD' : 'ENTRY',
      `Appeal Case filed: ${newCase.appellantName} vs ${newCase.respondentName}. Type: ${newCase.appealType}, Village: ${newCase.village}.`
    );
    showToast(`Appeal Case ${newCase.caseNo} registered successfully.`);
  };

  const handleUpdateAppealCase = async (updatedCase: AppealCase, rawFileString?: string) => {
    let caseToSave = { ...updatedCase };
    if (rawFileString) {
      const key = updatedCase.attachmentKey || `appeal_order_${updatedCase.id}`;
      await setAttachmentInDB(key, rawFileString);
      caseToSave.attachmentKey = key;
      caseToSave.hasFinalOrderAttachment = true;
    }
    const updated = appealCases.map((c) => (c.id === updatedCase.id ? caseToSave : c));
    setAppealCases(updated);
    safeSaveLocalStorage('rdo_appeal_cases', updated);
    try {
      await setDoc(doc(db, 'appeal_cases', String(caseToSave.id)), caseToSave);
    } catch (err) {
      console.error('Firebase appeal case update error:', err);
    }
    logActivity(
      'Appeal Cases',
      updatedCase.caseNo,
      rawFileString ? 'ORDER_UPLOAD' : 'EDIT',
      `Appeal Case updated. Status: ${updatedCase.status}. Next Hearing: ${updatedCase.nextHearingDate || 'Disposed'}. Remarks: ${updatedCase.remarks || 'Case proceedings recorded'}.`
    );
    showToast(`Appeal Case ${updatedCase.caseNo} updated successfully.`);
  };

  const handleDeleteAppealCasePrompt = (appealCase: AppealCase) => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('⚠️ Access restricted: Only Administrator can delete records.');
      return;
    }
    setDeleteModalTitle('⚖️ Appeal Case Record');
    setDeleteModalDetails(
      <div className="space-y-1">
        <div><strong>Case No:</strong> {appealCase.caseNo} • <strong>Type:</strong> {appealCase.appealType}</div>
        <div><strong>Appellant:</strong> {appealCase.appellantName} • <strong>Village:</strong> {appealCase.village}</div>
        <div><strong>Status:</strong> {appealCase.status}</div>
      </div>
    );
    setPendingDeleteAction(() => async () => {
      if (appealCase.attachmentKey) await deleteAttachmentFromDB(appealCase.attachmentKey);
      const updated = appealCases.filter((c) => c.id !== appealCase.id);
      setAppealCases(updated);
      safeSaveLocalStorage('rdo_appeal_cases', updated);
      try {
        await deleteDoc(doc(db, 'appeal_cases', String(appealCase.id)));
      } catch (err) {
        console.error('Firebase delete appeal case error:', err);
      }
      logActivity(
        'Appeal Cases',
        appealCase.caseNo,
        'DELETE',
        `Appeal Case #${appealCase.caseNo} (${appealCase.appellantName}) deleted.`
      );
      showToast(`Appeal Case (${appealCase.caseNo}) deleted successfully.`);
    });
    setIsDeleteModalOpen(true);
  };

  const handleViewAppealFinalOrder = async (appealCase: AppealCase) => {
    let docAttachment = appealCase.finalOrderFile;
    if (!docAttachment && (appealCase.attachmentKey || appealCase.hasFinalOrderAttachment)) {
      docAttachment = (await getAttachmentFromDB(appealCase.attachmentKey || `appeal_order_${appealCase.id}`)) || undefined;
    }
    if (!docAttachment) {
      docAttachment = await generateOfficialOrderPdf(appealCase);
    }
    setPdfData(docAttachment);
    setPdfTitle(`⚖️ Appeal Final Order: ${appealCase.caseNo}`);
    setPdfSubtitle(
      `Court of RDO Huzurnagar • Village: <strong>${appealCase.village}</strong> • Result: <strong>${appealCase.status}</strong>`
    );
    setPdfFileName(`${appealCase.caseNo.replace(/\//g, '_')}_Final_Order`);
    setIsPdfModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteAction) return;
    setIsDeleting(true);
    try {
      await pendingDeleteAction();
    } catch (e) {
      console.error('Delete error:', e);
      showToast('Error during deletion.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setPendingDeleteAction(null);
    }
  };

  // Staff & Admin Handlers
  const handleToggleUserStatus = (id: number) => {
    const updated = staff.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
    setStaff(updated);
    safeSaveLocalStorage('rdo_staff', updated);
  };

  const handleSaveNewUser = (newUser: StaffUser) => {
    const updated = [...staff, newUser];
    setStaff(updated);
    safeSaveLocalStorage('rdo_staff', updated);
  };

  const handleUpdateStaff = (updatedMember: StaffUser) => {
    const updated = staff.map((u) => (u.id === updatedMember.id ? updatedMember : u));
    setStaff(updated);
    safeSaveLocalStorage('rdo_staff', updated);
    if (currentUser && currentUser.id === updatedMember.id) {
      setCurrentUser(updatedMember);
    }
  };

  const handleDeleteStaff = (staffId: number) => {
    const updated = staff.filter((u) => u.id !== staffId);
    setStaff(updated);
    safeSaveLocalStorage('rdo_staff', updated);
    if (currentUser && currentUser.id === staffId) {
      setCurrentUser(null);
      setActiveTab('dashboardTab');
    }
  };

  const handleUpdateAdminProfile = (newProfile: AdminProfile) => {
    setAdminProfile(newProfile);
    safeSaveLocalStorage('rdo_admin_profile', newProfile);
    if (currentUser && currentUser.role === 'ADMIN') {
      setCurrentUser({
        id: newProfile.id || 999,
        name: newProfile.name,
        role: 'ADMIN',
        cadre: newProfile.cadre,
        phone: newProfile.phone,
        active: true,
      });
    }
  };

  const handleUpdateStaffPassword = (staffId: number, newPassword: string) => {
    const updated = staff.map((s) => (s.id === staffId ? { ...s, password: newPassword } : s));
    setStaff(updated);
    safeSaveLocalStorage('rdo_staff', updated);
    logActivity(
      'Staff Admin',
      `Staff #${staffId}`,
      'EDIT',
      `Password changed for staff member #${staffId}`
    );
    if (currentUser && currentUser.id === staffId) {
      setCurrentUser({ ...currentUser, password: newPassword });
    }
  };

  const handleUpdateAdminPassword = (newPassword: string) => {
    const updated = { ...adminProfile, password: newPassword };
    setAdminProfile(updated);
    safeSaveLocalStorage('rdo_admin_profile', updated);
    logActivity(
      'Staff Admin',
      'Administrator',
      'EDIT',
      'Administrator master password updated'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      <ColorSplashCursor />

      <div className="sticky top-0 z-50 w-full shadow-lg bg-[#061122]">
        <Header
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={() => {
            setCurrentUser(null);
            if (activeTab === 'adminTab') setActiveTab('dashboardTab');
            showToast('Signed out.');
          }}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onGoHome={() => setActiveTab('dashboardTab')}
        />

        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUser}
        />
      </div>

      <main className="max-w-[1520px] w-full mx-auto px-4 md:px-6 py-6 flex-1">
        {activeTab === 'dashboardTab' && (
          <DashboardView
            files={files}
            inwards={inwards}
            outwards={outwards}
            staff={staff}
            appealCases={appealCases}
            sadabainamaAbstract={sadabainamaAbstract}
            currentUser={currentUser}
            onNavigate={handleDashboardNavigate}
            onNewFile={() => setIsFileModalOpen(true)}
            onNewInward={() => setIsInwardModalOpen(true)}
            onNewOutward={() => handleOpenOutward()}
            onOpenAdmin={handleOpenAdminFromDashboard}
          />
        )}

        {activeTab === 'bhuBharatiTab' && (
          <BhuBharatiView
            files={files}
            initialStatusFilter={bhuInitialStatus}
            currentUser={currentUser}
            onNewFile={() => setIsFileModalOpen(true)}
            onUpdateStatus={handleUpdateFileStatus}
            onPrintSlip={handlePrintSlip}
            onViewPdf={handleViewBhuPdf}
            onDeleteFile={handleDeleteBhuFilePrompt}
          />
        )}

        {activeTab === 'tapalTab' && (
          <TapalRegisterView
            inwards={inwards}
            outwards={outwards}
            initialInwardStatus={inwardInitialStatus}
            initialOutwardSentTo={outwardInitialSentTo}
            currentUser={currentUser}
            onNewInward={() => {
              setSelectedInwardForEdit(null);
              setIsInwardModalOpen(true);
            }}
            onEditInward={handleEditInward}
            onNewOutward={(linkedId) => handleOpenOutward(linkedId)}
            onEditOutward={handleEditOutward}
            onUpdateInwardStatus={handleUpdateInwardStatus}
            onViewInwardPdf={handleViewInwardPdf}
            onViewOutwardPdf={handleViewOutwardPdf}
            onDeleteInward={handleDeleteInwardPrompt}
            onDeleteOutward={handleDeleteOutwardPrompt}
          />
        )}

        {activeTab === 'sadabainamaTab' && (
          <SadabainamaView
            abstractData={sadabainamaAbstract}
            reportData={sadabainamaReport}
            currentUser={currentUser}
            onUpdateAbstract={setSadabainamaAbstract}
            onUpdateReport={setSadabainamaReport}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'appealCasesTab' && (
          <AppealCasesView
            appealCases={appealCases}
            currentUser={currentUser}
            onSaveCase={handleSaveAppealCase}
            onUpdateCase={handleUpdateAppealCase}
            onDeleteCase={handleDeleteAppealCasePrompt}
            onViewFinalOrder={handleViewAppealFinalOrder}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'adminTab' && currentUser?.role === 'ADMIN' && (
          <AdminView
            staff={staff}
            adminProfile={adminProfile}
            auditLogs={auditLogs}
            onOpenAddUser={() => setIsAddUserModalOpen(true)}
            onToggleUserStatus={handleToggleUserStatus}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onUpdateAdminProfile={handleUpdateAdminProfile}
            onShowToast={showToast}
          />
        )}
      </main>

      <Footer />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border-l-4 border-amber-400 text-white px-5 py-3 rounded-lg shadow-2xl z-50 text-xs font-semibold animate-fade-in flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* MODALS */}
      <FileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSave={handleSaveFile}
        onSwitchToStatus={handleSwitchToStatusFromModal}
        files={files}
        currentUser={currentUser}
        onShowToast={showToast}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedFileForStatus(null);
        }}
        file={selectedFileForStatus}
        onSaveStatus={handleSaveFileStatus}
        currentUser={currentUser}
        onShowToast={showToast}
      />

      <InwardModal
        isOpen={isInwardModalOpen}
        onClose={() => {
          setIsInwardModalOpen(false);
          setSelectedInwardForEdit(null);
        }}
        tapalToEdit={selectedInwardForEdit}
        existingInwards={inwards}
        onSave={handleSaveInward}
        onShowToast={showToast}
      />

      <InwardStatusModal
        isOpen={isInwardStatusModalOpen}
        onClose={() => {
          setIsInwardStatusModalOpen(false);
          setSelectedInwardForStatus(null);
        }}
        tapal={selectedInwardForStatus}
        onSave={handleSaveInwardStatus}
        onShowToast={showToast}
      />

      <OutwardModal
        isOpen={isOutwardModalOpen}
        onClose={() => {
          setIsOutwardModalOpen(false);
          setPreselectedInwardId(null);
          setEditingOutward(null);
        }}
        inwards={inwards}
        preselectedInwardId={preselectedInwardId}
        editingOutward={editingOutward}
        onSave={handleSaveOutward}
        onShowToast={showToast}
      />

      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPdfData(null);
        }}
        fileData={pdfData}
        title={pdfTitle}
        subtitle={pdfSubtitle}
        fileName={pdfFileName}
        onShowToast={showToast}
      />

      <PrintSlipModal
        isOpen={isPrintSlipOpen}
        onClose={() => {
          setIsPrintSlipOpen(false);
          setSelectedFileForSlip(null);
        }}
        file={selectedFileForSlip}
        onShowToast={showToast}
      />

      <PrintReportModal
        isOpen={isPrintReportModalOpen}
        data={printReportData}
        onClose={() => {
          setIsPrintReportModalOpen(false);
          setPrintReportData(null);
        }}
        onShowToast={showToast}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPendingDeleteAction(null);
        }}
        title={deleteModalTitle}
        details={deleteModalDetails}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        staff={staff}
        adminProfile={adminProfile}
        onLogin={setCurrentUser}
        onShowToast={showToast}
        onUpdateStaffPassword={handleUpdateStaffPassword}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        adminProfile={adminProfile}
        staff={staff}
        onUpdateStaffPassword={handleUpdateStaffPassword}
        onUpdateAdminPassword={handleUpdateAdminPassword}
        onShowToast={showToast}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSave={handleSaveNewUser}
        onShowToast={showToast}
      />
    </div>
  );
}