import React, { useState, useEffect, useRef } from 'react';
import {
  CareerPathQuestion,
  GameSettings,
  Player,
} from '../types/football';
import { gameService } from '../services/gameService';
import { searchPlayerPool } from '../services/playerPoolService';
import { soundService } from '../services/soundService';
import {
  ArrowDown,
  Lightbulb,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface CareerPathGameProps {
  question: CareerPathQuestion;
  questionIndex: number;
  totalQuestions: number;
  settings: GameSettings;
  playerPool: Player[];
  onAnswerSubmitted: (isCorrect: boolean, timeLeft?: number) => void;
  onQuit: () => void;
}

export const CareerPathGame: React.FC<CareerPathGameProps> = ({
  question,
  questionIndex,
  totalQuestions,
  settings,
  playerPool,
  onAnswerSubmitted,
  onQuit,
}) => {
  const [revealedClubsCount, setRevealedClubsCount] = useState<number>(2);
  const [textInput, setTextInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timerSeconds);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCorrectRef = useRef<boolean>(false);
  const answerTimeLeftRef = useRef<number>(settings.timerSeconds);
  const isAnsweredRef = useRef<boolean>(false);

  const totalClubs = question.clubs.length;

  useEffect(() => {
    setRevealedClubsCount(Math.min(2, totalClubs));
    setTextInput('');
    setSuggestions([]);
    setIsAnswered(false);
    isAnsweredRef.current = false;
    setIsCorrect(false);
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

  const handleRevealNextClub = () => {
    if (revealedClubsCount < totalClubs) {
      soundService.playTap();
      setRevealedClubsCount((prev) => prev + 1);
    }
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
    setIsAnswered(true);
    setIsCorrect(correct);
    setRevealedClubsCount(totalClubs);

    if (correct) {
      soundService.playCorrect();
    } else {
      soundService.playIncorrect();
    }
  };

  const handleContinue = () => {
    soundService.playTap();
    onAnswerSubmitted(latestCorrectRef.current, answerTimeLeftRef.current);
  };

  const handleRevealHint = () => {
    if (!question.hints || hintsRevealed >= question.hints.length) return;
    soundService.playTap();
    setHintsRevealed((prev) => prev + 1);
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
            Career Path{' '}
            <span className="text-white font-mono-numbers">
              {questionIndex + 1}
            </span>{' '}
            of {totalQuestions}
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
          Timeline
        </span>
      </div>

      {/* Timer Bar */}
      {settings.timerSeconds > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono-numbers">
              <Clock size={12} className={timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-400'} />
              <span>{timeLeft}s</span>
            </span>
            <span className="text-[10px] uppercase text-slate-500">
              Time Remaining
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-blue-400'
              }`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>
        </div>
      )}

      {/* Career Timeline Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-[#0A1222] border border-white/10 p-5 shadow-2xl relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            Timeline · {revealedClubsCount}/{totalClubs} Clubs
          </span>
          {!isAnswered && revealedClubsCount < totalClubs && (
            <button
              onClick={handleRevealNextClub}
              className="min-h-[36px] text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>Reveal Next Club</span>
              <ArrowDown size={12} />
            </button>
          )}
        </div>

        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Who is this footballer based on their career path?
        </h2>

        {/* Vertical Timeline Nodes */}
        <div className="space-y-2 relative pl-2">
          {question.clubs.slice(0, revealedClubsCount).map((club, idx) => (
            <div key={idx} className="relative flex items-center gap-3">
              <div className="relative flex flex-col items-center">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </div>
                {idx < revealedClubsCount - 1 && (
                  <div className="w-0.5 h-4 bg-blue-500/30 my-0.5" />
                )}
              </div>

              <div className="flex-1 p-2.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-athletic text-base font-bold text-white tracking-wide block leading-tight">
                    {club.clubName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-numbers">
                    {club.period}
                  </span>
                </div>

                {isAnswered && club.apps !== undefined && (
                  <div className="text-right text-[10px] text-slate-400">
                    <span className="font-mono-numbers text-emerald-400 font-semibold block">
                      {club.apps} apps
                    </span>
                    {club.goals !== undefined && (
                      <span className="font-mono-numbers">{club.goals} goals</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {!isAnswered && revealedClubsCount < totalClubs && (
            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500 font-medium">
                + {totalClubs - revealedClubsCount} more clubs hidden
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hints */}
      {question.hints && question.hints.length > 0 && (
        <div className="flex items-center justify-start">
          <button
            onClick={handleRevealHint}
            disabled={isAnswered || hintsRevealed >= question.hints.length}
            className={`min-h-[44px] flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
              hintsRevealed >= question.hints.length
                ? 'bg-slate-900 text-slate-500 border-white/5'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 active:scale-95'
            }`}
          >
            <Lightbulb size={14} className="text-amber-400" />
            <span>
              {hintsRevealed >= question.hints.length
                ? 'All Hints Revealed'
                : `Hint (${hintsRevealed}/${question.hints.length})`}
            </span>
          </button>
        </div>
      )}

      {hintsRevealed > 0 && question.hints && (
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 animate-fade-in">
          {question.hints.slice(0, hintsRevealed).map((hint, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-amber-200">
              <span className="font-bold text-amber-400">Hint {idx + 1}:</span>
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
              placeholder="Type footballer name..."
              className="w-full h-13 pl-11 pr-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
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
                  className="w-full min-h-[44px] text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-500/15 hover:text-blue-300 flex items-center justify-between"
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
            className="w-full h-12 rounded-2xl bg-blue-500 disabled:opacity-40 text-black font-athletic text-xl font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Submit Guess
          </button>
        </div>
      ) : (
        /* Feedback Card */
        <div className="space-y-4 animate-fade-in">
          <div
            className={`p-4 rounded-3xl border ${
              isCorrect
                ? 'bg-blue-950/40 border-blue-500/40'
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
                    isCorrect ? 'text-blue-400' : 'text-rose-400'
                  }`}
                >
                  {isCorrect ? 'Correct' : 'Incorrect'}
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
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <span>
              {questionIndex + 1 < totalQuestions ? 'Next Player' : 'Finish Match'}
            </span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
