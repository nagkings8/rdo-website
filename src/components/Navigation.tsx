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

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badgeColor?: string;
  }> = [
    { id: 'dashboardTab', label: 'Home Dashboard', icon: Home },
    { id: 'bhuBharatiTab', label: 'Bhu Bharati Files', icon: FolderOpen },
    { id: 'tapalTab', label: 'Tapal Register', icon: Mail },
    { id: 'sadabainamaTab', label: 'Sadabainama', icon: FileSpreadsheet },
    { id: 'appealCasesTab', label: 'Appeal Cases', icon: Scale },
    { id: 'rdoPendencyTab', label: 'RDO Pendency', icon: Clock },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'adminTab',
      label: 'Admin Control',
      icon: ShieldCheck,
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
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="px-4 py-3 mb-2 flex items-center justify-between border-b border-emerald-800/40 lg:border-none">
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

        <nav className="space-y-1.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer group text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black shadow-emerald-900/40 translate-x-1'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-slate-950 text-emerald-300'
                        : 'bg-emerald-950/60 text-emerald-300 group-hover:bg-emerald-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badgeColor && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${item.badgeColor}`}>
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 m-2 bg-emerald-950/60 rounded-xl border border-emerald-700/40 text-[10.5px] text-emerald-200 text-center">
        <div className="font-bold text-white mb-0.5">RDO Huzurnagar Portal</div>
        <div className="opacity-80">Suryapet District, TS</div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on lg and larger screens) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#072418] border-r border-emerald-600/30 min-h-[calc(100vh-120px)] sticky top-[72px]">
        {navContent}
      </aside>

      {/* MOBILE DRAWER OVERLAY (Visible on mobile/tablets when toggled) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#072418] h-full shadow-2xl flex flex-col z-10 border-r border-emerald-500/40 animate-slide-right">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};