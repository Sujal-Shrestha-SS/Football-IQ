import React, { useState } from 'react';
import { GameModeId, GameSettings } from '../types/football';
import { gameService } from '../services/gameService';
import { soundService } from '../services/soundService';
import { ArrowLeft, Play, Clock, HelpCircle, Sparkles } from 'lucide-react';

interface GameSetupScreenProps {
  mode: GameModeId;
  onBack: () => void;
  onStartGame: (settings: GameSettings) => void;
}

export function getLockedInputMode(mode: GameModeId): 'choice' | 'text' {
  if (
    mode === 'football-quiz' ||
    mode === 'transfer-quiz' ||
    mode === 'shirt-number'
  ) {
    return 'choice';
  }
  return 'text';
}

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({
  mode,
  onBack,
  onStartGame,
}) => {
  const modeInfo = gameService.getModeInfo(mode);

  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);

  const questionOptions: (5 | 10 | 15)[] = [5, 10, 15];

  const timerOptions = [
    { label: 'Off', val: 0 },
    { label: '15s (Sprint)', val: 15 },
    { label: '30s (Standard)', val: 30 },
    { label: '45s (Tactical)', val: 45 },
  ];

  const handleStart = () => {
    soundService.playCorrect();
    onStartGame({
      mode,
      difficulty: 'expert',
      questionCount,
      timerSeconds,
      inputMode: getLockedInputMode(mode),
    });
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-28">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            soundService.playTap();
            onBack();
          }}
          className="min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Game Configuration
          </span>
          <h1 className="font-athletic text-2xl font-bold uppercase tracking-tight text-white leading-none">
            {modeInfo.title}
          </h1>
        </div>
      </div>

      {/* Mode Brief Card */}
      <div
        className="rounded-3xl p-5 border shadow-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${modeInfo.accentColor}15 0%, #0F172A 80%)`,
          borderColor: `${modeInfo.accentColor}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border inline-block"
            style={{
              backgroundColor: `${modeInfo.accentColor}20`,
              borderColor: `${modeInfo.accentColor}40`,
              color: modeInfo.accentColor,
            }}
          >
            {modeInfo.badge}
          </span>
          <span className="text-[10px] font-semibold text-slate-300 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            Post 2010 Era
          </span>
        </div>
        <h2 className="text-sm font-semibold text-white leading-tight">
          {modeInfo.tagline}
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          {modeInfo.description}
        </p>
      </div>

      {/* Setting 1: Question Count */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 px-1">
          <HelpCircle size={14} className="text-emerald-400" />
          <span>Number of Questions</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {questionOptions.map((count) => {
            const isSelected = questionCount === count;
            return (
              <button
                key={count}
                onClick={() => {
                  soundService.playTap();
                  setQuestionCount(count);
                }}
                className={`min-h-[60px] py-3 px-2 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <span className="font-athletic text-xl block leading-none">
                  {count}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Questions
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Setting 2: Timer Preference */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 px-1">
          <Clock size={14} className="text-emerald-400" />
          <span>Countdown Timer</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {timerOptions.map((opt) => {
            const isSelected = timerSeconds === opt.val;
            return (
              <button
                key={opt.val}
                onClick={() => {
                  soundService.playTap();
                  setTimerSeconds(opt.val);
                }}
                className={`min-h-[44px] py-2.5 px-3 rounded-2xl border text-center text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* START GAME CTA */}
      <div className="pt-2 space-y-3">
        <button
          onClick={handleStart}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
        >
          <Play size={20} fill="currentColor" />
          <span>START GAME</span>
        </button>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles size={13} className="text-emerald-400 shrink-0" />
          <span>Questions generated fresh by Gemini AI each session.</span>
        </p>
      </div>
    </div>
  );
};
