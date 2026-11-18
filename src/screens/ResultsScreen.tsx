import React, { useState, useEffect } from 'react';
import { GameResult } from '../types/football';
import { gameService } from '../services/gameService';
import { soundService } from '../services/soundService';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles,
} from 'lucide-react';

interface ResultsScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  onPlayAgain,
  onReturnHome,
}) => {
  const [showReview, setShowReview] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const modeInfo = gameService.getModeInfo(result.mode);

  useEffect(() => {
    soundService.playVictory();

    // Trigger celebratory confetti if accuracy >= 60%
    if (result.accuracy >= 60) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF'],
      });
    }
  }, [result.id]);

  const handleShare = () => {
    soundService.playTap();
    const text = `⚽ FOOTBALL IQ: I scored ${result.score} pts (${result.accuracy}% accuracy) in ${modeInfo.title}! Can you beat my football knowledge?`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const getIQRating = (acc: number): { title: string; color: string } => {
    if (acc >= 90) return { title: 'Ballon d\'Or Genius', color: '#F59E0B' };
    if (acc >= 75) return { title: 'Tactical Mastermind', color: '#10B981' };
    if (acc >= 50) return { title: 'Top Flight Starter', color: '#3B82F6' };
    return { title: 'Academy Prospect', color: '#94A3B8' };
  };

  const rating = getIQRating(result.accuracy);

  return (
    <div className="px-4 py-4 space-y-5 pb-28 animate-fade-in">
      {/* Victory Header Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#131E35] via-slate-900 to-[#0B1220] border border-white/10 p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle Pitch radial light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-3 shadow-lg">
          <Trophy size={32} />
        </div>

        <span
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-2 inline-block"
          style={{
            borderColor: rating.color + '40',
            color: rating.color,
            backgroundColor: rating.color + '15',
          }}
        >
          {rating.title}
        </span>

        <h1 className="font-athletic text-5xl font-black text-white tracking-tight leading-none">
          {result.score}{' '}
          <span className="text-xl font-normal text-emerald-400">PTS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {modeInfo.shortTitle} · {result.difficulty.toUpperCase()}
        </p>

        {/* 4 Stat Metric Cards */}
        <div className="mt-5 grid grid-cols-4 gap-2 pt-4 border-t border-white/10 text-center">
          <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">
              Correct
            </span>
            <span className="font-mono-numbers text-base font-bold text-emerald-400 block mt-0.5">
              {result.correctCount}
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">
              Missed
            </span>
            <span className="font-mono-numbers text-base font-bold text-rose-400 block mt-0.5">
              {result.questionCount - result.correctCount}
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">
              Accuracy
            </span>
            <span className="font-mono-numbers text-base font-bold text-amber-300 block mt-0.5">
              {result.accuracy}%
            </span>
          </div>

          <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">
              Time
            </span>
            <span className="font-mono-numbers text-base font-bold text-slate-300 block mt-0.5">
              {result.totalTimeSeconds}s
            </span>
          </div>
        </div>

        {/* Share Button */}
        <div className="mt-4 pt-2">
          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 size={14} />
            <span>{copiedShare ? 'Copied to Clipboard!' : 'Share Score with Friends'}</span>
          </button>
        </div>
      </div>

      {/* Review Answers Accordion */}
      <div className="space-y-2">
        <button
          onClick={() => {
            soundService.playTap();
            setShowReview(!showReview);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <span>Review Answers & Explanations</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono-numbers">
              {result.results.length} Questions
            </span>
          </div>
          {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showReview && (
          <div className="space-y-3 pt-1 animate-fade-in">
            {result.results.map((res, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border ${
                  res.isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {res.isCorrect ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white leading-tight">
                      Q{idx + 1}: {res.question.question}
                    </span>
                  </div>
                  <span
                    className={`font-mono-numbers text-xs font-bold shrink-0 ${
                      res.isCorrect ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    +{res.pointsEarned} pts
                  </span>
                </div>

                <div className="text-[11px] space-y-1 mt-2 pl-6">
                  <div>
                    <span className="text-slate-500">Your answer: </span>
                    <span
                      className={`font-semibold ${
                        res.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {res.userAnswer || 'None'}
                    </span>
                  </div>
                  {!res.isCorrect && (
                    <div>
                      <span className="text-slate-500">Correct answer: </span>
                      <span className="font-semibold text-emerald-400">
                        {res.question.correctAnswer}
                      </span>
                    </div>
                  )}
                  <p className="text-slate-400 mt-1 italic border-t border-white/5 pt-1">
                    {res.question.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => {
            soundService.playTap();
            onPlayAgain();
          }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-athletic text-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          <RotateCcw size={20} />
          <span>Play Again</span>
        </button>

        <button
          onClick={() => {
            soundService.playTap();
            onReturnHome();
          }}
          className="w-full h-12 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Home size={16} />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};
