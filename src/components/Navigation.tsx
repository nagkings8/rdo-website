import React, { useState, useRef } from 'react';
import { 
  Home, 
  FolderOpen, 
  Mail, 
  FileSpreadsheet, 
  Scale, 
  Clock, 
  ShieldCheck,
  X,
  ChevronRight,
  LogOut
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
  onLogout?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 350);
  };

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR */}
      <aside 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden lg:flex flex-col justify-between fixed top-[112px] left-0 bottom-0 z-40 bg-[#072418] border-r border-emerald-600/30 transition-all duration-300 ease-in-out shadow-xl select-none py-3 overflow-y-auto no-scrollbar ${
          isHovered ? 'w-64' : 'w-20'
        }`}
      >
        <div>
          {/* Header Indicator */}
          <div className="px-3 py-2 mb-2 flex items-center justify-between border-b border-emerald-800/40 min-h-[40px]">
            {isHovered ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 truncate">
                Navigation Menu
              </span>
            ) : (
              <div className="w-full flex justify-center">
                <ChevronRight className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* Nav Items List */}
          <nav className="space-y-2 px-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={!isHovered ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer group text-left ${
                    isHovered ? 'px-3 py-2.5 justify-between' : 'p-2.5 justify-center'
                  } ${
                    isActive
                      ? `${item.activeBg} shadow-md ring-1 ring-white/30 translate-x-0.5`
                      : `text-slate-200 hover:bg-white/10 ${item.hoverText}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-sm ${item.iconBg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {isHovered && (
                      <span className={`truncate text-xs ${isActive ? item.activeText : 'font-bold'}`}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {isHovered && item.badgeColor && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${item.badgeColor}`}>
                      Admin
                    </span>
                  )}
                </button>
              );
            })}

            {/* LOGOUT BUTTON DIRECTLY ATTACHED UNDER THE LAST TAB */}
            {currentUser && (
              <div className="pt-2 border-t border-emerald-800/30">
                <button
                  onClick={handleLogoutClick}
                  title={!isHovered ? "Logout Session" : undefined}
                  className={`w-full flex items-center rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer text-left ${
                    isHovered ? 'px-3 py-2.5 justify-between' : 'p-2.5 justify-center'
                  } bg-rose-950/40 hover:bg-rose-700/80 text-rose-200 hover:text-white border border-rose-600/40 shadow-xs hover:shadow-rose-900/40 hover:translate-x-0.5`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110">
                      <LogOut className="w-4 h-4" />
                    </div>

                    {isHovered && (
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black text-white leading-tight">Sign Out</span>
                        <span className="text-[10px] text-rose-300 font-semibold truncate leading-tight">End Session</span>
                      </div>
                    )}
                  </div>

                  {isHovered && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-black uppercase tracking-wider">
                      Exit
                    </span>
                  )}
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Small Bottom Office Indicator */}
        {isHovered ? (
          <div className="p-3 mx-2.5 bg-[#051c13] rounded-xl border border-emerald-700/40 text-[10.5px] text-emerald-200 text-center shadow-inner">
            <div className="font-bold text-white mb-0.5">RDO Huzurnagar</div>
            <div className="opacity-80 text-[10px]">Suryapet District, TS</div>
          </div>
        ) : (
          <div className="flex justify-center pb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
        )}
      </aside>

      {/* MOBILE SLIDE OVER DRAWER */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#072418] h-full shadow-2xl flex flex-col justify-between z-10 border-r border-emerald-500/40 animate-slide-right select-none py-4 px-3 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-800/50">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Navigation Menu
                </span>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                        isActive
                          ? `${item.activeBg} shadow-md ring-1 ring-white/30`
                          : `text-slate-200 hover:bg-white/10 ${item.hoverText}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs ${isActive ? item.activeText : 'font-bold'}`}>
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

                {/* Mobile Logout Button Under Last Tab */}
                {currentUser && (
                  <div className="pt-2 border-t border-emerald-800/40">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-black">Sign Out</span>
                          <span className="text-[10px] text-rose-200">End Session</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-rose-900 font-black uppercase">
                        Exit
                      </span>
                    </button>
                  </div>
                )}
              </nav>
            </div>

            <div className="p-3 bg-[#051c13] rounded-xl border border-emerald-700/40 text-[10.5px] text-emerald-200 text-center mt-4">
              <div className="font-bold text-white mb-0.5">RDO Huzurnagar Portal</div>
              <div className="opacity-80 text-[10px]">Suryapet District, TS</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};