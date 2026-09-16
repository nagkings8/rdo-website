import React, { useState, useEffect } from 'react';
import { StaffUser, AdminProfile } from '../../types';
import { 
  X, 
  Lock, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  BookOpen,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser[];
  adminProfile: AdminProfile;
  onLogin: (user: StaffUser) => void;
  onShowToast: (msg: string) => void;
  onUpdateStaffPassword?: (staffId: number, newPassword: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  staff,
  adminProfile,
  onLogin,
  onShowToast,
  onUpdateStaffPassword,
}) => {
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staff[0]?.id ? String(staff[0].id) : ''
  );
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState<'LOGIN' | 'FORGOT_PASSWORD' | 'CHANGE_PASSWORD'>('LOGIN');

  // Change Password form state
  const [changeStaffId, setChangeStaffId] = useState<string>(
    staff[0]?.id ? String(staff[0].id) : ''
  );
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [showChangeCurrent, setShowChangeCurrent] = useState(false);
  const [showChangeNew, setShowChangeNew] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Live Cloud Credentials
  const [cloudStaffList, setCloudStaffList] = useState<StaffUser[]>(staff);
  const [cloudAdminProfile, setCloudAdminProfile] = useState<AdminProfile>(adminProfile);

  // Listen to live Cloud Credentials on Firestore
  useEffect(() => {
    if (!isOpen) return;

    const unsubStaff = onSnapshot(doc(db, 'system_auth', 'staff_users'), (snap) => {
      if (snap.exists() && snap.data()?.users) {
        try {
          const parsed = JSON.parse(snap.data().users);
          setCloudStaffList(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    });

    const unsubAdmin = onSnapshot(doc(db, 'system_auth', 'admin_profile'), (snap) => {
      if (snap.exists() && snap.data()?.profile) {
        try {
          const parsed = JSON.parse(snap.data().profile);
          setCloudAdminProfile(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => {
      unsubStaff();
      unsubAdmin();
    };
  }, [isOpen]);

  useEffect(() => {
    if (staff.length > 0 && !selectedStaffId) {
      setSelectedStaffId(String(staff[0].id));
      setChangeStaffId(String(staff[0].id));
    }
  }, [staff, selectedStaffId]);

  if (!isOpen) return null;

  const currentStaffList = cloudStaffList.length > 0 ? cloudStaffList : staff;
  const currentAdmin = cloudAdminProfile || adminProfile;
  const activeStaffList = currentStaffList.filter((s) => s.active);

  const handleClose = () => {
    setActiveView('LOGIN');
    setPassword('');
    setChangeCurrentPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setChangeError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      if (role === 'ADMIN') {
        let expectedAdminPassword = currentAdmin.password || 'admin';
        try {
          const adminSnap = await getDoc(doc(db, 'system_auth', 'admin_profile'));
          if (adminSnap.exists() && adminSnap.data()?.profile) {
            const parsed = JSON.parse(adminSnap.data().profile);
            if (parsed.password) expectedAdminPassword = parsed.password;
          }
        } catch (fetchErr) {
          console.warn('Fallback to local admin profile:', fetchErr);
        }

        if (password !== expectedAdminPassword) {
          onShowToast('❌ Incorrect Administrator password.');
          setIsVerifying(false);
          return;
        }

        onLogin({
          id: currentAdmin.id || 999,
          name: currentAdmin.name,
          role: 'ADMIN',
          cadre: currentAdmin.cadre,
          phone: currentAdmin.phone,
          active: true,
        });
        setPassword('');
        handleClose();
        onShowToast(`Welcome, ${currentAdmin.name}! Signed in with administrative privileges.`);
      } else {
        let activeList = currentStaffList;
        try {
          const staffSnap = await getDoc(doc(db, 'system_auth', 'staff_users'));
          if (staffSnap.exists() && staffSnap.data()?.users) {
            activeList = JSON.parse(staffSnap.data().users);
          }
        } catch (fetchErr) {
          console.warn('Fallback to local staff list:', fetchErr);
        }

        const selected = activeList.find((s) => String(s.id) === selectedStaffId);
        if (!selected) {
          onShowToast('Please select a valid staff member.');
          setIsVerifying(false);
          return;
        }

        const expectedStaffPassword = selected.password || 'staff';
        if (password !== expectedStaffPassword) {
          onShowToast(`❌ Incorrect password for ${selected.name}.`);
          setIsVerifying(false);
          return;
        }

        onLogin(selected);
        setPassword('');
        handleClose();
        onShowToast(`Welcome, ${selected.name}! Signed in successfully.`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');

    const targetStaff = currentStaffList.find((s) => String(s.id) === changeStaffId);
    if (!targetStaff) {
      setChangeError('Please select a valid staff member.');
      return;
    }

    const expected = targetStaff.password || 'staff';
    if (changeCurrentPassword !== expected) {
      setChangeError('Current password does not match.');
      return;
    }

    if (!changeNewPassword.trim()) {
      setChangeError('Please enter a new password.');
      return;
    }

    if (changeNewPassword.length < 3) {
      setChangeError('New password must be at least 3 characters long.');
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      setChangeError('New password and confirm password do not match.');
      return;
    }

    const updatedList = currentStaffList.map((s) =>
      s.id === targetStaff.id ? { ...s, password: changeNewPassword.trim() } : s
    );

    try {
      await setDoc(doc(db, 'system_auth', 'staff_users'), {
        users: JSON.stringify(updatedList),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Error syncing new password to Firestore:', err);
    }

    if (onUpdateStaffPassword) {
      onUpdateStaffPassword(targetStaff.id, changeNewPassword.trim());
    }

    setCloudStaffList(updatedList);
    onShowToast(`✅ Password successfully updated for ${targetStaff.name}! Synced to all devices.`);
    setSelectedStaffId(String(targetStaff.id));
    setPassword('');
    setChangeCurrentPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setActiveView('LOGIN');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="bg-[#061122] text-white px-5 py-4 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              {activeView === 'CHANGE_PASSWORD' ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div>
              <span>
                {activeView === 'FORGOT_PASSWORD'
                  ? 'Password Assistance'
                  : activeView === 'CHANGE_PASSWORD'
                  ? 'Staff Password Change'
                  : 'Official Portal Login'}
              </span>
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

        {/* CHANGE PASSWORD VIEW */}
        {activeView === 'CHANGE_PASSWORD' ? (
          <form onSubmit={handleChangePasswordSubmit} className="p-5 md:p-6 space-y-4 text-xs animate-in fade-in duration-200">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Change Staff Password</span>
              </div>
              <p className="text-slate-600">
                New password will be immediately synced across all office computers and mobile devices.
              </p>
            </div>

            {changeError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select Staff Member <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={changeStaffId}
                onChange={(e) => {
                  setChangeStaffId(e.target.value);
                  setChangeError('');
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white shadow-2xs"
              >
                {activeStaffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.cadre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showChangeCurrent ? 'text' : 'password'}
                  required
                  placeholder="Enter your current password"
                  value={changeCurrentPassword}
                  onChange={(e) => setChangeCurrentPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowChangeCurrent(!showChangeCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showChangeCurrent ? 'Hide' : 'Show'}
                >
                  {showChangeCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showChangeNew ? 'text' : 'password'}
                  required
                  placeholder="Enter new password (min 3 chars)"
                  value={changeNewPassword}
                  onChange={(e) => setChangeNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowChangeNew(!showChangeNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showChangeNew ? 'Hide' : 'Show'}
                >
                  {showChangeNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showChangeConfirm ? 'text' : 'password'}
                  required
                  placeholder="Confirm new password"
                  value={changeConfirmPassword}
                  onChange={(e) => setChangeConfirmPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowChangeConfirm(!showChangeConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showChangeConfirm ? 'Hide' : 'Show'}
                >
                  {showChangeConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setChangeError('');
                  setActiveView('LOGIN');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>

              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2 px-4 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save New Password</span>
              </button>
            </div>
          </form>
        ) : activeView === 'FORGOT_PASSWORD' ? (
          <div className="p-6 space-y-5 text-xs animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                Contact Administrator
              </h4>
              <p className="text-[12px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                For security, staff passwords can be directly reset by the <strong>Administrator</strong>.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-50 via-amber-50/40 to-slate-50 border border-amber-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#061122] text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-amber-700 font-black uppercase tracking-wider">
                    Authorized Administrator
                  </div>
                  <div className="text-sm font-bold text-slate-950 truncate">
                    {currentAdmin.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {currentAdmin.cadre}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Contact Administrator Directly</span>
              </div>
              <p className="text-blue-800">
                Please contact the Administrator in person or through official office communication to reset or update your account password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('LOGIN')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          /* STANDARD LOGIN VIEW */
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                Records &amp; registers are directly viewable. Login is required for Section Staff &amp; Administrator operations.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Select Account Type</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setRole('STAFF');
                    setPassword('');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === 'STAFF'
                      ? 'bg-white text-blue-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Section Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('ADMIN');
                    setPassword('');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === 'ADMIN'
                      ? 'bg-[#061122] text-amber-400 shadow-sm border border-amber-500/40'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Administrator</span>
                </button>
              </div>
            </div>

            {role === 'STAFF' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Staff Member <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white shadow-2xs"
                >
                  {activeStaffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.cadre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#061122] text-amber-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{currentAdmin.name}</div>
                    <div className="text-[11px] text-slate-600">{currentAdmin.cadre}</div>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-300 uppercase">
                  Full Access
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {role === 'STAFF' && (
                    <button
                      type="button"
                      onClick={() => {
                        setChangeStaffId(selectedStaffId);
                        setActiveView('CHANGE_PASSWORD');
                      }}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      title="Change Staff Password"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>Change Password</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveView('FORGOT_PASSWORD')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Forgot?</span>
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={role === 'ADMIN' ? 'Enter administrator password' : 'Enter staff password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-2 text-xs bg-[#134674] hover:bg-[#0f3b63] disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In as {role === 'ADMIN' ? 'Administrator' : 'Staff Member'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};