import React, { useState, useEffect } from 'react';
import { StaffUser } from '../../types';
import { X, UserPlus, Phone, Lock, Eye, EyeOff } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: StaffUser) => void;
  onShowToast: (msg: string) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onShowToast,
}) => {
  const [name, setName] = useState('');
  const [cadre, setCadre] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCadre('');
      setPhone('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cadre.trim()) {
      onShowToast('Please enter both staff name and cadre.');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      onShowToast('Please provide a mobile phone number for staff communication.');
      return;
    }

    const newUser: StaffUser = {
      id: Date.now(),
      name: name.trim(),
      role: 'STAFF',
      cadre: cadre.trim(),
      phone: cleanPhone,
      password: password.trim() || 'staff',
      active: true,
    };

    onSave(newUser);
    setName('');
    setCadre('');
    setPhone('');
    setPassword('');
    onClose();
    onShowToast(`Staff account for ${newUser.name} created successfully!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in duration-150">
        <div className="bg-[#061122] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-amber-500">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <span>Add Staff Account</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Staff Member Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. K. Ramesh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Cadre / Designation <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Junior Assistant / Typist"
              value={cadre}
              onChange={(e) => setCadre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mobile Phone Number <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9848012345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-2xs font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Initial Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none shadow-2xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Set a secure password for this account. Admin can update or reset it anytime.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Save Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
