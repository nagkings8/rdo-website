import React from 'react';
import { Building2, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-[#072418] via-[#0a2e1f] to-[#072418] text-emerald-200/90 py-4 px-6 flex flex-col items-center justify-center gap-1.5 text-center text-xs border-t-2 border-emerald-600/60 shadow-lg mt-auto">
      {/* Top Office & Department Details */}
      <div className="flex items-center justify-center gap-2 flex-wrap font-medium">
        <span className="flex items-center gap-1.5 font-bold text-white">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Revenue Divisional Office, Huzurnagar</span>
        </span>
        <span className="text-emerald-500">•</span>
        <span>D Section File Tracking &amp; Management System</span>
        <span className="text-emerald-500">•</span>
        <span className="text-emerald-300 font-bold">Govt. of Telangana</span>
      </div>

      {/* Developer & Typist Credits */}
      <div className="text-emerald-100 font-medium pt-0.5">
        Designed &amp; Developed by{' '}
        <span className="text-amber-300 font-bold">Rupavath Nagaraju</span>{' '}
        <span className="text-emerald-300/80">(Typist-cum-Computer Operator)</span>
      </div>

      {/* Subtle Transparency & Year Strip */}
      <div className="text-[10.5px] text-emerald-400/70 pt-1 border-t border-emerald-800/40 w-full max-w-xl flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Designed for a Transparent &amp; Efficient Government • © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
};