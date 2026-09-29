import React, { useState } from 'react';
import { Megaphone, AlertCircle, FileCheck } from 'lucide-react';

interface NoticeTickerProps {
  notices?: string[];
}

export const NoticeTicker: React.FC<NoticeTickerProps> = () => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="w-full bg-[#040d1a] border-y border-amber-500/30 text-xs py-2 px-3 flex items-center gap-2 overflow-hidden shadow-inner select-none relative z-40">
      {/* Left Notice Badge */}
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black px-2.5 py-0.5 rounded-md shrink-0 shadow-sm z-10 text-[11px] uppercase tracking-wider">
        <Megaphone className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
        <span>OFFICIAL NOTICE</span>
      </div>

      {/* Slow Scrolling Container with Blink Highlights */}
      <div 
        className="flex-1 overflow-hidden relative cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        title="Mouse unchithe scroll aaguthundhi"
      >
        <div 
          className="inline-flex items-center whitespace-nowrap"
          style={{
            /* 65s tho scroll chala slow ga, clear ga chadavadaniki veeluga untundhi */
            animation: `marqueeSlow 50s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {/* Item 1: Bhu Bharati */}
          <span className="inline-flex items-center gap-2 mx-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ticker-dot-blink"></span>
            <span className="font-black text-amber-400 tracking-wide ticker-title-blink flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              BHU BHARATI:
            </span>
            <span className="text-white font-medium">
              All Tahsildars are strictly instructed to properly scrutinize, verify, and tag each Bhu Bharati file thoroughly, ensuring that each and every page of the record is duly attested and tagged properly before submission to RDO Office.
            </span>
          </span>

          {/* Item 2: Sadabainama */}
          <span className="inline-flex items-center gap-2 mx-10">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ticker-dot-blink"></span>
            <span className="font-black text-amber-400 tracking-wide ticker-title-blink flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              SADABAINAMA:
            </span>
            <span className="text-white font-medium">
              Immediate action is required on all pending Sadabainama regularisation files; Tahsildars must process and submit complete dossiers urgently.
            </span>
          </span>

          {/* Seamless Infinite Loop Duplicate */}
          <span className="inline-flex items-center gap-2 mx-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ticker-dot-blink"></span>
            <span className="font-black text-amber-400 tracking-wide ticker-title-blink flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              BHU BHARATI:
            </span>
            <span className="text-white font-medium">
              All Tahsildars are strictly instructed to properly scrutinize, verify, and tag each Bhu Bharati file thoroughly, ensuring that each and every page of the record is duly attested and tagged properly before submission to RDO Office.
            </span>
          </span>

          <span className="inline-flex items-center gap-2 mx-10">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ticker-dot-blink"></span>
            <span className="font-black text-amber-400 tracking-wide ticker-title-blink flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              SADABAINAMA:
            </span>
            <span className="text-white font-medium">
              Immediate action is required on all pending Sadabainama regularisation files; Tahsildars must process and submit complete dossiers urgently.
            </span>
          </span>
        </div>
      </div>

      {/* Styling & Blink Animations */}
      <style>{`
        @keyframes marqueeSlow {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .ticker-title-blink {
          animation: titleBlink 1.4s ease-in-out infinite alternate;
        }

        .ticker-dot-blink {
          animation: dotPulse 1s ease-in-out infinite alternate;
        }

        @keyframes titleBlink {
          0% {
            opacity: 1;
            text-shadow: 0 0 4px rgba(251, 191, 36, 0.4);
          }
          100% {
            opacity: 0.55;
            text-shadow: 0 0 12px rgba(251, 191, 36, 0.95);
          }
        }

        @keyframes dotPulse {
          0% {
            transform: scale(0.85);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.25);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};