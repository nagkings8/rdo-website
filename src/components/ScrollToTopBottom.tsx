import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const ScrollToTopBottom: React.FC = () => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Screen 200px kante ekkuva scroll ayinappudu buttons kanipisthayi
      if (window.scrollY > 200) {
        setShowButtons(true);
      } else {
        setShowButtons(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  if (!showButtons) return null;

  return (
    <div className="fixed right-4 bottom-14 z-50 flex flex-col gap-2 select-none animate-fade-in">
      {/* Direct Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="w-10 h-10 rounded-full bg-[#0b3323] hover:bg-[#134674] text-white shadow-xl border-2 border-emerald-400 flex items-center justify-center transition-all duration-200 transform hover:-translate-y-1 hover:scale-110 cursor-pointer active:scale-95"
        title="Direct ga Top ki Vellu (Scroll to Top)"
      >
        <ArrowUp className="w-5 h-5 text-amber-300" />
      </button>

      {/* Direct Scroll to Bottom Button */}
      <button
        onClick={scrollToBottom}
        className="w-10 h-10 rounded-full bg-[#0b3323] hover:bg-[#134674] text-white shadow-xl border-2 border-emerald-400 flex items-center justify-center transition-all duration-200 transform hover:translate-y-1 hover:scale-110 cursor-pointer active:scale-95"
        title="Direct ga Bottom ki Vellu (Scroll to Bottom)"
      >
        <ArrowDown className="w-5 h-5 text-amber-300" />
      </button>
    </div>
  );
};