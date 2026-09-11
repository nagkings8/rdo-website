import React from 'react';
import { Home, FolderOpen, Mail, FileSpreadsheet, Users, Scale } from 'lucide-react';
import { StaffUser } from '../types';

export type ActiveTab = 'dashboardTab' | 'bhuBharatiTab' | 'tapalTab' | 'sadabainamaTab' | 'appealCasesTab' | 'adminTab';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: StaffUser | null;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, currentUser }) => {
  const tabs = [
    {
      id: 'dashboardTab' as ActiveTab,
      label: 'Home',
      icon: Home,
      color: 'hover:text-blue-700 hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.18)] hover:bg-blue-50/80',
      activeClass: 'text-blue-700 border-blue-600 bg-gradient-to-b from-blue-50 to-white shadow-xs',
      iconBg: 'bg-blue-100/70 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      id: 'bhuBharatiTab' as ActiveTab,
      label: 'Bhu Bharati Files',
      icon: FolderOpen,
      color: 'hover:text-sky-700 hover:border-sky-500 hover:shadow-[0_4px_16px_rgba(14,165,233,0.18)] hover:bg-sky-50/80',
      activeClass: 'text-sky-700 border-sky-600 bg-gradient-to-b from-sky-50 to-white shadow-xs',
      iconBg: 'bg-sky-100/70 text-sky-700 group-hover:bg-sky-600 group-hover:text-white',
    },
    {
      id: 'tapalTab' as ActiveTab,
      label: 'Tapal Register',
      icon: Mail,
      color: 'hover:text-amber-700 hover:border-amber-500 hover:shadow-[0_4px_16px_rgba(217,119,6,0.18)] hover:bg-amber-50/80',
      activeClass: 'text-amber-700 border-amber-600 bg-gradient-to-b from-amber-50 to-white shadow-xs',
      iconBg: 'bg-amber-100/70 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    },
    {
      id: 'sadabainamaTab' as ActiveTab,
      label: 'Sadabainama',
      icon: FileSpreadsheet,
      color: 'hover:text-emerald-700 hover:border-emerald-500 hover:shadow-[0_4px_16px_rgba(16,185,129,0.18)] hover:bg-emerald-50/80',
      activeClass: 'text-emerald-700 border-emerald-600 bg-gradient-to-b from-emerald-50 to-white shadow-xs',
      iconBg: 'bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      id: 'appealCasesTab' as ActiveTab,
      label: 'Appeal Cases',
      icon: Scale,
      color: 'hover:text-indigo-700 hover:border-indigo-500 hover:shadow-[0_4px_16px_rgba(99,102,241,0.18)] hover:bg-indigo-50/80',
      activeClass: 'text-indigo-700 border-indigo-600 bg-gradient-to-b from-indigo-50 to-white shadow-xs',
      iconBg: 'bg-indigo-100/70 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
    },
  ];

  if (currentUser?.role === 'ADMIN') {
    tabs.push({
      id: 'adminTab' as ActiveTab,
      label: 'Staff & Section Admin',
      icon: Users,
      color: 'hover:text-purple-700 hover:border-purple-500 hover:shadow-[0_4px_16px_rgba(168,85,247,0.18)] hover:bg-purple-50/80',
      activeClass: 'text-purple-700 border-purple-600 bg-gradient-to-b from-purple-50 to-white shadow-xs',
      iconBg: 'bg-purple-100/70 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
    });
  }

  return (
    <nav className="bg-gradient-to-b from-slate-50 to-white border-b-2 border-slate-200/90 px-4 md:px-8 flex flex-wrap gap-2 shadow-xs select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`group relative px-4 py-3 text-sm font-bold flex items-center gap-2.5 rounded-t-xl border-b-[3.5px] transition-all duration-200 cursor-pointer overflow-hidden ${
              isActive
                ? `${tab.activeClass} -mb-[2px] z-10 font-black`
                : `text-slate-600 border-transparent bg-transparent hover:-translate-y-0.5 ${tab.color}`
            }`}
          >
            {/* Top glossy specular reflection on tab */}
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-200 ${tab.iconBg}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
