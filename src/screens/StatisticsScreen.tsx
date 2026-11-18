import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { gameService } from '../services/gameService';
import { soundService } from '../services/soundService';
import { GameModeId } from '../types/football';
import {
  BarChart2,
  Trophy,
  Target,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface StatisticsScreenProps {
  onPlayMode: (mode: GameModeId) => void;
  refreshTrigger?: number;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  onPlayMode,
  refreshTrigger,
}) => {
  const [stats, setStats] = useState(storageService.getStatistics());

  useEffect(() => {
    setStats(storageService.getStatistics());
  }, [refreshTrigger]);

  const favModeInfo = stats.favoriteGameMode
    ? gameService.getModeInfo(stats.favoriteGameMode)
    : null;

  return (
    <div className="px-4 py-4 space-y-5 pb-28">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Career Records
        </span>
        <h1 className="font-athletic text-2xl font-bold uppercase tracking-tight text-white leading-none">
          Gameplay Statistics
        </h1>
      </div>

      {stats.totalGames === 0 ? (
        /* Empty State */
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/5 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center font-bold">
            <BarChart2 size={28} />
          </div>
          <h3 className="font-semibold text-white text-base">
            No Gameplay Recorded Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Play any of the 4 football quiz challenges to record your personal accuracy, favorite modes, and match history.
          </p>
          <button
            onClick={() => {
              soundService.playTap();
              onPlayMode('three-clubs');
            }}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-black font-athletic text-lg font-bold uppercase tracking-wide inline-flex items-center gap-1.5"
          >
            <span>Play First Match</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* Actual Recorded Statistics */
        <div className="space-y-4">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Matches Played
                </span>
                <Clock size={16} className="text-blue-400" />
              </div>
              <div>
                <span className="font-mono-numbers text-3xl font-black text-white block">
                  {stats.totalGames}
                </span>
                <span className="text-[10px] text-slate-500">
                  {stats.totalQuestionsAnswered} questions total
                </span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Overall Accuracy
                </span>
                <Target size={16} className="text-emerald-400" />
              </div>
              <div>
                <span className="font-mono-numbers text-3xl font-black text-emerald-400 block">
                  {stats.overallAccuracy}%
                </span>
                <span className="text-[10px] text-slate-500">
                  Total success rate
                </span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Highest Score
                </span>
                <Trophy size={16} className="text-amber-400" />
              </div>
              <div>
                <span className="font-mono-numbers text-3xl font-black text-amber-300 block">
                  {stats.highestScore}
                </span>
                <span className="text-[10px] text-slate-500">
                  Personal match record
                </span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Favorite Mode
                </span>
                <Flame size={16} className="text-rose-400" />
              </div>
              <div>
                <span className="font-athletic text-xl font-black text-white block truncate">
                  {favModeInfo?.shortTitle || 'None'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Most frequently played
                </span>
              </div>
            </div>
          </div>

          {/* Performance by Mode Breakdown */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Performance by Game Mode
            </h3>

            {(
              [
                'three-clubs',
                'career-path',
                'guess-player',
                'football-quiz',
              ] as GameModeId[]
            ).map((m) => {
              const info = gameService.getModeInfo(m);
              const data = stats.modeBreakdown[m];
              const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

              return (
                <div key={m} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {info.shortTitle}
                    </span>
                    <span className="font-mono-numbers text-slate-400">
                      {data.games} games ·{' '}
                      <strong className="text-emerald-400">{acc}%</strong> accuracy
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${acc}%`,
                        backgroundColor: info.accentColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Match History */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Match History ({stats.recentGames.length})
            </h3>

            <div className="space-y-1.5">
              {stats.recentGames.map((game) => {
                const info = gameService.getModeInfo(game.mode);
                const dateStr = new Date(game.timestamp).toLocaleDateString(
                  undefined,
                  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                );

                return (
                  <div
                    key={game.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {info.shortTitle}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {game.difficulty}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {game.correctCount}/{game.questionCount} Correct · {dateStr}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono-numbers font-bold text-emerald-400 block">
                        +{game.score} pts
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono-numbers">
                        {game.accuracy}% acc · {game.totalTimeSeconds}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
