import React from 'react';
import { motion } from 'motion/react';
import { GameModeId, UserProfile } from '../types/football';
import { gameService } from '../services/gameService';
import { AVATAR_OPTIONS } from '../services/storageService';
import { soundService } from '../services/soundService';
import {
  Shield,
  TrendingUp,
  UserCheck,
  Award,
  Shuffle,
  Grid3x3,
  DollarSign,
  Hash,
  Play,
} from 'lucide-react';

interface HomeScreenProps {
  profile: UserProfile;
  onSelectMode: (mode: GameModeId) => void;
}

const MODE_ORDER: GameModeId[] = [
  'three-clubs',
  'career-path',
  'guess-player',
  'football-quiz',
  'jumbled-name',
  'tictactoe',
  'transfer-quiz',
  'shirt-number',
];

const ICON_MAP = {
  Shield,
  TrendingUp,
  UserCheck,
  Award,
  Shuffle,
  Grid3x3,
  DollarSign,
  Hash,
} as const;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onSelectMode,
}) => {

  const currentAvatar =
    AVATAR_OPTIONS.find((a) => a.id === profile.avatarId) || AVATAR_OPTIONS[0];

  return (
    <div className="px-4 py-4 space-y-5 pb-nav">
      {/* Player Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1528] to-[#07101E] border border-white/10 p-5 shadow-xl">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex items-center gap-3.5 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-emerald-400/30 shadow-inner shrink-0"
            style={{ backgroundColor: currentAvatar.color + '20' }}
          >
            {currentAvatar.emoji}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
              Welcome back
            </span>
            <h2 className="font-athletic text-xl font-bold text-white tracking-wide truncate leading-tight">
              {profile.username}
            </h2>
          </div>
        </div>

        <div className="relative z-10 pt-3 border-t border-white/10">
          <h1 className="font-athletic text-2xl font-extrabold tracking-tight text-white uppercase leading-none">
            How well do you know football?
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Challenge your post-2010 football knowledge across 8 modes.
          </p>
        </div>
      </div>

      {/* Main Section: Vertical Scrollable List of All 8 Game Modes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Game Mode
          </h2>
          <span className="text-[11px] text-slate-500">Post-2010 Era</span>
        </div>

        <div className="flex flex-col gap-3">
          {MODE_ORDER.map((modeId, idx) => {
            const info = gameService.getModeInfo(modeId);
            const Icon =
              ICON_MAP[info.iconName as keyof typeof ICON_MAP] || Shield;

            return (
              <motion.button
                key={modeId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundService.playTap();
                  onSelectMode(modeId);
                }}
                className="w-full min-h-[76px] text-left relative overflow-hidden rounded-2xl bg-slate-900/90 border border-white/10 p-3.5 shadow-lg transition-colors hover:bg-slate-800/80 group"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: info.accentColor,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        backgroundColor: `${info.accentColor}20`,
                        color: info.accentColor,
                        border: `1px solid ${info.accentColor}35`,
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[10px] font-bold tracking-wider uppercase block mb-0.5"
                        style={{ color: info.accentColor }}
                      >
                        {info.badge}
                      </span>

                      <h3 className="font-athletic text-lg font-bold tracking-tight text-white uppercase leading-tight truncate">
                        {info.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {info.tagline}
                      </p>
                    </div>
                  </div>

                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-slate-950 shadow-md transition-transform group-hover:translate-x-0.5"
                    style={{ backgroundColor: info.accentColor }}
                  >
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
