import React, { useState } from 'react';
import { AVATAR_OPTIONS } from '../services/storageService';
import { soundService } from '../services/soundService';
import { ArrowRight, Shield, Swords } from 'lucide-react';

interface NameOnboardingScreenProps {
  initialAvatarId: string;
  inviteRoomCode?: string | null;
  onComplete: (username: string, avatarId: string) => void;
}

export const NameOnboardingScreen: React.FC<NameOnboardingScreenProps> = ({
  initialAvatarId,
  inviteRoomCode,
  onComplete,
}) => {
  const [nameInput, setNameInput] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    initialAvatarId || AVATAR_OPTIONS[0].id
  );
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (cleaned.length < 2) {
      soundService.playWrong();
      setError('Enter at least 2 characters for your player name.');
      return;
    }
    soundService.playCorrect();
    setError('');
    onComplete(cleaned, selectedAvatar);
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center px-4 py-6 antialiased text-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#111C33] via-[#0D1526] to-[#080E1A] border border-white/10 p-6 shadow-2xl space-y-6">
        {/* Brand Intro */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shadow-inner">
            <Shield size={28} />
          </div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            Football IQ
          </span>
          <h1 className="font-athletic text-3xl font-black uppercase tracking-wide text-white leading-none">
            Who&apos;s On The Pitch?
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your player name so friends can recognize you in live multiplayer battles and leaderboards.
          </p>
        </div>

        {inviteRoomCode && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
            <Swords size={16} className="text-emerald-400 shrink-0" />
            <span>
              You&apos;ll join Battle Room{' '}
              <strong className="font-mono-numbers text-white">{inviteRoomCode}</strong>{' '}
              right after entering your name.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Player Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block px-1">
              Your Player Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. ChelseaBlue, Bergkamp10..."
              maxLength={20}
              autoFocus
              className="w-full h-13 px-4 rounded-2xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-emerald-500"
            />
            {error && (
              <p className="text-xs text-rose-400 font-medium px-1">{error}</p>
            )}
          </div>

          {/* Quick Badge Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block px-1">
              Choose Your Badge
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_OPTIONS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      soundService.playTap();
                      setSelectedAvatar(av.id);
                    }}
                    className={`min-h-[68px] p-2.5 rounded-2xl border text-center transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl block leading-none mb-1">{av.emoji}</span>
                    <span className="text-[10px] font-semibold text-slate-300 block truncate">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={nameInput.trim().length < 2}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 disabled:opacity-40 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <span>Enter Pitch</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
