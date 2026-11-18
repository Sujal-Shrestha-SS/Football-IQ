import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  JumbledNameQuestion,
  GameSettings,
  Player,
} from '../types/football';
import { gameService, normalizeText } from '../services/gameService';
import { searchPlayerPool } from '../services/playerPoolService';
import { soundService } from '../services/soundService';
import {
  Shuffle,
  Lightbulb,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface JumbledNameGameProps {
  question: JumbledNameQuestion;
  questionIndex: number;
  totalQuestions: number;
  settings: GameSettings;
  playerPool: Player[];
  onAnswerSubmitted: (isCorrect: boolean, timeLeft?: number) => void;
  onQuit: () => void;
}

const MAX_LETTER_REVEALS = 3;

function buildScrambledLetters(question: JumbledNameQuestion): string {
  const cleanTarget = normalizeText(question.correctAnswer)
    .replace(/\s+/g, '')
    .toUpperCase();
  const provided = (question.jumbledLetters || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/gi, '')
    .toUpperCase();

  if (
    provided.length === cleanTarget.length &&
    [...provided].sort().join('') === [...cleanTarget].sort().join('')
  ) {
    return provided;
  }

  const arr = [...cleanTarget];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export const JumbledNameGame: React.FC<JumbledNameGameProps> = ({
  question,
  questionIndex,
  totalQuestions,
  settings,
  playerPool,
  onAnswerSubmitted,
  onQuit,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timerSeconds);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCorrectRef = useRef<boolean>(false);
  const answerTimeLeftRef = useRef<number>(settings.timerSeconds);
  const isAnsweredRef = useRef<boolean>(false);

  const scrambled = useMemo(() => buildScrambledLetters(question), [question.id]);

  const hintsList = useMemo(() => {
    if (Array.isArray(question.hints) && question.hints.length > 0) {
      return question.hints.map((h) => String(h).trim()).filter(Boolean);
    }
    const fallback: string[] = [];
    if (question.position || question.era) {
      fallback.push(`Position: ${question.position} · Era: ${question.era}`);
    }
    if (question.nationality) {
      fallback.push(`Nationality: ${question.nationality}`);
    }
    return fallback;
  }, [question.id, question.hints, question.position, question.era, question.nationality]);

  // Group tiles in rows of 5 for crisp mobile readability
  const letterGroups = useMemo(() => {
    const groups: string[][] = [];
    const chars = scrambled.split('');
    for (let i = 0; i < chars.length; i += 5) {
      groups.push(chars.slice(i, i + 5));
    }
    return groups;
  }, [scrambled]);

  const answerPattern = useMemo(() => {
    const cleaned = question.correctAnswer
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '');

    let nonSpaceIdx = 0;
    return cleaned.split('').map((ch) => {
      if (ch === ' ') {
        return { char: ' ', isSpace: true, order: -1 };
      }
      const item = { char: ch, isSpace: false, order: nonSpaceIdx };
      nonSpaceIdx++;
      return item;
    });
  }, [question.id, question.correctAnswer]);

  const revealPriorityOrder = useMemo(() => {
    const nonSpaceItems = answerPattern.filter((item) => !item.isSpace);
    const priority: number[] = [];
    if (nonSpaceItems.length > 0) priority.push(0);

    const lastSpaceIdx = answerPattern.map((i) => i.isSpace).lastIndexOf(true);
    if (lastSpaceIdx !== -1 && lastSpaceIdx + 1 < answerPattern.length) {
      const lastWordFirstOrder = answerPattern[lastSpaceIdx + 1].order;
      if (lastWordFirstOrder >= 0 && !priority.includes(lastWordFirstOrder)) {
        priority.push(lastWordFirstOrder);
      }
    }

    for (const item of nonSpaceItems) {
      if (!priority.includes(item.order)) {
        priority.push(item.order);
      }
    }
    return priority;
  }, [answerPattern]);

  const revealedSet = useMemo(() => {
    if (isAnswered) {
      return new Set(revealPriorityOrder);
    }
    return new Set(revealPriorityOrder.slice(0, revealedCount));
  }, [isAnswered, revealedCount, revealPriorityOrder]);

  useEffect(() => {
    setSelectedAnswer('');
    setTextInput('');
    setSuggestions([]);
    setIsAnswered(false);
    isAnsweredRef.current = false;
    setIsCorrect(false);
    setRevealedCount(0);
    setHintsRevealed(0);
    answerTimeLeftRef.current = settings.timerSeconds;
    setTimeLeft(settings.timerSeconds);

    if (settings.timerSeconds > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!isAnsweredRef.current) {
              submitFinalAnswer('');
            }
            return 0;
          }
          if (prev <= 5) {
            soundService.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.id]);

  const handleRevealLetter = () => {
    if (isAnswered || revealedCount >= MAX_LETTER_REVEALS) return;
    soundService.playTap();
    setRevealedCount((prev) => prev + 1);
  };

  const handleRevealHint = () => {
    if (isAnswered || hintsRevealed >= hintsList.length) return;
    soundService.playTap();
    setHintsRevealed((prev) => prev + 1);
  };

  const handleTextChange = (val: string) => {
    setTextInput(val);
    if (val.trim().length >= 2) {
      const results = searchPlayerPool(playerPool, val, 5);
      setSuggestions(results.map((p) => p.name));
    } else {
      setSuggestions([]);
    }
  };

  const submitFinalAnswer = (ans: string) => {
    if (isAnsweredRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = gameService.validateAnswer(ans, question.correctAnswer);

    isAnsweredRef.current = true;
    latestCorrectRef.current = correct;
    answerTimeLeftRef.current = ans === '' ? 0 : timeLeft;
    setSelectedAnswer(ans);
    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      soundService.playCorrect();
      confetti({
        particleCount: 55,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#10B981', '#F59E0B', '#FFFFFF'],
      });
    } else {
      soundService.playWrong();
    }
  };

  const handleContinue = () => {
    soundService.playTap();
    onAnswerSubmitted(latestCorrectRef.current, answerTimeLeftRef.current);
  };

  const timerRatio =
    settings.timerSeconds > 0 ? (timeLeft / settings.timerSeconds) * 100 : 100;

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
          <span className="text-xs font-semibold text-slate-400">
            Anagram{' '}
            <span className="text-white font-mono-numbers">
              {questionIndex + 1}
            </span>{' '}
            of {totalQuestions}
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
          Jumbled Name
        </span>
      </div>

      {/* Timer Bar */}
      {settings.timerSeconds > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono-numbers">
              <Clock
                size={12}
                className={timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}
              />
              <span>{timeLeft}s</span>
            </span>
            <span className="text-[10px] uppercase text-slate-500">
              {question.position} · {question.era}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-violet-500'
              }`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>
        </div>
      )}

      {/* Jumbled Tiles Arena Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#17122B] via-[#101325] to-[#0A101D] border border-violet-500/20 p-5 shadow-2xl space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Shuffle size={11} />
            <span>Jumbled Name</span>
          </span>
          <h2 className="text-sm font-bold text-white tracking-tight">
            {question.question}
          </h2>
        </div>

        {/* Letter Tiles Grid grouped in chunks of 5 */}
        <motion.div
          key={question.id}
          animate={
            isAnswered && !isCorrect
              ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-3 py-1"
        >
          {letterGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex items-center gap-1.5">
              {group.map((letter, lIdx) => (
                <motion.div
                  key={`${gIdx}-${lIdx}`}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (gIdx * 5 + lIdx) * 0.025 }}
                  className={`min-w-[36px] h-10 px-1.5 rounded-xl flex items-center justify-center font-black text-lg transition-colors shadow-md border ${
                    isAnswered
                      ? isCorrect
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                        : 'bg-rose-500/25 border-rose-400 text-rose-200'
                      : 'bg-slate-800 border-white/10 text-white'
                  }`}
                >
                  {letter}
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Progressive Letter Reveal Row */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono-numbers text-sm font-bold tracking-wider">
            {answerPattern.map((item, idx) =>
              item.isSpace ? (
                <span key={idx} className="w-3" />
              ) : (
                <span
                  key={idx}
                  className={`inline-flex items-center justify-center min-w-[16px] h-6 border-b-2 transition-colors ${
                    revealedSet.has(item.order)
                      ? 'text-emerald-400 border-emerald-400/60'
                      : 'text-slate-500 border-slate-700'
                  }`}
                >
                  {revealedSet.has(item.order) ? item.char : '_'}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Reveal Letter + Progressive Hint Controls (Both Free) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleRevealLetter}
          disabled={isAnswered || revealedCount >= MAX_LETTER_REVEALS}
          className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
            revealedCount >= MAX_LETTER_REVEALS || isAnswered
              ? 'bg-slate-900 text-slate-500 border-white/5'
              : 'bg-violet-500/10 text-violet-300 border-violet-500/30 hover:bg-violet-500/20 active:scale-95'
          }`}
        >
          <Sparkles size={14} className="text-violet-400" />
          <span>
            Reveal Letter ({revealedCount}/{MAX_LETTER_REVEALS})
          </span>
        </button>

        {hintsList.length > 0 && (
          <button
            onClick={handleRevealHint}
            disabled={isAnswered || hintsRevealed >= hintsList.length}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
              hintsRevealed >= hintsList.length || isAnswered
                ? 'bg-slate-900 text-slate-500 border-white/5'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 active:scale-95'
            }`}
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span>
              {hintsRevealed >= hintsList.length
                ? 'All Hints Revealed'
                : `Hint (${hintsRevealed}/${hintsList.length})`}
            </span>
          </button>
        )}
      </div>

      {/* Progressive Hints Box */}
      {hintsRevealed > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 animate-fade-in">
          {hintsList.slice(0, hintsRevealed).map((hint, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-amber-200">
              <span className="font-bold text-amber-400 shrink-0">Hint {idx + 1}:</span>
              <span>{hint}</span>
            </div>
          ))}
        </div>
      )}

      {/* Text Autocomplete Answer Area */}
      {!isAnswered ? (
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={textInput}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textInput.trim()) {
                  submitFinalAnswer(textInput.trim());
                }
              }}
              placeholder="Type the unscrambled footballer..."
              className="w-full h-13 pl-11 pr-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
              autoFocus
            />
          </div>

          {suggestions.length > 0 && (
            <div className="p-1 rounded-2xl bg-slate-900 border border-white/10 space-y-1 shadow-xl">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 pt-1 block">
                Suggested Footballers
              </span>
              {suggestions.map((name) => (
                <button
                  key={name}
                  onClick={() => submitFinalAnswer(name)}
                  className="w-full min-h-[44px] text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-violet-500/15 hover:text-violet-300 flex items-center justify-between"
                >
                  <span>{name}</span>
                  <span className="text-[10px] text-slate-500">Select</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (textInput.trim()) submitFinalAnswer(textInput.trim());
            }}
            disabled={!textInput.trim()}
            className="w-full h-12 rounded-2xl bg-violet-500 disabled:opacity-40 text-white font-athletic text-xl font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Submit Answer
          </button>
        </div>
      ) : (
        /* Feedback Card */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            className={`p-4 rounded-3xl border ${
              isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : 'bg-rose-950/40 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {isCorrect ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle size={24} />
                </div>
              )}
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider block ${
                    isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isCorrect
                    ? 'Unscrambled!'
                    : `Incorrect · Answer: ${selectedAnswer || 'Timeout'}`}
                </span>
                <h3 className="font-athletic text-2xl font-black text-white uppercase leading-none">
                  {question.correctAnswer}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-black/30 p-3 rounded-2xl border border-white/5">
              {question.explanation}
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 hover:from-violet-400 hover:to-violet-300 text-white font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
          >
            <span>
              {questionIndex + 1 < totalQuestions ? 'Next Anagram' : 'Finish Match'}
            </span>
            <ArrowRight size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
};
