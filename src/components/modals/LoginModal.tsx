import React, { useState, useEffect, useRef } from 'react';
import { StaffUser, AdminProfile } from '../../types';
import { 
  X, 
  Lock, 
  UserCheck, 
  ShieldCheck, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2, 
  Phone, 
  Smartphone, 
  Check 
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { db, auth } from '../../utils/firebase';

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
  const [activeView, setActiveView] = useState<'LOGIN' | 'FORGOT_PASSWORD'>('LOGIN');

  // OTP Self-Reset State
  const [forgotStaffId, setForgotStaffId] = useState<string>(
    staff[0]?.id ? String(staff[0].id) : ''
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNew, setShowResetNew] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [cloudStaffList, setCloudStaffList] = useState<StaffUser[]>(staff);
  const [cloudAdminProfile, setCloudAdminProfile] = useState<AdminProfile>(adminProfile);

  // Firestore Sync
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
      setForgotStaffId(String(staff[0].id));
    }
  }, [staff, selectedStaffId]);

  if (!isOpen) return null;

  const currentStaffList = cloudStaffList.length > 0 ? cloudStaffList : staff;
  const currentAdmin = cloudAdminProfile || adminProfile;
  const activeStaffList = currentStaffList.filter((s) => s.active);

  const handleClose = () => {
    setActiveView('LOGIN');
    setPassword('');
    setOtpSent(false);
    setOtpCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {}
      recaptchaVerifierRef.current = null;
    }
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
          console.warn(fetchErr);
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
        onShowToast(`Welcome, ${currentAdmin.name}! Signed in successfully.`);
      } else {
        let activeList = currentStaffList;
        try {
          const staffSnap = await getDoc(doc(db, 'system_auth', 'staff_users'));
          if (staffSnap.exists() && staffSnap.data()?.users) {
            activeList = JSON.parse(staffSnap.data().users);
          }
        } catch (fetchErr) {
          console.warn(fetchErr);
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

  // Send OTP to Registered Mobile Number
  const handleSendOtp = async () => {
    const target = currentStaffList.find((s) => String(s.id) === forgotStaffId);
    if (!target) {
      onShowToast('Please select your staff profile.');
      return;
    }

    if (!target.phone || target.phone.trim().length < 10) {
      onShowToast('⚠️ Mobile number not registered for this staff. Please contact Admin.');
      return;
    }

    const cleanPhone = target.phone.trim().replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 
      ? `+${cleanPhone}` 
      : `+91${cleanPhone.slice(-10)}`;

    try {
      setIsSendingOtp(true);
      onShowToast(`Sending SMS OTP to ${target.phone.slice(0, 3)}****${target.phone.slice(-3)}...`);

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      onShowToast('✅ 6-digit OTP sent successfully via SMS!');
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
      onShowToast('Failed to send SMS OTP. Please check your internet or contact Admin.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP & Save New Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      onShowToast('OTP verification session expired. Please request OTP again.');
      return;
    }

    if (!otpCode.trim() || otpCode.length < 6) {
      onShowToast('Please enter the 6-digit OTP received on your mobile.');
      return;
    }

    if (!resetNewPassword.trim() || resetNewPassword.length < 3) {
      onShowToast('New password must be at least 3 characters.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      onShowToast('New password and confirm password do not match.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      await confirmationResult.confirm(otpCode.trim());

      const target = currentStaffList.find((s) => String(s.id) === forgotStaffId);
      if (!target) return;

      const updatedList = currentStaffList.map((s) =>
        s.id === target.id ? { ...s, password: resetNewPassword.trim() } : s
      );

      await setDoc(doc(db, 'system_auth', 'staff_users'), {
        users: JSON.stringify(updatedList),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (onUpdateStaffPassword) {
        onUpdateStaffPassword(target.id, resetNewPassword.trim());
      }

      setCloudStaffList(updatedList);
      onShowToast(`✅ Password reset successful for ${target.name}! You can now login.`);
      setSelectedStaffId(String(target.id));
      setPassword('');
      handleClose();
    } catch (err: any) {
      console.error('OTP verify err:', err);
      onShowToast('❌ Invalid OTP. Please enter the correct code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 overflow-y-auto">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all my-6">
        {/* Header */}
        <div className="bg-[#061122] text-white px-5 py-4 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              {activeView === 'FORGOT_PASSWORD' ? (
                <Smartphone className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <span>
              {activeView === 'FORGOT_PASSWORD'
                ? 'Password Recovery (SMS OTP & Admin)'
                : 'Official Portal Login'}
            </span>
          </h3>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORGOT PASSWORD VIEW */}
        {activeView === 'FORGOT_PASSWORD' ? (
          <div className="p-5 md:p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            {/* OPTION 1: Mobile OTP */}
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
                <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Option 1: Reset via Free Mobile SMS OTP</span>
              </div>

              {!otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Select Your Staff Profile <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={forgotStaffId}
                      onChange={(e) => setForgotStaffId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    >
                      {activeStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.phone ? `${s.phone.slice(0, 3)}****${s.phone.slice(-3)}` : 'No Phone'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={handleSendOtp}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending SMS...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-3.5 h-3.5" />
                        <span>Send Free OTP to My Mobile</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Enter 6-Digit SMS OTP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123456"
                      value={otpCode}
                      maxLength={6}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-mono font-bold tracking-widest text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showResetNew ? 'text' : 'password'}
                        required
                        placeholder="Enter new password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNew(!showResetNew)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showResetNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showResetNew ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-lg text-xs"
                    >
                      Resend
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify &amp; Save Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* OPTION 2: Contact Admin Directly */}
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 border-b border-amber-200 pb-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Option 2: Contact Administrator Directly</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                If mobile number is not registered or SMS is delayed, the Administrator can reset your password directly from the Admin Panel.
              </p>
              
              <div className="bg-white border border-amber-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Authorized Administrator</div>
                  <div className="text-xs font-bold text-slate-900">{currentAdmin.name}</div>
                  <div className="text-[11px] text-slate-600">{currentAdmin.cadre}</div>
                </div>
                {currentAdmin.phone && (
                  <a
                    href={`tel:${currentAdmin.phone}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-xs transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Admin</span>
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('LOGIN')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          /* STANDARD LOGIN VIEW */
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                Registers are open to view. Login is required for Section Staff &amp; Administrator entries.
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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:outline-none bg-white shadow-2xs"
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
                <button
                  type="button"
                  onClick={() => {
                    setForgotStaffId(selectedStaffId);
                    setOtpSent(false);
                    setOtpCode('');
                    setActiveView('FORGOT_PASSWORD');
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  <span>Forgot / Reset via OTP?</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={role === 'ADMIN' ? 'Enter administrator password' : 'Enter staff password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none shadow-2xs text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  <span>Signing In...</span>
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