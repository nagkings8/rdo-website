import React, { useState } from 'react';
import { StaffUser, AdminProfile } from '../../types';
import { 
  X, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  AlertCircle 
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StaffUser | null;
  adminProfile: AdminProfile;
  staff: StaffUser[];
  onUpdateStaffPassword: (staffId: number, newPassword: string) => void;
  onUpdateAdminPassword: (newPassword: string) => void;
  onShowToast: (msg: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  adminProfile,
  staff,
  onUpdateStaffPassword,
  onUpdateAdminPassword,
  onShowToast,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMsg('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 3) {
      setErrorMsg('New password must be at least 3 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (currentUser.role === 'ADMIN') {
      const currentAdminPassword = adminProfile.password || 'admin';
      if (currentPassword !== currentAdminPassword) {
        setErrorMsg('Incorrect current administrator password.');
        return;
      }

      onUpdateAdminPassword(newPassword);
      onShowToast('✅ Administrator password updated successfully.');
      handleClose();
    } else {
      // Staff password change
      const staffMember = staff.find((s) => s.id === currentUser.id);
      const expectedPassword = staffMember?.password || currentUser.password || 'staff';

      if (currentPassword !== expectedPassword) {
        setErrorMsg('Incorrect current password.');
        return;
      }

      onUpdateStaffPassword(currentUser.id, newPassword);
      onShowToast(`✅ Password successfully changed for ${currentUser.name}.`);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#061122] text-white px-5 py-4 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span>Change Password</span>
            </div>
          </h3>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-md hover:bg-white/10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
          {/* User badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#061122] text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
              {currentUser.role === 'ADMIN' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-amber-700 font-black uppercase tracking-wider">
                Logged In As
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {currentUser.cadre}
              </div>
            </div>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 uppercase shrink-0">
              Active
            </span>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showCurrent ? 'Hide' : 'Show'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new secure password"
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showNew ? 'Hide' : 'Show'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirm ? 'Hide' : 'Show'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
