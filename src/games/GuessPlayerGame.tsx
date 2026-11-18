import React, { useState, useEffect, useRef } from 'react';
import {
  GuessPlayerQuestion,
  GameSettings,
  Player,
} from '../types/football';
import { gameService } from '../services/gameService';
import { searchPlayerPool } from '../services/playerPoolService';
import { soundService } from '../services/soundService';
import {
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  User,
  Trophy,
  BarChart,
  Eye,
  Sparkles,
} from 'lucide-react';

interface GuessPlayerGameProps {
  question: GuessPlayerQuestion;
  questionIndex: number;
  totalQuestions: number;
  settings: GameSettings;
  playerPool: Player[];
  onAnswerSubmitted: (isCorrect: boolean, timeLeft?: number) => void;
  onQuit: () => void;
}

export const GuessPlayerGame: React.FC<GuessPlayerGameProps> = ({
  question,
  questionIndex,
  totalQuestions,
  settings,
  playerPool,
  onAnswerSubmitted,
  onQuit,
}) => {
  const isSilhouette = question.subType === 'silhouette';

  const [revealedCluesCount, setRevealedCluesCount] = useState<number>(
    question.subType === 'progressive' ? 1 : question.clues.length
  );
  const [silhouetteClearCount, setSilhouetteClearCount] = useState<number>(0);
  const [silhouetteAutoStepMs, setSilhouetteAutoStepMs] = useState<number>(8);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const [wrongGuessFlash, setWrongGuessFlash] = useState<string | null>(null);

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timerSeconds);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silhouetteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCorrectRef = useRef<boolean>(false);
  const answerTimeLeftRef = useRef<number>(settings.timerSeconds);
  const isAnsweredRef = useRef<boolean>(false);
  const silhouetteClearRef = useRef<number>(0);

  useEffect(() => {
    setRevealedCluesCount(
      question.subType === 'progressive' ? 1 : question.clues.length
    );
    setSilhouetteClearCount(0);
    silhouetteClearRef.current = 0;
    setSilhouetteAutoStepMs(8);
    setWrongAttempts([]);
    setWrongGuessFlash(null);

    setSelectedAnswer('');
    setTextInput('');
    setSuggestions([]);
    setIsAnswered(false);
    isAnsweredRef.current = false;
    setIsCorrect(false);
    answerTimeLeftRef.current = settings.timerSeconds;
    setTimeLeft(settings.timerSeconds);

    if (timerRef.current) clearInterval(timerRef.current);
    if (silhouetteTimerRef.current) clearInterval(silhouetteTimerRef.current);

    if (settings.timerSeconds > 0) {
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

    if (question.subType === 'silhouette') {
      silhouetteTimerRef.current = setInterval(() => {
        if (isAnsweredRef.current) return;
        setSilhouetteAutoStepMs((sec) => {
          if (sec <= 1) {
            setSilhouetteClearCount((c) => {
              const next = Math.min(question.clues.length, c + 1);
              silhouetteClearRef.current = next;
              return next;
            });
            return 8;
          }
          return sec - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silhouetteTimerRef.current) clearInterval(silhouetteTimerRef.current);
    };
  }, [question.id]);

  const handleRevealNextClue = () => {
    if (revealedCluesCount < question.clues.length) {
      soundService.playTap();
      setRevealedCluesCount((prev) => prev + 1);
    }
  };

  const handleTextChange = (val: string) => {
    setTextInput(val);
    setWrongGuessFlash(null);
    if (val.trim().length >= 2) {
      const results = searchPlayerPool(playerPool, val, 5);
      setSuggestions(results.map((p) => p.name));
    } else {
      setSuggestions([]);
    }
  };

  const handleAttemptAnswer = (ans: string) => {
    if (isAnsweredRef.current) return;

    const correct = gameService.validateAnswer(ans, question.correctAnswer);

    if (isSilhouette && !correct && ans !== '') {
      const nextWrong = [...wrongAttempts, ans];
      const canUnblurMore = silhouetteClearRef.current < question.clues.length;

      if (canUnblurMore && nextWrong.length < 3) {
        soundService.playWrong();
        setWrongAttempts(nextWrong);
        setWrongGuessFlash(ans);
        setTextInput('');
        setSuggestions([]);
        setSilhouetteClearCount((prev) => {
          const next = Math.min(question.clues.length, prev + 1);
          silhouetteClearRef.current = next;
          return next;
        });
        setSilhouetteAutoStepMs(8);
        return;
      }
    }

    submitFinalAnswer(ans);
  };

  const submitFinalAnswer = (ans: string) => {
    if (isAnsweredRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (silhouetteTimerRef.current) clearInterval(silhouetteTimerRef.current);

    const correct = gameService.validateAnswer(ans, question.correctAnswer);

    isAnsweredRef.current = true;
    latestCorrectRef.current = correct;
    answerTimeLeftRef.current = ans === '' ? 0 : timeLeft;
    setSelectedAnswer(ans);
    setIsAnswered(true);
    setIsCorrect(correct);
    setRevealedCluesCount(question.clues.length);
    setSilhouetteClearCount(question.clues.length);
    silhouetteClearRef.current = question.clues.length;
    setWrongGuessFlash(null);

    if (correct) {
      soundService.playCorrect();
    } else {
      soundService.playWrong();
    }
  };

  const handleContinue = () => {
    soundService.playTap();
    onAnswerSubmitted(latestCorrectRef.current, answerTimeLeftRef.current);
  };

  const subTypeBadge = {
    clues: { label: 'Scouting Clues', icon: User },
    stats: { label: 'Career Statistics', icon: BarChart },
    progressive: { label: 'Progressive Hints', icon: Eye },
    career: { label: 'Career History', icon: Trophy },
    silhouette: { label: 'Silhouette Reveal', icon: Sparkles },
  }[question.subType] || { label: 'Scouting Clues', icon: User };

  const SubIcon = subTypeBadge.icon;
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
            Guess Player{' '}
            <span className="text-white font-mono-numbers">
              {questionIndex + 1}
            </span>{' '}
            of {totalQuestions}
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
          {subTypeBadge.label}
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
              Time Remaining
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>
        </div>
      )}

      {/* Silhouette & Scouting Dossier Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#101827] to-[#0A101C] border border-white/10 p-5 shadow-2xl relative">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner relative">
              <User size={30} className="opacity-90" />
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-900 text-[9px] font-bold border border-white/10 text-white">
                ?
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <SubIcon size={12} />
                <span>{subTypeBadge.label}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                {question.question}
              </h2>
            </div>
          </div>
        </div>

        {isSilhouette && !isAnswered && (
          <div className="mb-3 px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-[11px]">
            <span className="text-amber-300 font-semibold">
              {silhouetteClearCount < question.clues.length
                ? `Next clue unblurs in ${silhouetteAutoStepMs}s`
                : 'All 5 scouting clues unblurred'}
            </span>
            <span className="font-mono-numbers text-slate-300">
              {silhouetteClearCount}/{question.clues.length}
            </span>
          </div>
        )}

        {/* Clues Table */}
        <div className="space-y-2">
          {question.clues.slice(0, revealedCluesCount).map((clue, idx) => {
            const isBlurred = isSilhouette && !isAnswered && idx >= silhouetteClearCount;
            const blurPx = isBlurred
              ? Math.max(4, 8 - Math.max(0, silhouetteClearCount - idx))
              : 0;

            return (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col gap-0.5 overflow-hidden transition-all duration-500"
              >
                <span
                  className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider transition-all duration-500"
                  style={isBlurred ? { filter: `blur(${blurPx}px)` } : undefined}
                >
                  {clue.label}
                </span>
                <span
                  className="text-xs font-semibold text-slate-100 transition-all duration-500 select-none"
                  style={isBlurred ? { filter: `blur(${blurPx}px)` } : undefined}
                >
                  {clue.value}
                </span>
              </div>
            );
          })}

          {!isAnswered &&
            question.subType === 'progressive' &&
            revealedCluesCount < question.clues.length && (
              <button
                onClick={handleRevealNextClue}
                className="w-full min-h-[44px] py-2.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs font-semibold hover:bg-amber-500/15 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Eye size={14} />
                <span>
                  Reveal Next Clue ({revealedCluesCount + 1}/{question.clues.length})
                </span>
              </button>
            )}
        </div>

        {question.statsBreakdown && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-xs">
            {question.statsBreakdown.matches && (
              <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Appearances
                </span>
                <span className="font-mono-numbers text-sm font-bold text-white">
                  {question.statsBreakdown.matches}
                </span>
              </div>
            )}
            {question.statsBreakdown.goals && (
              <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Total Goals
                </span>
                <span className="font-mono-numbers text-sm font-bold text-emerald-400">
                  {question.statsBreakdown.goals}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {wrongGuessFlash && !isAnswered && (
        <div className="px-3 py-2 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between">
          <span>Not &ldquo;{wrongGuessFlash}&rdquo; — next clue unblurred!</span>
          <span className="font-mono-numbers text-rose-400 text-[10px]">
            Try again
          </span>
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
                  handleAttemptAnswer(textInput.trim());
                }
              }}
              placeholder="Type footballer name..."
              className="w-full h-13 pl-11 pr-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
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
                  onClick={() => handleAttemptAnswer(name)}
                  className="w-full min-h-[44px] text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-amber-500/15 hover:text-amber-300 flex items-center justify-between"
                >
                  <span>{name}</span>
                  <span className="text-[10px] text-slate-500">Select</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (textInput.trim()) handleAttemptAnswer(textInput.trim());
            }}
            disabled={!textInput.trim()}
            className="w-full h-12 rounded-2xl bg-amber-500 disabled:opacity-40 text-black font-athletic text-xl font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Submit Player
          </button>
        </div>
      ) : (
        /* Feedback Card */
        <div className="space-y-4 animate-fade-in">
          <div
            className={`p-4 rounded-3xl border ${
              isCorrect
                ? 'bg-amber-950/40 border-amber-500/40'
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
                    isCorrect ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {isCorrect
                    ? 'Correct'
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
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <span>
              {questionIndex + 1 < totalQuestions ? 'Next Challenge' : 'Finish Match'}
            </span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
