import React from 'react';
import { 
  Home, 
  FolderOpen, 
  Mail, 
  FileSpreadsheet, 
  Scale, 
  Clock, 
  ShieldCheck,
  X
} from 'lucide-react';
import { StaffUser } from '../types';

export type ActiveTab = 
  | 'dashboardTab' 
  | 'bhuBharatiTab' 
  | 'tapalTab' 
  | 'sadabainamaTab' 
  | 'appealCasesTab' 
  | 'rdoPendencyTab' 
  | 'adminTab';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser?: StaffUser | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  // Exactly matched color mapping for both Sidebar & Dashboard cards
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    iconBg: string;
    activeBg: string;
    activeText: string;
    hoverText: string;
    badgeColor?: string;
  }> = [
    { 
      id: 'dashboardTab', 
      label: 'Home Dashboard', 
      icon: Home,
      iconBg: 'bg-emerald-600 text-white',
      activeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-900/40',
      activeText: 'text-slate-950 font-black',
      hoverText: 'hover:text-emerald-300'
    },
    { 
      id: 'bhuBharatiTab', 
      label: 'Bhu Bharati Files', 
      icon: FolderOpen,
      iconBg: 'bg-emerald-600 text-white',
      activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/40',
      activeText: 'text-white font-black',
      hoverText: 'hover:text-emerald-300'
    },
    { 
      id: 'tapalTab', 
      label: 'Tapal Register', 
      icon: Mail,
      iconBg: 'bg-amber-500 text-slate-950',
      activeBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-900/40',
      activeText: 'text-slate-950 font-black',
      hoverText: 'hover:text-amber-300'
    },
    { 
      id: 'sadabainamaTab', 
      label: 'Sadabainama', 
      icon: FileSpreadsheet,
      iconBg: 'bg-teal-600 text-white',
      activeBg: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-teal-900/40',
      activeText: 'text-white font-black',
      hoverText: 'hover:text-teal-300'
    },
    { 
      id: 'appealCasesTab', 
      label: 'Appeal Cases', 
      icon: Scale,
      iconBg: 'bg-[#165bb5] text-white',
      activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/40',
      activeText: 'text-white font-black',
      hoverText: 'hover:text-blue-300'
    },
    { 
      id: 'rdoPendencyTab', 
      label: 'RDO Pendency', 
      icon: Clock,
      iconBg: 'bg-purple-700 text-white',
      activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-purple-900/40',
      activeText: 'text-white font-black',
      hoverText: 'hover:text-purple-300'
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'adminTab',
      label: 'Admin Control',
      icon: ShieldCheck,
      iconBg: 'bg-amber-400 text-slate-950',
      activeBg: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-amber-900/40',
      activeText: 'text-slate-950 font-black',
      hoverText: 'hover:text-amber-300',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
    });
  }

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between py-2">
      <div>
        <div className="px-4 py-3 mb-2 flex items-center justify-between border-b border-emerald-800/40">
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
            Navigation Menu
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-2 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer group text-left ${
                  isActive
                    ? `${item.activeBg} shadow-md translate-x-1.5 ring-1 ring-white/30`
                    : `text-slate-200 hover:bg-white/10 ${item.hoverText}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-xs ${item.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`truncate text-xs ${isActive ? item.activeText : 'font-bold'}`}>
                    {item.label}
                  </span>
                </div>

                {item.badgeColor && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${item.badgeColor}`}>
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 m-3 bg-[#051c13] rounded-xl border border-emerald-700/40 text-[10.5px] text-emerald-200 text-center shadow-inner">
        <div className="font-bold text-white mb-0.5">RDO Huzurnagar Portal</div>
        <div className="opacity-80 text-[10px]">Suryapet District, TS</div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#072418] border-r border-emerald-600/30 min-h-[calc(100vh-120px)] sticky top-[72px] shadow-sm select-none">
        {navContent}
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#072418] h-full shadow-2xl flex flex-col z-10 border-r border-emerald-500/40 animate-slide-right select-none">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};