import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, RotateCcw, Info, ShieldCheck, Check } from 'lucide-react';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileReset: () => void;
  onSoundChanged?: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onProfileReset,
  onSoundChanged,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSoundEnabled(soundService.isEnabled());
      setResetConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = soundService.toggle();
    storageService.setSoundEnabled(next);
    setSoundEnabled(next);
    onSoundChanged?.(next);
    if (next) soundService.playTap();
  };

  const handleResetProfile = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    storageService.clearProfileData();
    setResetConfirm(false);
    setResetSuccess(true);
    soundService.playIncorrect();
    setTimeout(() => {
      setResetSuccess(false);
      onProfileReset();
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold text-white text-base">Game Settings</h3>
            <p className="text-xs text-slate-400">Audio, preferences & rules</p>
          </div>
          <button
            onClick={() => {
              soundService.playTap();
              onClose();
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                {soundEnabled ? (
                  <Volume2 size={18} className="text-emerald-400" />
                ) : (
                  <VolumeX size={18} />
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-white block">Sound Effects</span>
                <span className="text-xs text-slate-400 block">
                  Goal whistles, chimes & timer
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

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck size={14} />
              <span>Verified Senior Club Policy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All question answers rely on official senior-team appearances from 2010 onwards. Youth registration, incomplete transfers, and trial games are excluded.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              <Info size={14} />
              <span>FOOTBALL IQ Arena</span>
            </div>
            <p className="text-xs text-slate-400">
              Test your post-2010 football memory across 8 distinct trivia and puzzle modes.
            </p>
          </div>

          <div className="pt-2">
            {resetSuccess ? (
              <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                <Check size={16} />
                <span>Profile Reset Successfully</span>
              </div>
            ) : (
              <button
                onClick={handleResetProfile}
                className={`w-full min-h-[44px] py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  resetConfirm
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5'
                }`}
              >
                <RotateCcw size={14} />
                <span>
                  {resetConfirm ? 'Confirm: Reset Profile Name & Avatar?' : 'Reset Profile Settings'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
