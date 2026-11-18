import React, { useState, useEffect, useRef } from 'react';
import {
  ThreeClubsQuestion,
  GameSettings,
  Player,
} from '../types/football';
import { gameService } from '../services/gameService';
import { searchPlayerPool } from '../services/playerPoolService';
import { soundService } from '../services/soundService';
import { ClubBadge } from '../components/ClubBadge';
import {
  Lightbulb,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface ThreeClubsGameProps {
  question: ThreeClubsQuestion;
  questionIndex: number;
  totalQuestions: number;
  settings: GameSettings;
  playerPool: Player[];
  onAnswerSubmitted: (isCorrect: boolean, timeLeft?: number) => void;
  onQuit: () => void;
}

export const ThreeClubsGame: React.FC<ThreeClubsGameProps> = ({
  question,
  questionIndex,
  totalQuestions,
  settings,
  playerPool,
  onAnswerSubmitted,
  onQuit,
}) => {
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

  const club1 = gameService.getClub(question.clubs[0]);
  const club2 = gameService.getClub(question.clubs[1]);
  const club3 = gameService.getClub(question.clubs[2]);

  useEffect(() => {
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
            Question{' '}
            <span className="text-white font-mono-numbers">
              {questionIndex + 1}
            </span>{' '}
            of {totalQuestions}
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Three Clubs
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
            <span className="text-[10px] uppercase text-slate-500">Time Remaining</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>
        </div>
      )}

      {/* The 3 Clubs Arena Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#131E35] to-[#0A1222] border border-white/10 p-5 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-1">
            Three Clubs · One Player
          </span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Which footballer represented all three clubs?
          </h2>
        </div>

        {/* 3 Clubs Display */}
        <div className="grid grid-cols-3 gap-2 items-center justify-items-center py-2 px-1">
          {club1 && <ClubBadge club={club1} size="md" />}
          {club2 && <ClubBadge club={club2} size="md" />}
          {club3 && <ClubBadge club={club3} size="md" />}
        </div>
      </div>

      {/* Hints Section */}
      {question.hints && question.hints.length > 0 && (
        <div className="space-y-2">
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
                  : `Reveal Hint (${hintsRevealed}/${question.hints.length})`}
              </span>
            </button>
          </div>

          {hintsRevealed > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 animate-fade-in">
              {question.hints.slice(0, hintsRevealed).map((hint, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-amber-200">
                  <span className="font-bold text-amber-400">Hint {idx + 1}:</span>
                  <span>{hint}</span>
                </div>
              ))}
            </div>
          )}
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
              className="w-full h-13 pl-11 pr-4 rounded-2xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
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
                  className="w-full min-h-[44px] text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-300 flex items-center justify-between"
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
            className="w-full h-12 rounded-2xl bg-emerald-500 disabled:opacity-40 text-black font-athletic text-xl font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Submit Answer
          </button>
        </div>
      ) : (
        /* Post-Answer Feedback Card */
        <div className="space-y-4 animate-fade-in">
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

            {question.playerClubStints && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                {Object.entries(question.playerClubStints).map(([clubId, stint]) => {
                  const c = gameService.getClub(clubId);
                  return (
                    <div key={clubId} className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                      <span className="font-bold text-slate-300 block truncate">
                        {c?.shortName || clubId}
                      </span>
                      <span className="text-emerald-400 font-mono-numbers block mt-0.5">
                        {stint}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleContinue}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <span>
              {questionIndex + 1 < totalQuestions ? 'Next Question' : 'Finish Match'}
            </span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
