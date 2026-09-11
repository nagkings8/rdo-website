import React, { useState, useMemo } from 'react';
import { InwardTapal, OutwardDespatch, MANDAL_LIST, StaffUser } from '../types';
import { Search, RotateCcw, Download, PlusCircle, Send, FileText, RefreshCw, Trash2, Link as LinkIcon, Printer, Mail, CheckCircle2, Clock, Building2, Eye } from 'lucide-react';
import { exportInwardToCSV, exportOutwardToCSV } from '../utils/storage';
import { printTableReport } from '../utils/printReport';

interface TapalRegisterViewProps {
  inwards: InwardTapal[];
  outwards: OutwardDespatch[];
  initialInwardStatus?: string;
  initialOutwardSentTo?: string;
  currentUser?: StaffUser | null;
  onNewInward: () => void;
  onEditInward?: (tapal: InwardTapal) => void;
  onNewOutward: (linkedInwardId?: number) => void;
  onEditOutward?: (outward: OutwardDespatch) => void;
  onUpdateInwardStatus: (tapal: InwardTapal) => void;
  onViewInwardPdf: (tapal: InwardTapal) => void;
  onViewOutwardPdf: (outward: OutwardDespatch) => void;
  onDeleteInward: (tapal: InwardTapal) => void;
  onDeleteOutward: (outward: OutwardDespatch) => void;
}

