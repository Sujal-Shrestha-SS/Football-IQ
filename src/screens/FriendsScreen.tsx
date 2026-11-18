import React, { useState } from 'react';
import { GameModeId } from '../types/football';
import { soundService } from '../services/soundService';
import { gameService } from '../services/gameService';
import {
  Users,
  Swords,
  Trophy,
  Check,
  Clock,
  Shield,
  TrendingUp,
  UserCheck,
  Award,
  Shuffle,
  DollarSign,
  Hash,
} from 'lucide-react';

interface FriendsScreenProps {
  onCreateBattle: (config: {
    modes: GameModeId[];
    questionCount: 5 | 10 | 15;
    timerSeconds: number;
  }) => void;
  onJoinBattle: (code: string) => void;
  roomError?: string | null;
}

const BATTLE_MODES: GameModeId[] = [
  'three-clubs',
  'career-path',
  'guess-player',
  'football-quiz',
  'jumbled-name',
  'transfer-quiz',
  'shirt-number',
];

const MODE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Shield,
  TrendingUp,
  UserCheck,
  Award,
  Shuffle,
  DollarSign,
  Hash,
};

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  onCreateBattle,
  onJoinBattle,
  roomError,
}) => {
  const [battleFormat, setBattleFormat] = useState<'single' | 'multi'>('multi');
  const [singleMode, setSingleMode] = useState<GameModeId>('three-clubs');
  const [selectedModes, setSelectedModes] = useState<GameModeId[]>([
    'three-clubs',
    'football-quiz',
    'jumbled-name',
  ]);
  const [selectedCount, setSelectedCount] = useState<5 | 10 | 15>(5);
  const [selectedTimer, setSelectedTimer] = useState<number>(30);

  const [codeInput, setCodeInput] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const handleToggleMultiMode = (mode: GameModeId) => {
    soundService.playTap();
    setLocalError('');
    setSelectedModes((prev) => {
      if (prev.includes(mode)) {
        if (prev.length <= 1) return prev;
        return prev.filter((m) => m !== mode);
      }
      return [...prev, mode];
    });
  };

  const handleFormatChange = (fmt: 'single' | 'multi') => {
    soundService.playTap();
    setLocalError('');
    setBattleFormat(fmt);
    if (fmt === 'single' && selectedCount === 5) {
      setSelectedCount(10);
    } else if (fmt === 'multi' && selectedCount === 10) {
      setSelectedCount(5);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (battleFormat === 'multi' && selectedModes.length < 2) {
      soundService.playWrong();
      setLocalError('Select at least 2 modes for a Multi-Mode Battle.');
      return;
    }
    soundService.playCorrect();
    setLocalError('');
    onCreateBattle({
      modes: battleFormat === 'single' ? [singleMode] : selectedModes,
      questionCount: selectedCount,
      timerSeconds: selectedTimer,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codeInput.trim().toUpperCase();
    if (clean.length < 4) {
      soundService.playWrong();
      setLocalError('Enter a valid battle room code (e.g. KICK42).');
      return;
    }
    soundService.playTap();
    setLocalError('');
    onJoinBattle(clean);
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-nav">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            Live Multiplayer
          </span>
          <h1 className="font-athletic text-2xl font-bold uppercase tracking-tight text-white leading-none">
            Multiplayer Battles
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Users size={20} />
        </div>
      </div>

      {/* Points System Info Strip */}
      <div className="px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5">
        <Trophy size={16} className="text-amber-400 shrink-0" />
        <p className="text-[11px] text-amber-200 leading-snug">
          <strong className="text-amber-300">Points Battle:</strong> 100 pts per correct answer + up to 50 speed bonus pts. Highest total wins!
        </p>
      </div>

      {(localError || roomError) && (
        <div className="px-3.5 py-2.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 font-medium">
          {localError || roomError}
        </div>
      )}

      {/* Join Battle Room Card */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Join Battle Room</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter a friend&apos;s room code to join their live match
          </p>
        </div>

        <form onSubmit={handleJoinSubmit} className="flex gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.toUpperCase());
              setLocalError('');
            }}
            placeholder="e.g. X7K9P2"
            maxLength={10}
            className="flex-1 h-12 px-4 rounded-2xl bg-slate-950 border border-white/10 text-white font-mono-numbers uppercase text-sm tracking-widest focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!codeInput.trim()}
            className="px-5 h-12 rounded-2xl bg-emerald-500 disabled:opacity-40 text-black font-athletic text-lg font-bold uppercase active:scale-95 transition-all"
          >
            Join
          </button>
        </form>
      </div>

      {/* Create Battle Room Card */}
      <form
        onSubmit={handleCreateSubmit}
        className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Create Battle Room</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Play a single mode or stack multiple modes in one battle
            </p>
          </div>
          <Swords size={18} className="text-emerald-400 shrink-0" />
        </div>

        {/* Single Mode vs Multi-Mode Battle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-white/10">
          <button
            type="button"
            onClick={() => handleFormatChange('single')}
            className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              battleFormat === 'single'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Single Mode
          </button>
          <button
            type="button"
            onClick={() => handleFormatChange('multi')}
            className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              battleFormat === 'multi'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multi-Mode Battle
          </button>
        </div>

        {/* Mode Picker */}
        {battleFormat === 'single' ? (
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Game Mode
            </label>
            <select
              value={singleMode}
              onChange={(e) => setSingleMode(e.target.value as GameModeId)}
              className="w-full h-12 px-3.5 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              {BATTLE_MODES.map((m) => (
                <option key={m} value={m}>
                  {gameService.getModeInfo(m).title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Select Battle Modes ({selectedModes.length} chosen)
              </label>
              <button
                type="button"
                onClick={() => {
                  soundService.playTap();
                  setSelectedModes(
                    selectedModes.length === BATTLE_MODES.length
                      ? ['three-clubs', 'football-quiz']
                      : [...BATTLE_MODES]
                  );
                }}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
              >
                {selectedModes.length === BATTLE_MODES.length
                  ? 'Reset (2)'
                  : 'Select All 7'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              After each mode finishes, a 5s leaderboard tally is shown before starting the next mode.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {BATTLE_MODES.map((modeId) => {
                const info = gameService.getModeInfo(modeId);
                const orderIdx = selectedModes.indexOf(modeId);
                const isSelected = orderIdx !== -1;
                const Icon = MODE_ICONS[info.iconName] || Shield;

                return (
                  <button
                    key={modeId}
                    type="button"
                    onClick={() => handleToggleMultiMode(modeId)}
                    className={`w-full min-h-[48px] px-3 py-2 rounded-2xl border flex items-center justify-between gap-2 text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                        : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${info.accentColor}20`,
                          color: info.accentColor,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {info.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {info.badge}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 font-mono-numbers text-[11px] font-black flex items-center gap-1 shrink-0">
                        <Check size={12} strokeWidth={3} />
                        <span>#{orderIdx + 1}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 px-2">
                        Add
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Questions per Mode */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            {battleFormat === 'multi' ? 'Questions Per Mode' : 'Number of Questions'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([5, 10, 15] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => {
                  soundService.playTap();
                  setSelectedCount(cnt);
                }}
                className={`min-h-[44px] rounded-2xl border text-xs font-bold transition-all ${
                  selectedCount === cnt
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-white/10 text-slate-400'
                }`}
              >
                {cnt} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Timer Per Question */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Clock size={12} className="text-slate-400" />
            <span>Timer Per Question</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  soundService.playTap();
                  setSelectedTimer(sec);
                }}
                className={`min-h-[44px] rounded-2xl border text-xs font-bold font-mono-numbers transition-all ${
                  selectedTimer === sec
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-white/10 text-slate-400'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-13 rounded-2xl bg-emerald-500 text-slate-950 font-athletic text-xl font-black uppercase tracking-wider active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
        >
          {battleFormat === 'multi'
            ? `Create ${selectedModes.length}-Mode Battle`
            : 'Create Battle Room'}
        </button>
      </form>
    </div>
  );
};
