import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  TicTacToeCell,
  Player,
} from '../types/football';
import {
  gameService,
  TicTacToeAttribute,
  normalizeText,
} from '../services/gameService';
import { searchPlayerPool } from '../services/playerPoolService';
import { soundService } from '../services/soundService';
import { ClubBadge } from '../components/ClubBadge';
import {
  Grid3x3,
  Plus,
  Search,
  X,
  Trophy,
  Cpu,
  User,
  RotateCcw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface TicTacToeGameProps {
  playerPool: Player[];
  onGameComplete: () => void;
  onQuit: () => void;
}

const WIN_LINES: [number, number][][] = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

function createEmptyBoard(): TicTacToeCell[][] {
  return [0, 1, 2].map((row) =>
    [0, 1, 2].map((col) => ({
      row,
      col,
      claimedBy: null,
    }))
  );
}

function checkWinner(board: TicTacToeCell[][]): {
  winner: 'player' | 'cpu' | 'draw' | null;
  line: [number, number][] | null;
} {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const c1 = board[a[0]][a[1]].claimedBy;
    const c2 = board[b[0]][b[1]].claimedBy;
    const c3 = board[c[0]][c[1]].claimedBy;
    if (c1 && c1 === c2 && c2 === c3) {
      return { winner: c1, line };
    }
  }

  const allFilled = board.every((r) => r.every((cell) => cell.claimedBy !== null));
  if (allFilled) {
    return { winner: 'draw', line: null };
  }

  return { winner: null, line: null };
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  playerPool,
  onGameComplete,
  onQuit,
}) => {
  const [boardConfig, setBoardConfig] = useState<{
    rowClubIds: string[];
    colAttributes: TicTacToeAttribute[];
  }>(() => gameService.generateSolvableTicTacToeBoard());

  const [board, setBoard] = useState<TicTacToeCell[][]>(createEmptyBoard);
  const [turn, setTurn] = useState<'player' | 'cpu'>('player');
  const [winner, setWinner] = useState<'player' | 'cpu' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(null);

  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(
    null
  );
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [errorFlash, setErrorFlash] = useState<string | null>(null);
  const [usedPlayerIds, setUsedPlayerIds] = useState<Set<string>>(new Set());

  const cpuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cpuTimeoutRef.current) clearTimeout(cpuTimeoutRef.current);
    };
  }, []);

  const isWinningCell = (r: number, c: number) =>
    winningLine?.some(([wr, wc]) => wr === r && wc === c) ?? false;

  const triggerCpuTurn = (currentBoard: TicTacToeCell[][]) => {
    setTurn('cpu');
    cpuTimeoutRef.current = setTimeout(() => {
      const emptyCells: { row: number; col: number }[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (currentBoard[r][c].claimedBy === null) {
            emptyCells.push({ row: r, col: c });
          }
        }
      }

      if (emptyCells.length === 0) {
        setTurn('player');
        return;
      }

      const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const nextBoard = currentBoard.map((rArr) => rArr.map((cell) => ({ ...cell })));
      nextBoard[chosen.row][chosen.col].claimedBy = 'cpu';

      soundService.playTap();
      setBoard(nextBoard);

      const status = checkWinner(nextBoard);
      if (status.winner) {
        setWinner(status.winner);
        setWinningLine(status.line);
        if (status.winner === 'cpu') {
          soundService.playWrong();
        }
      } else {
        setTurn('player');
      }
    }, 800);
  };

  const handleOpenCell = (row: number, col: number) => {
    if (winner || turn !== 'player') return;
    if (board[row][col].claimedBy !== null) return;
    soundService.playTap();
    setActiveCell({ row, col });
    setQuery('');
    setSuggestions([]);
    setErrorFlash(null);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setErrorFlash(null);
    if (val.trim().length >= 2) {
      setSuggestions(searchPlayerPool(playerPool, val, 6));
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmitCellAnswer = (candidateName: string) => {
    if (!activeCell || !candidateName.trim()) return;
    const { row, col } = activeCell;
    const clubId = boardConfig.rowClubIds[row];
    const attr = boardConfig.colAttributes[col];
    const club = gameService.getClub(clubId);

    const matchedPlayer = gameService.validateTicTacToeMove(
      candidateName,
      clubId,
      attr.id,
      playerPool
    );

    const alreadyUsed =
      matchedPlayer && usedPlayerIds.has(normalizeText(matchedPlayer.name));

    if (matchedPlayer && !alreadyUsed) {
      soundService.playCorrect();
      const nextBoard = board.map((rArr) => rArr.map((cell) => ({ ...cell })));
      nextBoard[row][col] = {
        row,
        col,
        claimedBy: 'player',
        playerAnswer: matchedPlayer.name,
      };

      const nextUsed = new Set(usedPlayerIds);
      nextUsed.add(normalizeText(matchedPlayer.name));
      setUsedPlayerIds(nextUsed);
      setBoard(nextBoard);
      setActiveCell(null);

      const status = checkWinner(nextBoard);
      if (status.winner) {
        setWinner(status.winner);
        setWinningLine(status.line);
        if (status.winner === 'player') {
          soundService.playVictory();
          confetti({
            particleCount: 80,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#F97316', '#10B981', '#F59E0B', '#FFFFFF'],
          });
        }
      } else {
        triggerCpuTurn(nextBoard);
      }
    } else {
      soundService.playWrong();
      const reason = alreadyUsed
        ? `${matchedPlayer?.name} has already been used on this board!`
        : `"${candidateName}" doesn't match ${club?.shortName || clubId} + ${attr.shortLabel}. Turn passes to CPU!`;

      setErrorFlash(reason);

      setTimeout(() => {
        setActiveCell(null);
        setErrorFlash(null);
        triggerCpuTurn(board);
      }, 1100);
    }
  };

  const handleResetBoard = () => {
    if (cpuTimeoutRef.current) clearTimeout(cpuTimeoutRef.current);
    soundService.playTap();
    setBoardConfig(gameService.generateSolvableTicTacToeBoard());
    setBoard(createEmptyBoard());
    setTurn('player');
    setWinner(null);
    setWinningLine(null);
    setActiveCell(null);
    setUsedPlayerIds(new Set());
  };

  const activeClub = activeCell
    ? gameService.getClub(boardConfig.rowClubIds[activeCell.row])
    : undefined;
  const activeAttr = activeCell ? boardConfig.colAttributes[activeCell.col] : undefined;

  return (
    <div className="px-4 py-3 space-y-4 pb-28">
      {/* HUD Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundService.playTap();
              onQuit();
            }}
            className="text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 min-h-[36px] rounded-xl bg-slate-900 border border-white/5 active:scale-95"
          >
            Quit
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
            <Grid3x3 size={14} />
            <span>Tic-Tac-Toe</span>
          </span>
        </div>

        <button
          onClick={handleResetBoard}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl bg-slate-900 border border-white/5"
          title="New Grid"
        >
          <RotateCcw size={12} />
          <span>New Grid</span>
        </button>
      </div>

      {/* Turn Indicator Banner */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {winner ? (
            <span className="text-amber-300 flex items-center gap-1.5">
              <Trophy size={15} />
              <span>
                {winner === 'player'
                  ? 'Win'
                  : winner === 'cpu'
                  ? 'Loss'
                  : 'Draw'}
              </span>
            </span>
          ) : turn === 'player' ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <User size={15} />
              <span>Your Turn — Tap any empty cell</span>
            </span>
          ) : (
            <span className="text-blue-400 flex items-center gap-1.5">
              <Cpu size={15} className="animate-spin" />
              <span>CPU Turn...</span>
            </span>
          )}
        </div>
      </div>

      {/* 4x4 Grid Arena */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#0E1729] to-[#08101E] border border-orange-500/20 p-3 shadow-2xl">
        <div className="grid grid-cols-4 gap-2 items-stretch">
          <div className="flex flex-col items-center justify-center p-1 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
            <span className="font-athletic text-sm font-black text-orange-400 tracking-wider">
              3×3
            </span>
            <span className="text-[9px] text-slate-500 uppercase font-semibold">
              Club × Stat
            </span>
          </div>

          {boardConfig.colAttributes.map((attr) => (
            <div
              key={attr.id}
              className="p-2 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center text-center min-h-[64px]"
            >
              <span className="text-[10px] font-bold text-orange-300 leading-tight uppercase tracking-tight">
                {attr.shortLabel}
              </span>
              <span className="text-[8px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                {attr.label}
              </span>
            </div>
          ))}

          {boardConfig.rowClubIds.map((clubId, rowIdx) => {
            const club = gameService.getClub(clubId);
            return (
              <React.Fragment key={clubId}>
                <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center text-center min-h-[84px]">
                  {club ? (
                    <>
                      <ClubBadge club={club} size="sm" showName={false} />
                      <span className="text-[9px] font-bold text-slate-200 mt-1 leading-tight line-clamp-2">
                        {club.shortName}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold">{clubId}</span>
                  )}
                </div>

                {[0, 1, 2].map((colIdx) => {
                  const cell = board[rowIdx][colIdx];
                  const isWin = isWinningCell(rowIdx, colIdx);

                  if (cell.claimedBy === 'player') {
                    return (
                      <motion.div
                        key={`${rowIdx}-${colIdx}`}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`min-h-[84px] p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center ${
                          isWin
                            ? 'bg-emerald-500/35 border-emerald-400 ring-2 ring-emerald-400/50'
                            : 'bg-emerald-950/60 border-emerald-500/50'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                          YOU
                        </span>
                        <span className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-3">
                          {cell.playerAnswer}
                        </span>
                      </motion.div>
                    );
                  }

                  if (cell.claimedBy === 'cpu') {
                    return (
                      <motion.div
                        key={`${rowIdx}-${colIdx}`}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`min-h-[84px] p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center ${
                          isWin
                            ? 'bg-blue-500/35 border-blue-400 ring-2 ring-blue-400/50'
                            : 'bg-slate-800/80 border-blue-400/40'
                        }`}
                      >
                        <Cpu size={16} className="text-blue-400 mb-0.5" />
                        <span className="text-xs font-black text-blue-300 tracking-wider">
                          CPU
                        </span>
                      </motion.div>
                    );
                  }

                  return (
                    <button
                      key={`${rowIdx}-${colIdx}`}
                      disabled={!!winner || turn !== 'player'}
                      onClick={() => handleOpenCell(rowIdx, colIdx)}
                      className="min-h-[84px] rounded-2xl bg-slate-900/90 border border-white/10 hover:border-orange-500/50 active:scale-95 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-orange-400 disabled:opacity-60"
                      aria-label={`Claim ${club?.name || clubId} and ${boardConfig.colAttributes[colIdx].label}`}
                    >
                      <Plus size={20} />
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Match Over Outcome Overlay Card (Win / Draw / Loss only) */}
      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-[#0B1324] border border-orange-500/30 shadow-2xl space-y-4 text-center"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
              Full Time
            </span>
            <h3 className="font-athletic text-4xl font-black text-white uppercase mt-0.5">
              {winner === 'player' ? 'Win' : winner === 'cpu' ? 'Loss' : 'Draw'}
            </h3>
          </div>

          <button
            onClick={() => {
              soundService.playTap();
              onGameComplete();
            }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
          >
            <span>Return Home</span>
            <ArrowRight size={20} />
          </button>
        </motion.div>
      )}

      {/* Bottom Sheet Search Modal for Claiming a Cell */}
      <AnimatePresence>
        {activeCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setActiveCell(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0F172A] border-t border-x border-white/10 rounded-t-3xl p-5 space-y-4 shadow-2xl pb-8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    Claim Cell
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug mt-0.5">
                    {activeClub?.name} × {activeAttr?.label}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveCell(null)}
                  className="min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {errorFlash && (
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <span>{errorFlash}</span>
                </div>
              )}

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      handleSubmitCellAnswer(query.trim());
                    }
                  }}
                  placeholder="Search post-2010 footballer..."
                  className="w-full h-13 pl-11 pr-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  autoFocus
                />
              </div>

              {suggestions.length > 0 && (
                <div className="max-h-52 overflow-y-auto p-1 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
                  {suggestions.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSubmitCellAnswer(player.name)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-100 hover:bg-orange-500/15 hover:text-orange-300 flex items-center justify-between"
                    >
                      <span>{player.name}</span>
                      <span className="text-[10px] text-slate-500">Select</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  if (query.trim()) handleSubmitCellAnswer(query.trim());
                }}
                disabled={!query.trim()}
                className="w-full h-12 rounded-2xl bg-orange-500 disabled:opacity-40 text-slate-950 font-athletic text-xl font-black uppercase tracking-wider active:scale-95 transition-all"
              >
                Lock In Player
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