export const TapalRegisterView: React.FC<TapalRegisterViewProps> = ({
  inwards,
  outwards,
  initialInwardStatus = '',
  initialOutwardSentTo = '',
  currentUser,
  onNewInward,
  onEditInward,
  onNewOutward,
  onEditOutward,
  onUpdateInwardStatus,
  onViewInwardPdf,
  onViewOutwardPdf,
  onDeleteInward,
  onDeleteOutward,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isViewer = !currentUser || currentUser?.role === 'VIEWER';
  // Inward filters
  const [inwardSearch, setInwardSearch] = useState('');
  const [inwardMandal, setInwardMandal] = useState('');
  const [inwardStatus, setInwardStatus] = useState(initialInwardStatus);

  // Outward filters
  const [outwardSearch, setOutwardSearch] = useState('');
  const [outwardSentTo, setOutwardSentTo] = useState(initialOutwardSentTo);
  const [outwardMode, setOutwardMode] = useState('');
  const [outwardSource, setOutwardSource] = useState('');

  const tapalStats = useMemo(() => {
    const totalInward = inwards.length;
    const inwardScrutiny = inwards.filter((i) => i.status === 'Under Scrutiny').length;
    const inwardDisposed = inwards.filter((i) => i.status === 'Disposed').length;
    const totalOutward = outwards.length;
    const outwardCollectorate = outwards.filter((o) => (o.sentTo || '').includes('Collectorate')).length;
    const outwardMro = outwards.filter((o) => (o.sentTo || '').includes('MRO')).length;
    return {
      totalInward,
      inwardScrutiny,
      inwardDisposed,
      totalOutward,
      outwardCollectorate,
      outwardMro,
    };
  }, [inwards, outwards]);

  const filteredInwards = useMemo(() => {
    return inwards.filter((t) => {
      const q = inwardSearch.toLowerCase();
      const matchSearch =
        (t.inwardNo || '').toLowerCase().includes(q) ||
        (t.sender || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q);
      const matchMandal = inwardMandal === '' || t.mandal === inwardMandal;
      const matchStatus = inwardStatus === '' || t.status === inwardStatus;
      return matchSearch && matchMandal && matchStatus;
    });
  }, [inwards, inwardSearch, inwardMandal, inwardStatus]);

  const filteredOutwards = useMemo(() => {
    return outwards.filter((o) => {
      const q = outwardSearch.toLowerCase();
      const matchSearch =
        (o.outwardNo || '').toLowerCase().includes(q) ||
        (o.sentTo || '').toLowerCase().includes(q) ||
        (o.subject || '').toLowerCase().includes(q);
      const matchSentTo = outwardSentTo === '' || (o.sentTo || '').includes(outwardSentTo);
      const matchMode = outwardMode === '' || o.mode === outwardMode;
      const matchSource =
        outwardSource === '' ||
        (outwardSource === 'INWARD_LINKED' && (o.entryType === 'INWARD_LINKED' || o.linkedInwardNo)) ||
        (outwardSource === 'FRESH' && o.entryType === 'FRESH');
      return matchSearch && matchSentTo && matchMode && matchSource;
    });
  }, [outwards, outwardSearch, outwardSentTo, outwardMode, outwardSource]);

  const getStatusBadge = (status: string) => {
    if (status === 'Disposed') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const getSentToBadge = (sentTo: string) => {
    if ((sentTo || '').includes('Collectorate')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if ((sentTo || '').includes('MRO')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  const handlePrintInwards = () => {
    const tableHeader = `
      <tr>
        <th style="width: 35px; background: #164875; color: #fff;">S.No</th>
        <th style="background: #164875; color: #fff;">Inward / Tapal No</th>
        <th style="background: #164875; color: #fff;">Received Date</th>
        <th style="background: #164875; color: #fff;">Sender / Office</th>
        <th style="background: #164875; color: #fff;">Mandal</th>
        <th style="background: #164875; color: #fff;">Revenue Village</th>
        <th style="background: #164875; color: #fff;">Subject / Particulars</th>
        <th style="background: #164875; color: #fff;">Current Status</th>
      </tr>
    `;

    const tableRows = filteredInwards.map((t, i) => `
      <tr>
        <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 5px;">${i + 1}</td>
        <td style="font-weight: bold; border: 1px solid #94a3b8; padding: 5px;">${t.inwardNo}</td>
        <td style="text-align: center; border: 1px solid #94a3b8; padding: 5px;">${t.receivedDate}</td>
        <td style="border: 1px solid #94a3b8; padding: 5px;">${t.sender}</td>
        <td style="border: 1px solid #94a3b8; padding: 5px;">${t.mandal || 'GENERAL'}</td>
        <td style="border: 1px solid #94a3b8; padding: 5px;">${t.village || 'General / Division'}</td>
        <td style="border: 1px solid #94a3b8; padding: 5px;">${t.subject}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 5px;">${t.status}</td>
      </tr>
    `).join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>${tableHeader}</thead>
        <tbody>${tableRows}</tbody>
        <tfoot>
          <tr style="background-color: #e2e8f0; font-weight: bold;">
            <td colspan="8" style="padding: 6px 8px; text-align: left; border: 1px solid #64748b;">
              Total Inward Records: ${filteredInwards.length} entry(ies)
              ${inwardMandal ? ` • Mandal: ${inwardMandal}` : ''}
              ${inwardStatus ? ` • Status: ${inwardStatus}` : ''}
            </td>
          </tr>
        </tfoot>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Inward Tapal Register',
      subtitle: 'Revenue Divisional Office, Huzurnagar • Suryapet District',
      period: 'Official Inward Correspondence Register',
      landscape: true,
    });
  };

  const handlePrintOutwards = () => {
    const tableHeader = `
      <tr>
        <th style="width: 35px; background: #164875; color: #fff;">S.No</th>
        <th style="background: #164875; color: #fff;">Outward Despatch No</th>
        <th style="background: #164875; color: #fff;">Dispatched Date</th>
        <th style="background: #164875; color: #fff;">Recipient / Sent To</th>
        <th style="background: #164875; color: #fff;">Subject / File Reference</th>
        <th style="background: #164875; color: #fff;">Dispatch Mode</th>
        <th style="background: #164875; color: #fff;">Linked Inward No</th>
      </tr>
    `;

    const tableRows = filteredOutwards.map((o, i) => `
      <tr>
        <td style="text-align: center; font-weight: bold; border: 1px solid #94a3b8; padding: 5px;">${i + 1}</td>
        <td style="font-weight: bold; border: 1px solid #94a3b8; padding: 5px;">${o.outwardNo}</td>
        <td style="text-align: center; border: 1px solid #94a3b8; padding: 5px;">${o.despatchedDate}</td>
        <td style="font-weight: bold; border: 1px solid #94a3b8; padding: 5px;">${o.sentTo}</td>
        <td style="border: 1px solid #94a3b8; padding: 5px;">${o.subject}</td>
        <td style="text-align: center; border: 1px solid #94a3b8; padding: 5px;">${o.mode}</td>
        <td style="text-align: center; border: 1px solid #94a3b8; padding: 5px;">${o.linkedInwardNo || '-'}</td>
      </tr>
    `).join('');

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>${tableHeader}</thead>
        <tbody>${tableRows}</tbody>
        <tfoot>
          <tr style="background-color: #e2e8f0; font-weight: bold;">
            <td colspan="7" style="padding: 6px 8px; text-align: left; border: 1px solid #64748b;">
              Total Outward Records: ${filteredOutwards.length} entry(ies)
              ${outwardSentTo ? ` • Sent To: ${outwardSentTo}` : ''}
              ${outwardMode ? ` • Mode: ${outwardMode}` : ''}
            </td>
          </tr>
        </tfoot>
      </table>
    `;

    printTableReport(tableHtml, {
      title: 'Outward Despatch Register',
      subtitle: 'Revenue Divisional Office, Huzurnagar • Suryapet District',
      period: 'Official Outward Despatch Register',
      landscape: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* TOP DASHBOARD BANNER (MATCHING APPEAL CASES STYLE) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#0d1d36] via-[#163a69] to-[#0d1d36] text-white p-5 md:p-6 rounded-2xl shadow-xl border-t-2 border-amber-400 relative overflow-hidden">
        {/* Top ambient glass reflection */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-lg shadow-amber-950/40 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0a1b33] rounded-[14px] flex items-center justify-center text-amber-300">
                <Mail className="w-6 h-6 md:w-7 md:h-7" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md shadow-xs">
                  Tapal Section
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 rounded-md border border-blue-400/30">
                  Inward &amp; Outward Despatch
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  D Section • Revenue Divisional Office, Huzurnagar
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide text-white drop-shadow-sm">
                OFFICIAL TAPAL &amp; CORRESPONDENCE REGISTER
              </h1>
              <p className="text-xs text-blue-100 font-medium max-w-3xl">
                Real-time tracking of Inward Representations, Collectorate References, Tahsildar Enquiries &amp; Outward Despatches
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
                Inward Tapal Cleared
              </div>
              <div className="text-lg font-black text-white leading-none">
                {tapalStats.inwardDisposed}{' '}
                <span className="text-xs font-medium text-blue-200">
                  / {tapalStats.totalInward} Letters Disposed ({tapalStats.totalInward ? Math.round((tapalStats.inwardDisposed / tapalStats.totalInward) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUMMARY STAT CARDS (5 GLOSSY & COLORFUL CARDS) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Inward Tapals */}
        <div
          onClick={() => setInwardStatus('')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            inwardStatus === ''
              ? 'bg-gradient-to-br from-blue-50/90 via-white to-blue-100/40 border-2 border-blue-600 shadow-[0_12px_24px_-6px_rgba(37,99,235,0.3)] ring-2 ring-blue-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-blue-400 hover:shadow-[0_14px_28px_-6px_rgba(37,99,235,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">
              Total Inward
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-blue-950 group-hover:text-blue-600 group-hover:scale-105 origin-left transition-all duration-300">
            {tapalStats.totalInward}
          </div>
          <p className="relative z-10 text-[11px] text-blue-700 font-semibold mt-0.5">
            Letters &amp; files received →
          </p>
        </div>

        {/* Card 2: Under Scrutiny */}
        <div
          onClick={() => setInwardStatus(inwardStatus === 'Under Scrutiny' ? '' : 'Under Scrutiny')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            inwardStatus === 'Under Scrutiny'
              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 border-2 border-amber-500 shadow-[0_12px_24px_-6px_rgba(217,119,6,0.3)] ring-2 ring-amber-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-amber-400 hover:shadow-[0_14px_28px_-6px_rgba(217,119,6,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Under Scrutiny
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors duration-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-amber-700 group-hover:text-amber-600 group-hover:scale-105 origin-left transition-all duration-300">
            {tapalStats.inwardScrutiny}
          </div>
          <p className="relative z-10 text-[11px] text-amber-700 font-semibold mt-0.5">
            Active examination in seat →
          </p>
        </div>

        {/* Card 3: Inward Disposed */}
        <div
          onClick={() => setInwardStatus(inwardStatus === 'Disposed' ? '' : 'Disposed')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            inwardStatus === 'Disposed'
              ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/40 border-2 border-emerald-600 shadow-[0_12px_24px_-6px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Inward Disposed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-emerald-700 group-hover:text-emerald-600 group-hover:scale-105 origin-left transition-all duration-300">
            {tapalStats.inwardDisposed}
          </div>
          <p className="relative z-10 text-[11px] text-emerald-700 font-semibold mt-0.5">
            Disposed with replies →
          </p>
        </div>

        {/* Card 4: Total Outward Despatch */}
        <div
          onClick={() => {
            setOutwardSentTo('');
            setOutwardMode('');
            setOutwardSource('');
          }}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 ${
            outwardSentTo === ''
              ? 'bg-gradient-to-br from-purple-50/90 via-white to-purple-100/40 border-2 border-purple-600 shadow-[0_12px_24px_-6px_rgba(147,51,234,0.3)] ring-2 ring-purple-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-purple-400 hover:shadow-[0_14px_28px_-6px_rgba(147,51,234,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
              Outward Despatch
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-purple-700 group-hover:text-purple-600 group-hover:scale-105 origin-left transition-all duration-300">
            {tapalStats.totalOutward}
          </div>
          <p className="relative z-10 text-[11px] text-purple-700 font-semibold mt-0.5">
            Official letters sent →
          </p>
        </div>

        {/* Card 5: Collectorate & MROs */}
        <div
          onClick={() => setOutwardSentTo(outwardSentTo === 'Collectorate' ? '' : 'Collectorate')}
          className={`group relative overflow-hidden backdrop-blur-md rounded-2xl p-4.5 cursor-pointer transition-all duration-300 col-span-2 sm:col-span-1 ${
            outwardSentTo === 'Collectorate' || outwardSentTo === 'MRO'
              ? 'bg-gradient-to-br from-teal-50/90 via-white to-teal-100/40 border-2 border-teal-600 shadow-[0_12px_24px_-6px_rgba(20,184,166,0.3)] ring-2 ring-teal-500/30 -translate-y-1'
              : 'bg-gradient-to-br from-white via-white/95 to-slate-50/60 border border-slate-200/90 hover:border-teal-400 hover:shadow-[0_14px_28px_-6px_rgba(20,184,166,0.25)] hover:-translate-y-1.5'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 via-white/15 to-transparent pointer-events-none rounded-t-2xl" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800">
              Collectorate &amp; MRO
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10 text-3xl font-black text-teal-700 group-hover:text-teal-600 group-hover:scale-105 origin-left transition-all duration-300">
            {tapalStats.outwardCollectorate + tapalStats.outwardMro}
          </div>
          <p className="relative z-10 text-[11px] text-teal-700 font-semibold mt-0.5">
            {tapalStats.outwardCollectorate} Coll • {tapalStats.outwardMro} MROs →
          </p>
        </div>
      </div>

      {/* SECTION 1: INWARD TAPAL REGISTER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Inward Tapal Register</h2>
            <p className="text-xs font-semibold text-slate-500">
              Record of letters, representations, and official correspondence received in D Section
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <>
                <button
                  onClick={handlePrintInwards}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Print Inward Tapal Table"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-300" />
                  <span>Print Inward Register</span>
                </button>
                <button
                  onClick={() => exportInwardToCSV(inwards)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Inward (CSV)</span>
                </button>
                <button
                  onClick={onNewInward}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Inward Entry</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inward Filters */}
        <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Inward No / Sender / Subject..."
              value={inwardSearch}
              onChange={(e) => setInwardSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={inwardMandal}
            onChange={(e) => setInwardMandal(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Mandals</option>
            <option value="GENERAL / DIVISION">GENERAL / DIVISION</option>
            {MANDAL_LIST.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={inwardStatus}
            onChange={(e) => setInwardStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Under Scrutiny">Under Scrutiny</option>
            <option value="Disposed">Disposed</option>
          </select>

          <button
            onClick={() => {
              setInwardSearch('');
              setInwardMandal('');
              setInwardStatus('');
            }}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Inward Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse bg-white">
            <thead className="bg-slate-50 text-slate-900 uppercase font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200">Inward / Tapal No</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Received Date</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Sender / Office</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Mandal</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Revenue Village</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Subject / Particulars</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Status</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Document</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInwards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No matching Inward Tapal records found.
                  </td>
                </tr>
              ) : (
                filteredInwards.map((tapal) => (
                  <tr key={tapal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                      {tapal.inwardNo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      {tapal.receivedDate}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-200">
                      <div>{tapal.sender}</div>
                      {tapal.returnHistory && tapal.returnHistory.length > 0 && (
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                          ↺ Returned: {tapal.returnHistory[tapal.returnHistory.length - 1].from}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                      {tapal.mandal}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {tapal.village || 'General / Division'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 border-r border-slate-200">
                      <div>{tapal.subject}</div>
                      {tapal.remarks && (
                        <div className="text-[10.5px] text-slate-500 italic mt-0.5">Note: {tapal.remarks}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          tapal.status
                        )}`}
                      >
                        {tapal.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      {tapal.hasAttachment || tapal.fileAttachment ? (
                        <button
                          onClick={() => onViewInwardPdf(tapal)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                          title="View Date-Stamped Inward Document"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View PDF</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">No File</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => (onEditInward ? onEditInward(tapal) : onUpdateInwardStatus(tapal))}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                              title="Edit Inward / Update Returned File Details"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Edit / Return</span>
                            </button>
                            <button
                              onClick={() => onNewOutward(tapal.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-0.5 transition cursor-pointer shadow-xs"
                              title="Create Outward Despatch from Inward"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Despatch</span>
                            </button>
                          </>
                        )}

                        {/* Delete Inward: ADMIN ONLY */}
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteInward(tapal)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-1 rounded text-[11px] transition cursor-pointer shadow-xs"
                            title="Delete Inward Record (Administrator Only)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: OUTWARD DESPATCH REGISTER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Outward Despatch Register</h2>
            <p className="text-xs font-semibold text-slate-500">
              Record of letters, files, and reports dispatched from D Section, RDO Office
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <>
                <button
                  onClick={handlePrintOutwards}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Print Outward Despatch Table"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-300" />
                  <span>Print Outward Register</span>
                </button>
                <button
                  onClick={() => exportOutwardToCSV(outwards)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Outward (CSV)</span>
                </button>
                <button
                  onClick={() => onNewOutward()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Record Outward Despatch</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Outward Filters */}
        <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Despatch No / Recipient / Subject..."
              value={outwardSearch}
              onChange={(e) => setOutwardSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={outwardSentTo}
            onChange={(e) => setOutwardSentTo(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Recipients / Dispatched To</option>
            <option value="Forwarded to MRO">Forwarded to MRO</option>
            <option value="Forwarded to Collectorate">Forwarded to Collectorate</option>
            <option value="Endorsement to Applicant">Endorsement to Applicant</option>
          </select>

          <select
            value={outwardMode}
            onChange={(e) => setOutwardMode(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Dispatch Modes</option>
            <option value="Official Email / e-Office">Official Email / e-Office</option>
            <option value="Special Messenger / By Hand">Special Messenger / By Hand</option>
            <option value="Registered Post / Speed Post">Registered Post / Speed Post</option>
            <option value="Ordinary Post">Ordinary Post</option>
          </select>

          <select
            value={outwardSource}
            onChange={(e) => setOutwardSource(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Dispatch Types</option>
            <option value="INWARD_LINKED">Inward-Linked Correspondence</option>
            <option value="FRESH">Fresh / Direct Despatches</option>
          </select>

          <button
            onClick={() => {
              setOutwardSearch('');
              setOutwardSentTo('');
              setOutwardMode('');
              setOutwardSource('');
            }}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Outward Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse bg-white">
            <thead className="bg-slate-50 text-slate-900 uppercase font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200">Despatch No</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Despatch Date</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Despatch Type / Source</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Dispatched To</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Subject / Reference</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Mode</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Document</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Remarks</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOutwards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No matching Outward Despatches found.
                  </td>
                </tr>
              ) : (
                filteredOutwards.map((o) => {
                  const isLinked = o.entryType === 'INWARD_LINKED' || o.linkedInwardNo;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {o.outwardNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap">
                        {o.outwardDate}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        {isLinked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span>Inward: {o.linkedInwardNo || 'Linked'}</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Fresh Entry
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${getSentToBadge(
                            o.sentTo
                          )}`}
                        >
                          {o.sentTo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 border-r border-slate-200">
                        {o.subject}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                          {o.mode || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        {o.hasAttachment || o.fileAttachment ? (
                          <button
                            onClick={() => onViewOutwardPdf(o)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                            title="View Date-Stamped Outward Despatch"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View PDF</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">No File</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200">
                        {o.remarks || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isViewer && onEditOutward && (
                            <button
                              onClick={() => onEditOutward(o)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                              title="Edit Outward Despatch Record"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteOutward(o)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-1 rounded text-[11px] transition cursor-pointer shadow-xs"
                              title="Delete Despatch Record (Administrator Only)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          {isViewer && !isAdmin && (
                            <span className="text-[11px] text-slate-400">-</span>
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
      </div>
    </div>
  );
};
