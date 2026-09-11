import React, { useState } from 'react';
import { StaffUser } from '../../types';
import { X, KeyRound, Lock, Eye, EyeOff, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface ChangeStaffPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StaffUser | null;
  onPasswordChanged: (userId: number, newPass: string) => void;
  onShowToast: (msg: string) => void;
}

export const ChangeStaffPasswordModal: React.FC<ChangeStaffPasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
  onShowToast,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check current password
    const expectedCurrent = currentUser.password || (currentUser.role === 'ADMIN' ? 'admin' : 'staff');
    if (currentPassword !== expectedCurrent) {
      setErrorMsg('Incorrect current password. Please re-enter your current password.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 3) {
      setErrorMsg('New password must be at least 3 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('New password cannot be identical to the current password.');
      return;
    }

    onPasswordChanged(currentUser.id, newPassword);
    onShowToast('✅ Password changed successfully! Please use your new password next time you login.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    onClose();
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
            onClick={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setErrorMsg('');
              onClose();
            }}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* User Info Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0e274a] text-amber-300 flex items-center justify-center font-black">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-xs">{currentUser.name}</div>
                <div className="text-[10.5px] text-slate-500 font-semibold">{currentUser.cadre}</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase">
              {currentUser.role}
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold flex items-center gap-1.5 text-[11px]">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Current Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              New Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password (min 3 chars)"
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Confirm New Password <span className="text-red-600">*</span>
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-type new password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setErrorMsg('');
                onClose();
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
