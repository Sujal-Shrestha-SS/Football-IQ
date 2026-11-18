import React from 'react';
import { Home, Users, User } from 'lucide-react';
import { soundService } from '../services/soundService';

export type TabId = 'home' | 'friends' | 'profile';

interface BottomNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as TabId, label: 'Home', icon: Home },
    { id: 'friends' as TabId, label: 'Friends', icon: Users },
    { id: 'profile' as TabId, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1120]/95 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playTap();
                onTabChange(tab.id);
              }}
              className="relative min-h-[48px] flex flex-col items-center justify-center py-1 transition-all group"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 scale-105'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
