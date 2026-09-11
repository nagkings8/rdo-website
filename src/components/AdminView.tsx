import React, { useState, useMemo } from 'react';
import { StaffUser, AdminProfile, AuditLogEntry } from '../types';
import { 
  UserPlus, 
  Printer, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserX, 
  KeyRound, 
  Lock, 
  RotateCcw,
  Search,
  CheckCircle2,
  Phone,
  Eye,
  EyeOff,
  Check,
  Copy,
  Settings,
  X,
  Edit3,
  Trash2,
  AlertTriangle,
  History,
  FileText,
  Calendar,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Download,
  Clock,
  FileCheck,
  FolderOpen
} from 'lucide-react';
import { printTableReport } from '../utils/printReport';

interface AdminViewProps {
  staff: StaffUser[];
  adminProfile: AdminProfile;
  auditLogs?: AuditLogEntry[];
  onOpenAddUser: () => void;
  onToggleUserStatus: (id: number) => void;
  onUpdateStaff: (staffMember: StaffUser) => void;
  onDeleteStaff: (id: number) => void;
  onUpdateAdminProfile: (profile: AdminProfile) => void;
  onShowToast: (msg: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  staff,
  adminProfile,
  auditLogs = [],
  onOpenAddUser,
  onToggleUserStatus,
  onUpdateStaff,
  onDeleteStaff,
  onUpdateAdminProfile,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals inside AdminView
  const [editingStaffPassword, setEditingStaffPassword] = useState<StaffUser | null>(null);
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffNewPhone, setStaffNewPhone] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Edit Staff Details Modal State
  const [editingStaffDetails, setEditingStaffDetails] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editCadre, setEditCadre] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('STAFF');
  const [editActive, setEditActive] = useState(true);

  // Delete Staff Confirmation State
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null);

  // Admin Profile & Security Modal
  const [isAdminSecurityModalOpen, setIsAdminSecurityModalOpen] = useState(false);
  const [adminName, setAdminName] = useState(adminProfile.name);
  const [adminCadre, setAdminCadre] = useState(adminProfile.cadre);
  const [adminPhone, setAdminPhone] = useState(adminProfile.phone);
  const [adminPassword, setAdminPassword] = useState(adminProfile.password);
  const [adminConfirmPassword, setAdminConfirmPassword] = useState(adminProfile.password);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.cadre.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        s.role.toLowerCase().includes(q);
      const matchRole = roleFilter === '' || s.role.toLowerCase().includes(roleFilter.toLowerCase());
      const matchStatus =
        statusFilter === '' ||
        (statusFilter === 'active' && s.active) ||
        (statusFilter === 'disabled' && !s.active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [staff, searchTerm, roleFilter, statusFilter]);

  // Audit Log Register State (Admin Exclusive)
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('ALL');
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logOfficerFilter, setLogOfficerFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = logSearchTerm.toLowerCase();
      const matchSearch =
        !logSearchTerm ||
        log.recordId.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q);

      const matchModule = logModuleFilter === 'ALL' || log.module === logModuleFilter;
      const matchAction = logActionFilter === 'ALL' || log.actionType === logActionFilter;
      const matchOfficer = logOfficerFilter === 'ALL' || log.performedBy.toLowerCase().includes(logOfficerFilter.toLowerCase());

      return matchSearch && matchModule && matchAction && matchOfficer;
    });
  }, [auditLogs, logSearchTerm, logModuleFilter, logActionFilter, logOfficerFilter]);

  const officerOptions = useMemo(() => {
    const officers = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.performedBy) {
        const name = l.performedBy.split('(')[0]?.trim() || l.performedBy;
        officers.add(name);
      }
    });
    return Array.from(officers);
  }, [auditLogs]);

  const auditStats = useMemo(() => {
    const total = auditLogs.length;
    const entries = auditLogs.filter((l) => l.actionType === 'ENTRY').length;
    const edits = auditLogs.filter((l) => l.actionType === 'EDIT' || l.actionType === 'STATUS_CHANGE').length;
    const orders = auditLogs.filter((l) => l.actionType === 'ORDER_UPLOAD').length;
    return { total, entries, edits, orders };
  }, [auditLogs]);

  const handlePrintAuditLog = () => {
    const tableHeader = `
      <tr>
        <th style="width: 40px; background: #061122; color: #fbbf24;">S.No</th>
        <th style="width: 140px; background: #061122; color: #fbbf24;">Date & Time</th>
        <th style="width: 110px; background: #061122; color: #fbbf24;">Module</th>
        <th style="width: 130px; background: #061122; color: #fbbf24;">Record / File Ref</th>
        <th style="width: 100px; background: #061122; color: #fbbf24;">Action Type</th>
        <th style="width: 170px; background: #061122; color: #fbbf24;">Officer / Cadre</th>
        <th style="background: #061122; color: #fbbf24;">Activity Details & Remarks</th>
      </tr>
    `;

    const tableRows = filteredLogs.map((log, i) => `
      <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
        <td style="white-space: nowrap; border: 1px solid #cbd5e1; padding: 6px; font-size: 11px;">${log.timestamp}</td>
        <td style="font-weight: 600; border: 1px solid #cbd5e1; padding: 6px;">${log.module}</td>
        <td style="font-family: monospace; font-weight: bold; color: #0284c7; border: 1px solid #cbd5e1; padding: 6px;">${log.recordId}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">
          ${log.actionType}
        </td>
        <td style="font-weight: 600; border: 1px solid #cbd5e1; padding: 6px;">${log.performedBy}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 11px;">${log.details}</td>
      </tr>
    `).join('');

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 12px; color: #475569;">
        <strong>Audit Scope:</strong> RDO Office D-Section • Total Log Entries: <strong>${filteredLogs.length}</strong>
        ${logModuleFilter !== 'ALL' ? ` • Module: <strong>${logModuleFilter}</strong>` : ''}
        ${logActionFilter !== 'ALL' ? ` • Action: <strong>${logActionFilter}</strong>` : ''}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px;">
        <thead>${tableHeader}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'FILE ENTRY & EDIT AUDIT LOG REGISTER',
      subtitle: 'Revenue Divisional Office, Huzurnagar • Suryapet District • D-Section Log Register',
      period: `Confidential Admin Audit Trail • Printed on ${new Date().toLocaleString('en-IN')}`,
      landscape: true,
      fileName: 'RDO_Huzurnagar_Audit_Log.html'
    });
  };

  const handleExportAuditCsv = () => {
    const headers = ['S.No', 'Date & Time', 'Module', 'Record Ref', 'Action Type', 'Performed By', 'User Role', 'Details'];
    const rows = filteredLogs.map((l, i) => [
      i + 1,
      `"${l.timestamp}"`,
      `"${l.module}"`,
      `"${l.recordId}"`,
      `"${l.actionType}"`,
      `"${l.performedBy.replace(/"/g, '""')}"`,
      `"${l.userRole}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RDO_Huzurnagar_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('📥 Audit Log exported to CSV successfully.');
  };

  // Open Edit Staff Details Modal
  const handleOpenEditStaff = (member: StaffUser) => {
    setEditingStaffDetails(member);
    setEditName(member.name);
    setEditCadre(member.cadre);
    setEditPhone(member.phone || '');
    setEditRole(member.role);
    setEditActive(member.active);
  };

  // Save Edit Staff Details
  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffDetails) return;

    if (!editName.trim() || !editCadre.trim()) {
      onShowToast('Staff name and cadre are required.');
      return;
    }

    const updated: StaffUser = {
      ...editingStaffDetails,
      name: editName.trim(),
      cadre: editCadre.trim(),
      phone: editPhone.trim(),
      role: editRole.trim() || 'STAFF',
      active: editActive,
    };

    onUpdateStaff(updated);
    setEditingStaffDetails(null);
    onShowToast(`Staff details for ${updated.name} updated successfully!`);
  };

  // Confirm Delete Staff
  const handleConfirmDelete = () => {
    if (!deletingStaff) return;
    if (staff.length <= 1) {
      onShowToast('Cannot delete the last remaining staff account.');
      setDeletingStaff(null);
      return;
    }
    const staffName = deletingStaff.name;
    onDeleteStaff(deletingStaff.id);
    setDeletingStaff(null);
    onShowToast(`Staff account for ${staffName} deleted successfully.`);
  };

  const handlePrintStaff = () => {
    const tableHeader = `
      <tr>
        <th style="width: 40px; background: #164875; color: #fff;">S.No</th>
        <th style="background: #164875; color: #fff;">Staff Name</th>
        <th style="background: #164875; color: #fff;">Cadre / Designation</th>
        <th style="background: #164875; color: #fff;">Mobile / Phone No</th>
        <th style="background: #164875; color: #fff;">Assigned Role</th>
        <th style="background: #164875; color: #fff;">Account Status</th>
      </tr>
    `;

    const tableRows = filteredStaff
      .map(
        (u, i) => `
      <tr>
        <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 6px;">${i + 1}</td>
        <td style="font-weight: bold; border: 1px solid #94a3b8; padding: 6px;">${u.name}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px;">${u.cadre}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px; font-family: monospace; font-weight: bold;">${u.phone || '-'}</td>
        <td style="border: 1px solid #94a3b8; padding: 6px;">${u.role}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 6px;">
          ${u.active ? 'ACTIVE' : 'DISABLED'}
        </td>
      </tr>
    `
      )
      .join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>${tableHeader}</thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Staff & Section Officers Directory',
      subtitle: `Revenue Divisional Office, Huzurnagar • Administrator: ${adminProfile.name} (${adminProfile.phone})`,
      period: 'D Section Administration',
      landscape: false,
    });
  };

  // Open Change Staff Password Modal
  const handleOpenStaffPasswordModal = (member: StaffUser) => {
    setEditingStaffPassword(member);
    setStaffNewPassword(member.password || 'staff');
    setStaffNewPhone(member.phone || '');
    setShowStaffPassword(false);
  };

  // Save Staff Password
  const handleSaveStaffPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffPassword) return;

    if (!staffNewPassword.trim()) {
      onShowToast('Password cannot be empty.');
      return;
    }

    const updated: StaffUser = {
      ...editingStaffPassword,
      password: staffNewPassword.trim(),
      phone: staffNewPhone.trim() || editingStaffPassword.phone,
    };

    onUpdateStaff(updated);
    setEditingStaffPassword(null);
    onShowToast(`Password and phone details for ${updated.name} updated successfully!`);
  };

  // Open Admin Security Modal
  const handleOpenAdminSecurityModal = () => {
    setAdminName(adminProfile.name);
    setAdminCadre(adminProfile.cadre);
    setAdminPhone(adminProfile.phone);
    setAdminPassword(adminProfile.password);
    setAdminConfirmPassword(adminProfile.password);
    setShowAdminPassword(false);
    setIsAdminSecurityModalOpen(true);
  };

  // Save Admin Security & Phone
  const handleSaveAdminSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim()) {
      onShowToast('Please enter an official Administrator mobile phone number.');
      return;
    }

    if (!adminPassword.trim()) {
      onShowToast('Administrator password cannot be empty.');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      onShowToast('Passwords do not match. Please verify your new password.');
      return;
    }

    const updatedProfile: AdminProfile = {
      ...adminProfile,
      name: adminName.trim() || 'Administrator',
      cadre: adminCadre.trim() || 'Revenue Divisional Officer',
      phone: adminPhone.trim(),
      password: adminPassword.trim(),
    };

    onUpdateAdminProfile(updatedProfile);
    setIsAdminSecurityModalOpen(false);
    onShowToast('Administrator phone number and password updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* TOP DASHBOARD BANNER (GLOSSY REVENUE ACCESS CONTROL STYLE) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#1c1335] via-[#2d1b4e] to-[#1c1335] text-white p-5 md:p-6 rounded-2xl shadow-xl border-t-2 border-amber-400 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-700 p-0.5 shadow-lg shadow-purple-950/40 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#1e1338] rounded-[14px] flex items-center justify-center text-purple-300">
                <ShieldCheck className="w-6 h-6 md:w-7 md:h-7" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md shadow-xs">
                  Access &amp; Security Control
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 rounded-md border border-purple-400/30">
                  Role-Based Authorizations
                </span>
                <span className="text-xs font-semibold text-purple-200">
                  Revenue Divisional Office, Huzurnagar
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white drop-shadow-sm">
                D SECTION STAFF DIRECTORY &amp; ACCESS CONTROL
              </h1>
              <p className="text-xs text-purple-100 font-medium max-w-3xl">
                Manage Officer Accounts, Contact Phone Numbers, Passwords &amp; Administrative Credentials
              </p>
            </div>
          </div>

          {/* Admin Header Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdminSecurityModal}
              className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-amber-300/60"
              title="Change Admin Password and Mobile Phone Number"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-950/20 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5 text-slate-950" />
              </div>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider opacity-80 font-extrabold leading-none">
                  Admin Credentials
                </div>
                <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                  <span>Change Admin Password &amp; Phone</span>
                </div>
              </div>
            </button>

            <button
              onClick={onOpenAddUser}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Staff Directory &amp; Password Controls</h2>
            <p className="text-xs font-semibold text-slate-500">
              Manage D Section officer accounts, phone numbers, passwords, and authorization status
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintStaff}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Print Staff Directory with Mobile Numbers"
            >
              <Printer className="w-3.5 h-3.5 text-sky-300" />
              <span>Print Directory</span>
            </button>
            <button
              onClick={onOpenAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Staff Account</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search staff name, phone, cadre, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin / RDO</option>
            <option value="Assistant">Assistants</option>
            <option value="Staff">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="disabled">Disabled Accounts</option>
          </select>
          {(searchTerm || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-1.5 rounded hover:bg-rose-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse bg-white">
            <thead className="bg-slate-50 text-slate-900 uppercase font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200">Staff Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Cadre / Designation</th>
                <th className="py-2.5 px-3 border-r border-slate-200">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Phone Number</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200">Role</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Account Status</th>
                <th className="py-2.5 px-3 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {u.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                      {u.cadre}
                    </td>
                    {/* Phone Number column with call & copy */}
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono">
                      {u.phone ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${u.phone}`}
                            className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1"
                            title="Call Staff Member"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{u.phone}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {u.active ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Staff Details Button */}
                        <button
                          onClick={() => handleOpenEditStaff(u)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold px-2 py-1 rounded text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title={`Edit staff details for ${u.name}`}
                        >
                          <Edit3 className="w-3 h-3 text-sky-600" />
                          <span>Edit</span>
                        </button>

                        {/* Change Password Button */}
                        <button
                          onClick={() => handleOpenStaffPasswordModal(u)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-1 rounded text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title={`Change password for ${u.name}`}
                        >
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          <span>Password</span>
                        </button>

                        {/* Enable/Disable Button */}
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`font-bold px-2 py-1 rounded text-[11px] transition cursor-pointer shadow-xs ${
                            u.active
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {u.active ? 'Disable' : 'Enable'}
                        </button>

                        {/* Delete Staff Account Button */}
                        <button
                          onClick={() => setDeletingStaff(u)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-2 py-1 rounded text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title={`Delete account for ${u.name}`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION: FILE ENTRY & EDIT AUDIT LOG REGISTER (ADMIN ONLY)   */}
      {/* "ye file yevaru entry cheshaaru yeppudu evaru edit cheshaaru"*/}
      {/* ============================================================ */}
      <div className="bg-white border-2 border-slate-300/80 rounded-2xl shadow-md overflow-hidden">
        {/* Section Header */}
        <div className="bg-[#061122] text-white p-4 md:p-5 border-b-2 border-amber-500">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] md:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Exclusive • Confidential Audit Trail</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Live System Logs
                </span>
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                <History className="w-5 h-5 text-amber-400 shrink-0" />
                <span>File Entry &amp; Edit Audit Log Register</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl font-medium">
                Complete official audit record tracking which staff officer entered each file, who made status changes or edits, timestamps, and case disposal actions across D-Section.
              </p>
            </div>

            {/* Header Action Buttons: Print & Export */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrintAuditLog}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-amber-400 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Print Official Government Audit Log Register"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Register</span>
              </button>
              <button
                onClick={handleExportAuditCsv}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                title="Export all audit log entries to CSV file"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Metric Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Total Activities Logged</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{auditStats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Chronological system events</div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-emerald-600" />
              <span>New File Entries</span>
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1">{auditStats.entries}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Newly created files / tapal</div>
          </div>

          <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-blue-600" />
              <span>Status Updates &amp; Edits</span>
            </div>
            <div className="text-2xl font-black text-blue-950 mt-1">{auditStats.edits}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Scrutiny &amp; movement logs</div>
          </div>

          <div className="bg-white border border-purple-200 rounded-xl p-3 shadow-2xs">
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-purple-600" />
              <span>Orders &amp; Disposals</span>
            </div>
            <div className="text-2xl font-black text-purple-950 mt-1">{auditStats.orders}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Final orders &amp; despatches</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                placeholder="Search File No, Officer, or Remarks..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Module Filter */}
            <div>
              <select
                value={logModuleFilter}
                onChange={(e) => setLogModuleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-amber-500 focus:outline-none bg-white"
              >
                <option value="ALL">All Modules</option>
                <option value="Bhu Bharati">Bhu Bharati Files</option>
                <option value="Tapal Inward">Tapal Inward</option>
                <option value="Tapal Outward">Tapal Outward</option>
                <option value="Appeal Cases">Appeal Cases</option>
                <option value="Sadabainama">Sadabainama</option>
              </select>
            </div>

            {/* Action Type Filter */}
            <div>
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-amber-500 focus:outline-none bg-white"
              >
                <option value="ALL">All Actions</option>
                <option value="ENTRY">New File Entry</option>
                <option value="STATUS_CHANGE">Status Change</option>
                <option value="EDIT">File / Hearing Edited</option>
                <option value="ORDER_UPLOAD">Order Uploaded</option>
                <option value="DELETE">Record Deleted</option>
              </select>
            </div>

            {/* Officer Filter */}
            <div className="flex items-center gap-2">
              <select
                value={logOfficerFilter}
                onChange={(e) => setLogOfficerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-amber-500 focus:outline-none bg-white"
              >
                <option value="ALL">All Officers</option>
                {officerOptions.map((off) => (
                  <option key={off} value={off}>
                    {off}
                  </option>
                ))}
              </select>

              {(logSearchTerm || logModuleFilter !== 'ALL' || logActionFilter !== 'ALL' || logOfficerFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setLogSearchTerm('');
                    setLogModuleFilter('ALL');
                    setLogActionFilter('ALL');
                    setLogOfficerFilter('ALL');
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition shrink-0"
                  title="Reset Log Filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">S.No</th>
                <th className="py-3 px-3 w-40">Date &amp; Time</th>
                <th className="py-3 px-3 w-32">Module</th>
                <th className="py-3 px-3 w-36">Record Reference</th>
                <th className="py-3 px-3 w-36">Action Performed</th>
                <th className="py-3 px-3 w-48">Staff Officer &amp; Cadre</th>
                <th className="py-3 px-4">Activity Description &amp; Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-sm text-slate-600">No activity logs found</div>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting search or filter parameters</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const getModuleBadge = (mod: string) => {
                    switch (mod) {
                      case 'Bhu Bharati':
                        return 'bg-sky-50 text-sky-800 border-sky-300';
                      case 'Tapal Inward':
                        return 'bg-amber-50 text-amber-800 border-amber-300';
                      case 'Tapal Outward':
                        return 'bg-slate-100 text-slate-800 border-slate-300';
                      case 'Appeal Cases':
                        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
                      case 'Sadabainama':
                        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
                      default:
                        return 'bg-slate-50 text-slate-700 border-slate-200';
                    }
                  };

                  const getActionBadge = (act: string) => {
                    switch (act) {
                      case 'ENTRY':
                        return (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10.5px]">
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                            <span>New Entry</span>
                          </span>
                        );
                      case 'STATUS_CHANGE':
                        return (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full font-bold text-[10.5px]">
                            <ArrowUpDown className="w-3 h-3 text-blue-600" />
                            <span>Status Update</span>
                          </span>
                        );
                      case 'EDIT':
                        return (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold text-[10.5px]">
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            <span>Record Edited</span>
                          </span>
                        );
                      case 'ORDER_UPLOAD':
                        return (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full font-bold text-[10.5px]">
                            <FileCheck className="w-3 h-3 text-purple-600" />
                            <span>Order Uploaded</span>
                          </span>
                        );
                      case 'DELETE':
                        return (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold text-[10.5px]">
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Record Deleted</span>
                          </span>
                        );
                      default:
                        return <span className="font-semibold text-slate-600">{act}</span>;
                    }
                  };

                  return (
                    <tr key={log.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[11px]">{log.timestamp.split(',')[0]}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.timestamp.split(',')[1] || ''}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10.5px] border ${getModuleBadge(log.module)}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-black text-blue-900 bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                          {log.recordId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {getActionBadge(log.actionType)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {log.performedBy.split('(')[0] || log.performedBy}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {log.performedBy.includes('(') ? log.performedBy.substring(log.performedBy.indexOf('(')) : log.userRole}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 leading-relaxed font-medium">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Log Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-500">
          <div>
            Showing <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> audit log entries
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Audit logs are permanently captured and tamper-evident. Access restricted to Administrator.</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: CHANGE STAFF PASSWORD & PHONE MODAL */}
      {/* ============================================================ */}
      {editingStaffPassword && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in duration-150">
            <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span>Change Staff Password</span>
              </h3>
              <button 
                onClick={() => setEditingStaffPassword(null)} 
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffPassword} className="p-5 space-y-3.5 text-xs">
              {/* Officer Details Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Officer Account
                </div>
                <div className="font-bold text-slate-950 text-sm">
                  {editingStaffPassword.name}
                </div>
                <div className="text-slate-600 font-medium">
                  {editingStaffPassword.cadre} ({editingStaffPassword.role})
                </div>
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mobile Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9848012345"
                  value={staffNewPhone}
                  onChange={(e) => setStaffNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-2xs font-mono font-medium"
                />
              </div>

              {/* New Password Field */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={staffNewPassword}
                    onChange={(e) => setStaffNewPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-2xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter the new secure password to assign to this staff officer.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaffPassword(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-black px-4 py-1.5 rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADMIN PROFILE, PHONE & PASSWORD SETTINGS */}
      {/* ============================================================ */}
      {isAdminSecurityModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-150">
            <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Administrator Security &amp; Phone Settings</span>
              </h3>
              <button 
                onClick={() => setIsAdminSecurityModalOpen(false)} 
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminSecurity} className="p-5 md:p-6 space-y-4 text-xs">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-amber-900 text-[11px] leading-relaxed">
                <strong>Admin Notice:</strong> This mobile phone number will be displayed to staff members when they request password assistance on the portal login screen.
              </div>

              {/* Admin Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Administrator Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none shadow-2xs font-medium"
                />
              </div>

              {/* Admin Cadre */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cadre / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminCadre}
                  onChange={(e) => setAdminCadre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none shadow-2xs font-medium"
                />
              </div>

              {/* Admin Mobile Phone Number */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Mobile Phone Number <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9848012345"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none shadow-2xs font-mono font-bold text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Staff see this number under "Contact Admin" on the login screen.
                </p>
              </div>

              {/* Admin New Password */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin Password <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter administrator password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none shadow-2xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confirm Admin Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter administrator password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none shadow-2xs font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminSecurityModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#061122] hover:bg-slate-900 text-amber-400 border border-amber-500/40 font-black px-5 py-2 rounded-lg transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Admin Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: EDIT STAFF DETAILS MODAL */}
      {/* ============================================================ */}
      {editingStaffDetails && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-150">
            <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-sky-500">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <span>Edit Staff Details</span>
              </h3>
              <button 
                onClick={() => setEditingStaffDetails(null)} 
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="p-5 space-y-3.5 text-xs">
              {/* Staff Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Staff Member Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri K. Venkateshwarlu"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-2xs font-medium"
                />
              </div>

              {/* Cadre / Designation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cadre / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Assistant (D Section)"
                  value={editCadre}
                  onChange={(e) => setEditCadre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-2xs font-medium"
                />
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mobile Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9848012345"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-2xs font-mono font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Visible to Administrator only.
                </p>
              </div>

              {/* Assigned Role */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none shadow-2xs font-medium bg-white"
                >
                  <option value="STAFF">Staff / Assistant</option>
                  <option value="Senior Assistant">Senior Assistant</option>
                  <option value="Junior Assistant">Junior Assistant</option>
                  <option value="Typist">Typist</option>
                  <option value="Record Assistant">Record Assistant</option>
                  <option value="Section Officer">Section Officer</option>
                  <option value="Admin">Admin / RDO</option>
                </select>
              </div>

              {/* Account Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Account Status
                </label>
                <div className="flex gap-4 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={editActive}
                      onChange={() => setEditActive(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-700 font-bold">Active (Can Login)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={!editActive}
                      onChange={() => setEditActive(false)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-700 font-bold">Disabled (Blocked)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaffDetails(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-1.5 rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: DELETE STAFF CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deletingStaff && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in duration-150">
            <div className="bg-rose-600 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Delete Staff Account</span>
              </h3>
              <button 
                onClick={() => setDeletingStaff(null)} 
                className="text-white/80 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-800 font-semibold leading-relaxed">
                Are you sure you want to permanently delete this staff account from the portal?
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
                <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                  Officer to be Deleted
                </div>
                <div className="font-black text-rose-950 text-sm">
                  {deletingStaff.name}
                </div>
                <div className="text-slate-700 font-medium">
                  {deletingStaff.cadre} • Role: {deletingStaff.role}
                </div>
                {deletingStaff.phone && (
                  <div className="text-slate-600 font-mono text-[11px]">
                    Phone: {deletingStaff.phone}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-rose-700 font-semibold">
                ⚠️ This action is irreversible. The officer will no longer be able to log in to the portal.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingStaff(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
