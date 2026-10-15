import React from 'react';
import { soundEffects } from '../utils/audio';

interface BottomNavBarProps {
  activeTab: 'belajar' | 'latihan' | 'akses' | 'profil';
  onChangeTab: (tab: 'belajar' | 'latihan' | 'akses' | 'profil') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'belajar', label: 'Belajar', icon: 'menu_book' },
    { id: 'latihan', label: 'Latihan', icon: 'sports_esports' },
    { id: 'akses', label: 'Akses', icon: 'accessibility_new' },
    { id: 'profil', label: 'Profil', icon: 'person' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white border-t-2 border-[#c7c4d8] shadow-[0_-4px_0_0_#c7c4d8]">
      <div className="flex justify-around items-center px-4 py-1.5 max-w-xl mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playTap();
                onChangeTab(tab.id);
              }}
              type="button"
              className={
                isActive
                  ? 'flex flex-col items-center justify-center bg-[#4f46e5] text-white rounded-xl px-4 py-1.5 min-h-[46px] shadow-[0_3px_0_0_#3525cd] pill-active-nav font-bold cursor-pointer'
                  : 'flex flex-col items-center justify-center text-[#464555] hover:bg-[#eaedff] hover:text-[#131b2e] rounded-xl px-3 py-1.5 min-h-[46px] transition-colors cursor-pointer'
              }
            >
              <span
                className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-icon' : ''}`}
              >
                {tab.icon}
              </span>
              <span className="text-[12px] font-bold tracking-wide mt-0.5 leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
