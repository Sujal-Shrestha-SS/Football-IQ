import React, { useState } from 'react';
import { UserProfile } from '../types/football';
import { storageService, AVATAR_OPTIONS } from '../services/storageService';
import { soundService } from '../services/soundService';
import { Edit2, Check, Volume2, VolumeX } from 'lucide-react';

interface ProfileScreenProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onProfileUpdated,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>(profile.username);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isEnabled());

  const currentAvatar =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0];

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    soundService.playCorrect();
    const updated = storageService.updateUsername(usernameInput.trim());
    onProfileUpdated(updated);
    setIsEditingName(false);
  };

  const handleSelectAvatar = (avatarId: string) => {
    soundService.playTap();
    const updated = storageService.updateAvatar(avatarId);
    onProfileUpdated(updated);
  };

  const handleToggleSound = () => {
    const next = soundService.toggle();
    storageService.setSoundEnabled(next);
    setSoundEnabled(next);
    onProfileUpdated({ ...profile, soundEnabled: next });
    if (next) soundService.playTap();
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-nav">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Player Identity
        </span>
        <h1 className="font-athletic text-2xl font-bold uppercase tracking-tight text-white leading-none">
          User Profile
        </h1>
      </div>

      {/* Username Editor Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#131E35] via-slate-900 to-[#0A1222] border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-xl border-2 border-emerald-400/40 shrink-0"
            style={{ backgroundColor: currentAvatar.color + '20' }}
          >
            {currentAvatar.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Display Name
            </span>

            {isEditingName ? (
              <form onSubmit={handleSaveUsername} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  maxLength={18}
                  className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-slate-950 border border-emerald-500 text-white text-sm font-semibold focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0"
                  aria-label="Save username"
                >
                  <Check size={18} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-athletic text-2xl font-bold text-white tracking-wide leading-none truncate">
                  {profile.username}
                </h2>
                <button
                  onClick={() => {
                    setUsernameInput(profile.username);
                    setIsEditingName(true);
                  }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white"
                  aria-label="Edit username"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Customization */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 block">
          Choose Your Avatar
        </label>
        <div className="grid grid-cols-3 gap-2">
          {AVATAR_OPTIONS.map((av) => {
            const isSelected = profile.avatarId === av.id;
            return (
              <button
                key={av.id}
                onClick={() => handleSelectAvatar(av.id)}
                className={`min-h-[82px] p-3 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                    : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                }`}
              >
                <span className="text-2xl block mb-1">{av.emoji}</span>
                <span className="text-[11px] font-semibold text-slate-200 block truncate">
                  {av.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound Toggle */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 block">
          Preferences
        </label>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              {soundEnabled ? (
                <Volume2 size={18} className="text-emerald-400" />
              ) : (
                <VolumeX size={18} className="text-slate-500" />
              )}
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">
                Sound Effects
              </span>
              <span className="text-xs text-slate-400 block">
                Whistles, chimes & countdown ticks
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleSound}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${
              soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            aria-label="Toggle sound effects"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
