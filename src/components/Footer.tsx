import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#061122] text-slate-300 py-4 px-6 flex flex-col items-center justify-center gap-1 text-center text-xs border-t-2 border-amber-500/30 shadow-lg mt-auto">
      <div className="flex items-center justify-center gap-2 flex-wrap font-medium text-slate-300">
        <span>Revenue Divisional Office, Huzurnagar</span>
        <span className="text-slate-500">•</span>
        <span>D Section File Tracking &amp; Management System</span>
        <span className="text-slate-500">•</span>
        <span>Govt. of Telangana</span>
      </div>
      <div className="text-slate-300 font-medium">
        Designed &amp; Developed by{' '}
        <span className="text-amber-400 font-bold">Rupavath Nagaraju</span>{' '}
        <span className="text-slate-400">(Typist-cum-Computer Operator)</span>
      </div>
    </footer>
  );
};
