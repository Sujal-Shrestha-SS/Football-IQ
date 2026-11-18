import React, { useState } from 'react';
import { UserProfile, LeaderboardUser } from '../types/football';
import { soundService } from '../services/soundService';
import { Trophy, Medal, Award, Flame, Globe } from 'lucide-react';

interface LeaderboardScreenProps {
  profile: UserProfile;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ profile }) => {
  const [filter, setFilter] = useState<'weekly' | 'all-time'>('weekly');

  const sampleWeeklyUsers: LeaderboardUser[] = [
    { rank: 1, id: 'u1', username: 'KloppHeavyMetal', avatarId: 'jersey_red', score: 1420, gamesPlayed: 18, country: 'DE' },
    { rank: 2, id: 'u2', username: 'Madridista_Vinicius', avatarId: 'jersey_gold', score: 1290, gamesPlayed: 15, country: 'ES' },
    { rank: 3, id: 'u3', username: 'TacticalMaestro', avatarId: 'jersey_blue', score: 1140, gamesPlayed: 14, country: 'IT' },
    { rank: 4, id: 'u4', username: 'Invincible49', avatarId: 'jersey_green', score: 980, gamesPlayed: 12, country: 'GB' },
    { rank: 5, id: 'u5', username: 'SambaMagic_10', avatarId: 'jersey_star', score: 870, gamesPlayed: 10, country: 'BR' },
    { rank: 6, id: 'u6', username: 'AjaxTotalVoetbal', avatarId: 'jersey_purple', score: 790, gamesPlayed: 9, country: 'NL' },
  ];

  const sampleAllTimeUsers: LeaderboardUser[] = [
    { rank: 1, id: 'at1', username: 'FergusonTreble99', avatarId: 'jersey_red', score: 8450, gamesPlayed: 112, country: 'GB' },
    { rank: 2, id: 'at2', username: 'CruyffVision', avatarId: 'jersey_star', score: 7920, gamesPlayed: 98, country: 'NL' },
    { rank: 3, id: 'at3', username: 'ZidaneVolley02', avatarId: 'jersey_gold', score: 7150, gamesPlayed: 89, country: 'FR' },
    { rank: 4, id: 'at4', username: 'SanSiroBaresi', avatarId: 'jersey_blue', score: 6480, gamesPlayed: 82, country: 'IT' },
    { rank: 5, id: 'at5', username: 'MessiMagia', avatarId: 'jersey_green', score: 5940, gamesPlayed: 75, country: 'AR' },
  ];

  const baseList = filter === 'weekly' ? sampleWeeklyUsers : sampleAllTimeUsers;

  // Insert current user into rankings dynamically based on their score
  const userScore = profile.bestScore || 0;
  const userRank =
    baseList.findIndex((u) => userScore > u.score) !== -1
      ? baseList.findIndex((u) => userScore > u.score) + 1
      : baseList.length + 1;

  const currentUserEntry: LeaderboardUser = {
    rank: userRank,
    id: profile.id,
    username: profile.username,
    avatarId: profile.avatarId,
    score: userScore,
    gamesPlayed: profile.totalGames,
    country: 'YOU',
    isCurrentUser: true,
  };

  // Combine and sort
  const combined = [...baseList, currentUserEntry].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.username.localeCompare(b.username);
  });

  // Re-rank
  const rankedList = combined.map((item, idx) => ({ ...item, rank: idx + 1 }));

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-amber-400" />;
    if (rank === 2) return <Medal size={18} className="text-slate-300" />;
    if (rank === 3) return <Award size={18} className="text-amber-600" />;
    return <span className="font-mono-numbers text-xs font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-28">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Global Rankings
          </span>
          <h1 className="font-athletic text-2xl font-bold uppercase tracking-tight text-white leading-none">
            Leaderboard
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-900 rounded-2xl border border-white/5">
          <button
            onClick={() => {
              soundService.playTap();
              setFilter('weekly');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'weekly'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => {
              soundService.playTap();
              setFilter('all-time');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'all-time'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* User's Current Standing Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-athletic text-lg font-black">
            #{currentUserEntry.rank}
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Your Current Rank
            </span>
            <span className="text-sm font-bold text-white block">
              {profile.username}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono-numbers text-lg font-black text-emerald-400 block">
            {profile.bestScore} pts
          </span>
          <span className="text-[10px] text-slate-400 block">
            {profile.totalGames} matches
          </span>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-2 pt-2 items-end">
        {/* 2nd Place */}
        {rankedList[1] && (
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-center flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center mb-1">
              2
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[80px]">
              {rankedList[1].username}
            </span>
            <span className="font-mono-numbers text-xs text-slate-400 font-semibold mt-0.5">
              {rankedList[1].score}
            </span>
          </div>
        )}

        {/* 1st Place */}
        {rankedList[0] && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/40 text-center flex flex-col items-center -translate-y-2 shadow-lg">
            <Trophy size={20} className="text-amber-400 mb-1" />
            <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center mb-1">
              1
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[85px]">
              {rankedList[0].username}
            </span>
            <span className="font-mono-numbers text-xs text-amber-300 font-bold mt-0.5">
              {rankedList[0].score}
            </span>
          </div>
        )}

        {/* 3rd Place */}
        {rankedList[2] && (
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-800/40 text-center flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-amber-900/80 text-amber-300 text-xs font-bold flex items-center justify-center mb-1">
              3
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[80px]">
              {rankedList[2].username}
            </span>
            <span className="font-mono-numbers text-xs text-slate-400 font-semibold mt-0.5">
              {rankedList[2].score}
            </span>
          </div>
        )}
      </div>

      {/* Leaderboard Table List */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 block">
          Full Standings
        </span>

        <div className="space-y-1.5">
          {rankedList.map((user) => {
            const isMe = user.isCurrentUser;
            return (
              <div
                key={user.id}
                className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-emerald-500/15 border border-emerald-500/40 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center flex items-center justify-center">
                    {getRankBadge(user.rank)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold leading-none ${
                          isMe ? 'text-emerald-300' : 'text-slate-100'
                        }`}
                      >
                        {user.username}
                      </span>
                      {isMe && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500 text-black font-bold uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {user.gamesPlayed} games played
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono-numbers text-sm font-bold text-white block">
                    {user.score}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase block">
                    points
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
