import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { soundService } from '../services/soundService';
import { storageService, AVATAR_OPTIONS } from '../services/storageService';
import { UserProfile } from '../types/football';

interface TopHeaderProps {
  profile: UserProfile;
  onOpenSettings: () => void;
  onNavigateToProfile: () => void;
  onSoundChanged?: (enabled: boolean) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  profile,
  onOpenSettings,
  onNavigateToProfile,
  onSoundChanged,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isEnabled());

  useEffect(() => {
    setSoundEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  const toggleSound = () => {
    const next = soundService.toggle();
    storageService.setSoundEnabled(next);
    setSoundEnabled(next);
    onSoundChanged?.(next);
    if (next) soundService.playTap();
  };

  const currentAvatar =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0];

  return (
<header className="sticky top-0 z-30 header-safe bg-[#070D18]/90 backdrop-blur-md border-b border-white/5">
  <div className="h-14 px-4 flex items-center justify-between">
          {/* Brand Zone */}
      <div className="flex items-center gap-2.5">
        <img
          src="/icon.png"
          alt="Football IQ"
          className="w-8 h-8 rounded-xl object-cover shadow-md shadow-emerald-500/25 border border-emerald-400/30"
        />
        <div className="flex flex-col">
          <span className="font-athletic text-lg font-black tracking-wider text-white leading-none">
            FOOTBALL<span className="text-emerald-400 ml-1">IQ</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium leading-none mt-0.5">
            Trivia Arena
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleSound}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? (
            <Volume2 size={18} className="text-emerald-400" />
          ) : (
            <VolumeX size={18} className="text-slate-500" />
          )}
        </button>

        <button
          onClick={() => {
            soundService.playTap();
            onOpenSettings();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={() => {
            soundService.playTap();
            onNavigateToProfile();
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-95 transition-all"
          aria-label="User Profile"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-emerald-400/40 shadow-sm"
            style={{ backgroundColor: currentAvatar.color + '25' }}
          >
            {currentAvatar.emoji}
          </div>
        </button>
      </div>
      </div>
    </header>
  );
};
