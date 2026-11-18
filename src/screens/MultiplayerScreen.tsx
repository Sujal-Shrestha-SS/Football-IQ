import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { BattleRoomState, UserProfile } from '../types/football';
import { gameService } from '../services/gameService';
import { AVATAR_OPTIONS } from '../services/storageService';
import { soundService } from '../services/soundService';
import {
  Copy,
  Check,
  Crown,
  Trophy,
  Users,
  Play,
  LogOut,
  Clock,
  Share2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  FastForward,
} from 'lucide-react';

interface MultiplayerTopBarProps {
  room: BattleRoomState;
  profile: UserProfile;
}

export const MultiplayerTopBar: React.FC<MultiplayerTopBarProps> = ({
  room,
  profile,
}) => {
  const currentModeId = room.modes[room.currentModeIndex];
  const modeInfo = gameService.getModeInfo(currentModeId);
  const me = room.players.find((p) => p.playerId === profile.id);
  const sortedPlayers = [...room.players].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 px-3 py-2 space-y-2 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-950 shrink-0"
              style={{ backgroundColor: modeInfo.accentColor }}
            >
              {room.modes.length > 1
                ? `Mode ${room.currentModeIndex + 1}/${room.modes.length}`
                : 'Battle'}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {modeInfo.shortTitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 shrink-0">
            <Trophy size={12} className="text-amber-400" />
            <span className="font-mono-numbers text-xs font-black text-amber-300">
              {me?.totalPoints ?? 0} pts
            </span>
          </div>
        </div>

        {room.players.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {sortedPlayers.map((p, idx) => {
              const av =
                AVATAR_OPTIONS.find((a) => a.id === p.avatarId) || AVATAR_OPTIONS[0];
              const isMe = p.playerId === profile.id;
              return (
                <div
                  key={p.playerId}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] shrink-0 border ${
                    isMe
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/70 border-white/5 text-slate-300'
                  }`}
                >
                  <span className="font-mono-numbers font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <span>{av.emoji}</span>
                  <span className="font-semibold max-w-[64px] truncate">
                    {isMe ? 'You' : p.username}
                  </span>
                  <span className="font-mono-numbers font-bold text-amber-300">
                    {p.totalPoints}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface MultiplayerScreenProps {
  room: BattleRoomState;
  profile: UserProfile;
  onStartBattle: () => void;
  onResetLobby: () => void;
  onForceAdvance: () => void;
  onLeaveRoom: () => void;
}

export const MultiplayerScreen: React.FC<MultiplayerScreenProps> = ({
  room,
  profile,
  onStartBattle,
  onResetLobby,
  onForceAdvance,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [intermissionSecLeft, setIntermissionSecLeft] = useState<number>(5);

  const isHost = room.hostId === profile.id;
  const sortedPlayers = [...room.players].sort((a, b) => b.totalPoints - a.totalPoints);

  // Live 5-second countdown during intermission
  useEffect(() => {
    if (room.phase !== 'intermission' || !room.intermissionEndsAt) return;
    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil(((room.intermissionEndsAt || 0) - Date.now()) / 1000)
      );
      setIntermissionSecLeft(remaining);
    };
    update();
    const timer = setInterval(update, 200);
    return () => clearInterval(timer);
  }, [room.phase, room.intermissionEndsAt]);

  // Trigger celebratory confetti when user wins or finishes
  useEffect(() => {
    if (room.phase !== 'finished' || sortedPlayers.length === 0) return;
    const topScore = sortedPlayers[0].totalPoints;
    const iWon = sortedPlayers.some(
      (p) => p.playerId === profile.id && p.totalPoints === topScore && topScore > 0
    );
    if (iWon) {
      soundService.playCorrect();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF'],
      });
    }
  }, [room.phase]);

  const handleCopyCode = () => {
    soundService.playTap();
    navigator.clipboard?.writeText(room.code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    soundService.playTap();
    const url = `${window.location.origin}/?room=${room.code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // PHASE 1: LOBBY
  if (room.phase === 'lobby') {
    return (
      <div className="px-4 py-4 space-y-5 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Multiplayer Lobby
            </span>
            <h1 className="font-athletic text-2xl font-bold uppercase text-white leading-none">
              Battle Room Ready
            </h1>
          </div>
          <button
            onClick={() => {
              soundService.playTap();
              onLeaveRoom();
            }}
            className="min-h-[40px] px-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Leave</span>
          </button>
        </div>

        {/* Share Room Code Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/35 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Share Room Code
            </span>
            <span className="text-[11px] text-slate-400">
              {room.players.length} {room.players.length === 1 ? 'player' : 'players'} joined
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <span className="font-athletic text-3xl font-black text-white tracking-[0.2em]">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="min-h-[44px] px-3.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            onClick={handleCopyInviteLink}
            className="w-full min-h-[42px] rounded-xl bg-slate-800/80 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Direct Invite Link'}</span>
          </button>
        </div>

        {/* Battle Playlist Card */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {room.modes.length > 1
                ? `Multi-Mode Battle (${room.modes.length} Modes)`
                : 'Single-Mode Battle'}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono-numbers">
              {room.questionCount} Qs · {room.timerSeconds}s
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {room.modes.map((modeId, idx) => {
              const info = gameService.getModeInfo(modeId);
              return (
                <div
                  key={`${modeId}-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 flex items-center gap-2 text-xs font-semibold text-white"
                >
                  <span
                    className="w-5 h-5 rounded-md text-[10px] font-black text-slate-950 flex items-center justify-center"
                    style={{ backgroundColor: info.accentColor }}
                  >
                    {idx + 1}
                  </span>
                  <span>{info.shortTitle}</span>
                </div>
              );
            })}
          </div>

          {room.modes.length > 1 && (
            <p className="text-[11px] text-slate-400">
              A 5-second leaderboard tally appears after every finished mode before automatically launching the next mode.
            </p>
          )}
        </div>

        {/* Connected Players List */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users size={14} className="text-emerald-400" />
              <span>Players in Room</span>
            </h2>
          </div>

          <div className="space-y-2">
            {room.players.map((p) => {
              const av =
                AVATAR_OPTIONS.find((a) => a.id === p.avatarId) || AVATAR_OPTIONS[0];
              const isMe = p.playerId === profile.id;
              return (
                <div
                  key={p.playerId}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isMe
                      ? 'bg-emerald-500/10 border-emerald-500/35'
                      : 'bg-slate-950/70 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: av.color + '22' }}
                    >
                      {av.emoji}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-white block truncate">
                        {p.username} {isMe ? '(You)' : ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.connected ? 'Connected' : 'Reconnecting...'}
                      </span>
                    </div>
                  </div>

                  {p.isHost ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase flex items-center gap-1">
                      <Crown size={11} />
                      <span>Host</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase">
                      Ready
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isHost ? (
          <div className="space-y-2">
            {room.players.length < 2 && (
              <p className="text-center text-[11px] text-slate-400">
                Invite friends with code <strong className="text-white">{room.code}</strong> — or start now to play immediately.
              </p>
            )}
            <button
              onClick={() => {
                soundService.playCorrect();
                onStartBattle();
              }}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <Play size={20} fill="currentColor" />
              <span>Start Battle</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-center space-y-1">
            <p className="text-xs font-semibold text-white">
              Waiting for host to start the battle...
            </p>
            <p className="text-[11px] text-slate-400">
              You&apos;ll all play the exact same questions simultaneously.
            </p>
          </div>
        )}
      </div>
    );
  }

  // PHASE 2: LOADING QUESTIONS
  if (room.phase === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <div className="space-y-1">
          <h2 className="font-athletic text-2xl font-bold uppercase text-white">
            Setting Up Battle Arena
          </h2>
          <p className="text-xs text-slate-400">
            Syncing {room.modes.length} {room.modes.length === 1 ? 'mode' : 'modes'} for all players...
          </p>
        </div>
      </div>
    );
  }

  // PHASE 3: WAITING FOR OTHER PLAYERS TO FINISH CURRENT MODE
  if (room.phase === 'playing') {
    const currentMode = gameService.getModeInfo(room.modes[room.currentModeIndex]);
    return (
      <div className="px-4 py-6 space-y-5 pb-28">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={14} />
            <span>Round Complete</span>
          </span>
          <h2 className="font-athletic text-3xl font-black uppercase text-white leading-none">
            {currentMode.title} Finished
          </h2>
          <p className="text-xs text-slate-400">
            Waiting for other players to finish before showing the leaderboard tally...
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2.5">
          {sortedPlayers.map((p, idx) => {
            const av =
              AVATAR_OPTIONS.find((a) => a.id === p.avatarId) || AVATAR_OPTIONS[0];
            const isMe = p.playerId === profile.id;
            return (
              <div
                key={p.playerId}
                className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono-numbers text-xs font-black text-slate-400 w-5">
                    #{idx + 1}
                  </span>
                  <span className="text-lg">{av.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {p.username} {isMe ? '(You)' : ''}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {p.finishedCurrentMode
                        ? 'Finished'
                        : `On Q${Math.min(p.currentModeAnswered + 1, room.questionCount)}/${room.questionCount}`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono-numbers text-sm font-black text-amber-400 block">
                    {p.totalPoints} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {isHost && (
            <button
              onClick={() => {
                soundService.playTap();
                onForceAdvance();
              }}
              className="w-full min-h-[48px] rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <FastForward size={15} />
              <span>Advance Round Now</span>
            </button>
          )}
          <button
            onClick={() => {
              soundService.playTap();
              onLeaveRoom();
            }}
            className="w-full min-h-[44px] rounded-2xl bg-slate-900 border border-white/10 text-slate-400 text-xs font-semibold"
          >
            Leave Battle
          </button>
        </div>
      </div>
    );
  }

  // PHASE 4: 5-SECOND INTERMISSION LEADERBOARD TALLY BETWEEN MODES
  if (room.phase === 'intermission') {
    const finishedMode = gameService.getModeInfo(room.modes[room.currentModeIndex]);
    const nextModeId = room.modes[room.currentModeIndex + 1];
    const nextMode = nextModeId ? gameService.getModeInfo(nextModeId) : null;
    const progressPct = Math.min(100, Math.max(0, (intermissionSecLeft / 5) * 100));

    return (
      <div className="px-4 py-6 space-y-5 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1.5"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
            <Trophy size={13} />
            <span>Round {room.currentModeIndex + 1} Complete · {finishedMode.shortTitle}</span>
          </span>
          <h1 className="font-athletic text-3xl font-black uppercase text-white leading-none">
            Leaderboard Tally
          </h1>
        </motion.div>

        {/* Ranked Standings */}
        <div className="space-y-2.5">
          {sortedPlayers.map((p, idx) => {
            const av =
              AVATAR_OPTIONS.find((a) => a.id === p.avatarId) || AVATAR_OPTIONS[0];
            const isMe = p.playerId === profile.id;
            const roundPts = p.modePoints[room.currentModeIndex] ?? 0;

            return (
              <motion.div
                key={p.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-500/15 to-slate-900 border-amber-400/50 shadow-lg'
                    : isMe
                    ? 'bg-emerald-500/10 border-emerald-500/35'
                    : 'bg-slate-900/80 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl font-athletic text-lg font-black flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: av.color + '22' }}
                  >
                    {av.emoji}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {p.username} {isMe ? '(You)' : ''}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono-numbers font-semibold">
                      +{roundPts} pts in {finishedMode.shortTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-athletic text-2xl font-black text-white leading-none block">
                    {p.totalPoints}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Total Pts
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 5-Second Countdown Banner to Next Mode */}
        {nextMode && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400 animate-pulse" />
                <span>
                  Next Mode ({room.currentModeIndex + 2}/{room.modes.length}):{' '}
                  <strong className="text-white">{nextMode.title}</strong>
                </span>
              </span>
              <span className="font-mono-numbers font-black text-emerald-400 text-sm">
                {intermissionSecLeft}s
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-200 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // PHASE 5: FINAL WINNER PODIUM & ACCUMULATED POINTS LEADERBOARD
  const topScore = sortedPlayers[0]?.totalPoints ?? 0;
  const winners = sortedPlayers.filter((p) => p.totalPoints === topScore);
  const isTie = winners.length > 1;
  const topWinner = winners[0];
  const topAvatar = topWinner
    ? AVATAR_OPTIONS.find((a) => a.id === topWinner.avatarId) || AVATAR_OPTIONS[0]
    : AVATAR_OPTIONS[0];

  return (
    <div className="px-4 py-6 space-y-5 pb-28">
      {/* Winner Hero Banner */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border border-amber-400/40 text-center space-y-3 shadow-2xl"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
          <Sparkles size={13} />
          <span>Full Time · Final Result</span>
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-4xl shadow-inner">
          {isTie ? '🏆' : topAvatar.emoji}
        </div>

        <div>
          <h1 className="font-athletic text-3xl font-black uppercase text-white leading-none">
            {isTie
              ? 'Co-Champions!'
              : `${topWinner?.username || 'Player'} Wins!`}
          </h1>
          <p className="text-xs text-amber-300 font-mono-numbers font-bold mt-1">
            {isTie
              ? `${winners.map((w) => w.username).join(' & ')} tied at ${topScore} pts`
              : `${topScore} Total Points Accumulated`}
          </p>
        </div>
      </motion.div>

      {/* Full Ranked Final Standings */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Final Standings
        </h2>
        {sortedPlayers.map((p, idx) => {
          const av =
            AVATAR_OPTIONS.find((a) => a.id === p.avatarId) || AVATAR_OPTIONS[0];
          const isMe = p.playerId === profile.id;
          const isWinner = p.totalPoints === topScore;

          return (
            <div
              key={p.playerId}
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isWinner
                  ? 'bg-amber-500/10 border-amber-400/50'
                  : isMe
                  ? 'bg-emerald-500/10 border-emerald-500/35'
                  : 'bg-slate-900/80 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl font-athletic text-lg font-black flex items-center justify-center shrink-0 ${
                      isWinner
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isWinner ? <Crown size={16} /> : `#${idx + 1}`}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: av.color + '22' }}
                  >
                    {av.emoji}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {p.username} {isMe ? '(You)' : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {p.correctCount} correct answers
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-athletic text-2xl font-black text-white leading-none block">
                    {p.totalPoints}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                    Points
                  </span>
                </div>
              </div>

              {room.modes.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                  {room.modes.map((mId, mIdx) => {
                    const info = gameService.getModeInfo(mId);
                    return (
                      <span
                        key={`${mId}-${mIdx}`}
                        className="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-white/5 text-[10px] text-slate-300 font-mono-numbers"
                      >
                        {info.shortTitle}:{' '}
                        <strong className="text-white">
                          {p.modePoints[mIdx] ?? 0}
                        </strong>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        {isHost ? (
          <button
            onClick={() => {
              soundService.playTap();
              onResetLobby();
            }}
            className="min-h-[48px] rounded-2xl bg-emerald-500 text-slate-950 font-athletic text-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <RotateCcw size={16} />
            <span>Back to Lobby</span>
          </button>
        ) : (
          <div className="min-h-[48px] rounded-2xl bg-slate-900 border border-white/10 text-slate-400 text-xs font-semibold flex items-center justify-center px-3 text-center">
            Host can rematch
          </div>
        )}

        <button
          onClick={() => {
            soundService.playTap();
            onLeaveRoom();
          }}
          className="min-h-[48px] rounded-2xl bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <LogOut size={15} />
          <span>Exit Battle</span>
        </button>
      </div>
    </div>
  );
};
