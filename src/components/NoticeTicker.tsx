import React from 'react';
import { Megaphone, AlertCircle } from 'lucide-react';

export const NoticeTicker: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y border-amber-500/40 py-1.5 px-3 flex items-center overflow-hidden shadow-inner">
      {/* Static Glow Label */}
      <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 z-10 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
        <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse" />
        <span>OFFICIAL NOTICE:</span>
      </div>

      {/* Marquee Content */}
      <div className="relative w-full overflow-hidden ml-3">
        <div className="animate-marquee flex items-center gap-8 cursor-pointer font-medium text-xs sm:text-sm">
          
          {/* Instruction 1: Bhu Bharati */}
          <span className="inline-flex items-center gap-2 text-white font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
            <span>
              <strong className="text-amber-300">BHU BHARATI:</strong> All Tahsildars are strictly instructed to properly scrutinize, tag, and verify each Bhu Bharati file thoroughly, ensuring that each and every page of the record is duly attested before submission to RDO Office.
            </span>
          </span>

          <span className="text-amber-500/60 font-bold">•</span>

          {/* Instruction 2: Sadabainama */}
          <span className="inline-flex items-center gap-2 text-white font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span>
              <strong className="text-amber-300">SADABAINAMA:</strong> Immediate action is required on all pending Sadabainama regularisation files; Tahsildars must process and submit complete dossiers urgently.
            </span>
          </span>

        </div>
      </div>
    </div>
  );
};