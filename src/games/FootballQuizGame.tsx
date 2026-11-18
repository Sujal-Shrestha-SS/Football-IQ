import React, { useState, useEffect, useRef } from 'react';
import {
  FootballQuizQuestion,
  TransferQuizQuestion,
  ShirtNumberQuestion,
  GameSettings,
} from '../types/football';
import { gameService } from '../services/gameService';
import { soundService } from '../services/soundService';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Check,
  X,
} from 'lucide-react';

type QuizQuestion =
  | FootballQuizQuestion
  | TransferQuizQuestion
  | ShirtNumberQuestion;

interface FootballQuizGameProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  settings: GameSettings;
  onAnswerSubmitted: (isCorrect: boolean, timeLeft?: number) => void;
  onQuit: () => void;
}

export const FootballQuizGame: React.FC<FootballQuizGameProps> = ({
  question,
  questionIndex,
  totalQuestions,
  settings,
  onAnswerSubmitted,
  onQuit,
}) => {
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timerSeconds);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCorrectRef = useRef<boolean>(false);
  const answerTimeLeftRef = useRef<number>(settings.timerSeconds);
  const isAnsweredRef = useRef<boolean>(false);

  const modeInfo = gameService.getModeInfo(question.mode);
  const accentColor = modeInfo.accentColor;

  useEffect(() => {
    // Fisher-Yates shuffle options once on question change
    if (question.options && question.options.length > 0) {
      const opts = [...question.options];
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      setShuffledOptions(opts);
    } else {
      setShuffledOptions([question.correctAnswer]);
    }

    setSelectedAnswer('');
    setIsAnswered(false);
    isAnsweredRef.current = false;
    setIsCorrect(false);
    answerTimeLeftRef.current = settings.timerSeconds;
    setTimeLeft(settings.timerSeconds);

    if (settings.timerSeconds > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!isAnsweredRef.current) {
              handleSelectOption('');
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

  const handleSelectOption = (option: string) => {
    if (isAnsweredRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = option.trim() === question.correctAnswer.trim();

    isAnsweredRef.current = true;
    latestCorrectRef.current = correct;
    answerTimeLeftRef.current = option === '' ? 0 : timeLeft;
    setSelectedAnswer(option);
    setIsAnswered(true);
    setIsCorrect(correct);

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
            {modeInfo.shortTitle}{' '}
            <span className="text-white font-mono-numbers">
              {questionIndex + 1}
            </span>{' '}
            of {totalQuestions}
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {question.category}
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
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${timerRatio}%`,
                backgroundColor: timeLeft <= 5 ? '#F43F5E' : accentColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Question Card */}
      <div
        className="rounded-3xl bg-slate-900 border p-5 shadow-2xl relative"
        style={{
          background: `linear-gradient(180deg, ${accentColor}15 0%, #0F172A 55%, #090E1A 100%)`,
          borderColor: `${accentColor}35`,
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full border"
            style={{
              color: accentColor,
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}35`,
            }}
          >
            {question.category}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Post-2010 Era
          </span>
        </div>

        <h2 className="text-base font-bold text-white tracking-tight leading-snug">
          {question.question}
        </h2>
      </div>

      {/* 4 Shuffled Multiple Choice Options */}
      <div className="grid grid-cols-1 gap-2.5">
        {shuffledOptions.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isTargetCorrect = option === question.correctAnswer;

          let btnClasses =
            'bg-slate-900 border-white/10 hover:bg-slate-800/80 text-slate-100';
          let badge = (
            <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 text-xs font-bold font-athletic shrink-0">
              {String.fromCharCode(65 + idx)}
            </span>
          );

          if (isAnswered) {
            if (isTargetCorrect) {
              btnClasses =
                'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500';
              badge = (
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-black flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
              );
            } else if (isSelected && !isTargetCorrect) {
              btnClasses =
                'bg-rose-950/70 border-rose-500 text-rose-200 ring-1 ring-rose-500';
              badge = (
                <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <X size={14} strokeWidth={3} />
                </div>
              );
            } else {
              btnClasses = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-60';
            }
          }

          return (
            <button
              key={`${question.id}-${option}`}
              disabled={isAnswered}
              onClick={() => handleSelectOption(option)}
              className={`w-full min-h-[54px] px-4 py-3 rounded-2xl border active:scale-[0.98] transition-all text-left flex items-center justify-between gap-3 ${btnClasses}`}
            >
              <div className="flex items-center gap-3">
                {badge}
                <span className="font-semibold text-sm leading-snug">
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Post-Answer Explanation Box & Next Button */}
      {isAnswered && (
        <div className="space-y-4 animate-fade-in pt-1">
          <div
            className={`p-4 rounded-3xl border ${
              isCorrect
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-rose-950/30 border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              {isCorrect ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={18} className="text-rose-400 shrink-0" />
              )}
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isCorrect
                  ? 'Correct Answer'
                  : `Incorrect · Answer: ${question.correctAnswer}`}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-2xl border border-white/5">
              {question.explanation}
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full h-14 rounded-2xl text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            style={{ backgroundColor: accentColor }}
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
