/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  GameModeId,
  GameSettings,
  AnyQuestion,
  UserProfile,
  Player,
  BattleRoomState,
} from './types/football';
import { storageService } from './services/storageService';
import { gameService } from './services/gameService';
import { soundService } from './services/soundService';
import { multiplayerService } from './services/multiplayerService';
import {
  getPlayerPool,
  hasCachedPlayerPool,
  wasPoolQuotaExceeded,
} from './services/playerPoolService';
import { isQuestionGenQuotaCoolingDown } from './services/questionGeneratorService';

import { TopHeader } from './components/TopHeader';
import { BottomNav, TabId } from './components/BottomNav';
import { SettingsModal } from './components/SettingsModal';

import { HomeScreen } from './screens/HomeScreen';
import { GameSetupScreen, getLockedInputMode } from './screens/GameSetupScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MultiplayerScreen, MultiplayerTopBar } from './screens/MultiplayerScreen';

import { ThreeClubsGame } from './games/ThreeClubsGame';
import { CareerPathGame } from './games/CareerPathGame';
import { GuessPlayerGame } from './games/GuessPlayerGame';
import { FootballQuizGame } from './games/FootballQuizGame';
import { JumbledNameGame } from './games/JumbledNameGame';
import { TicTacToeGame } from './games/TicTacToeGame';

type ScreenState = 'tabs' | 'setup' | 'playing';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabId>('home');
  const [screenState, setScreenState] = useState<ScreenState>('tabs');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('three-clubs');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Dynamic 5-league player pool state
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [poolReady, setPoolReady] = useState<boolean>(() => hasCachedPlayerPool());
  const [poolProgress, setPoolProgress] = useState<{
    done: number;
    total: number;
    league: string;
  }>({ done: 0, total: 5, league: '' });

  // Single-player async question loading, full-time transition, & feedback state
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [showFullTime, setShowFullTime] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullTimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active single-player session state
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    mode: 'three-clubs',
    difficulty: 'expert',
    questionCount: 10,
    timerSeconds: 30,
    inputMode: 'text',
  });
  const [sessionQuestions, setSessionQuestions] = useState<AnyQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Multiplayer battle state
  const [battleRoom, setBattleRoom] = useState<BattleRoomState | null>(null);
  const [mpQuestionIndex, setMpQuestionIndex] = useState<number>(0);
  const [mpError, setMpError] = useState<string | null>(null);
  const lastMpModeRef = useRef<string>('');

  // User profile
  const [profile, setProfile] = useState<UserProfile>(storageService.getProfile());

  useEffect(() => {
    let active = true;
    getPlayerPool((done, total, league) => {
      if (active) {
        setPoolProgress({ done, total, league });
      }
    }).then((pool) => {
      if (active) {
        setPlayerPool(pool);
        setPoolReady(true);
        if (wasPoolQuotaExceeded()) {
          showBottomToast('Gemini quota reached — using offline player database');
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsubRoom = multiplayerService.subscribe((room) => {
      setBattleRoom(room);
      if (room) {
        setMpError(null);
        const modeKey = `${room.code}:${room.phase}:${room.currentModeIndex}`;
        if (room.phase === 'playing' && lastMpModeRef.current !== modeKey) {
          lastMpModeRef.current = modeKey;
          setMpQuestionIndex(0);
        } else if (room.phase !== 'playing') {
          lastMpModeRef.current = modeKey;
        }
      } else {
        lastMpModeRef.current = '';
      }
    });

    const unsubError = multiplayerService.subscribeError((err) => {
      setMpError(err);
      showBottomToast(err);
    });

    // Support direct ?room=CODE invite links
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('room');
    if (inviteCode && inviteCode.trim().length >= 4) {
      setCurrentTab('friends');
      multiplayerService.joinRoom(inviteCode.trim().toUpperCase(), storageService.getProfile());
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    return () => {
      unsubRoom();
      unsubError();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (fullTimeTimerRef.current) clearTimeout(fullTimeTimerRef.current);
    };
  }, []);

  const showBottomToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Single-Player Mode Selection from Home
  const handleSelectMode = (mode: GameModeId) => {
    setSelectedMode(mode);

    if (mode === 'tictactoe') {
      setGameSettings({
        mode: 'tictactoe',
        difficulty: 'expert',
        questionCount: 10,
        timerSeconds: 0,
        inputMode: 'text',
      });
      setSessionQuestions([]);
      setQuestionIndex(0);
      setScreenState('playing');
      return;
    }

    setScreenState('setup');
  };

  // Start Single-Player Game from Setup (Async Gemini + Seed Bank Fallback)
  const handleStartGame = async (settings: GameSettings) => {
    if (settings.mode === 'tictactoe') {
      handleSelectMode('tictactoe');
      return;
    }

    setIsLoadingQuestions(true);
    const { questions, source } = await gameService.loadQuestions(
      settings.mode,
      'expert',
      settings.questionCount
    );
    setIsLoadingQuestions(false);

    if (questions.length === 0) {
      showBottomToast('Could not load questions. Please try again.');
      return;
    }

    if (source === 'cached') {
      showBottomToast(
        isQuestionGenQuotaCoolingDown()
          ? 'Gemini quota reached — playing from offline seed questions'
          : 'Playing from cached questions'
      );
    }

    setGameSettings({
      ...settings,
      difficulty: 'expert',
      inputMode: getLockedInputMode(settings.mode),
    });
    setSessionQuestions(questions);
    setQuestionIndex(0);
    setScreenState('playing');
  };

  // Handle Single-Player answer submitted — return Home via 1.5s Full Time overlay on final question
  const handleAnswerSubmitted = (_isCorrect: boolean) => {
    if (questionIndex + 1 < sessionQuestions.length) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setShowFullTime(true);
      if (fullTimeTimerRef.current) clearTimeout(fullTimeTimerRef.current);
      fullTimeTimerRef.current = setTimeout(() => {
        setShowFullTime(false);
        setCurrentTab('home');
        setScreenState('tabs');
      }, 1500);
    }
  };

  // Handle Tic-Tac-Toe completion
  const handleTicTacToeComplete = () => {
    setCurrentTab('home');
    setScreenState('tabs');
  };

  // Multiplayer Handlers
  const handleCreateBattle = (config: {
    modes: GameModeId[];
    questionCount: 5 | 10 | 15;
    timerSeconds: number;
  }) => {
    setMpError(null);
    multiplayerService.createRoom({
      profile,
      modes: config.modes,
      questionCount: config.questionCount,
      timerSeconds: config.timerSeconds,
    });
  };

  const handleJoinBattle = (code: string) => {
    setMpError(null);
    multiplayerService.joinRoom(code, profile);
  };

  const handleMpAnswerSubmitted = (isCorrect: boolean, timeLeft?: number) => {
    if (!battleRoom) return;
    multiplayerService.submitAnswer(
      battleRoom.currentModeIndex,
      mpQuestionIndex,
      isCorrect,
      timeLeft
    );

    if (mpQuestionIndex + 1 < battleRoom.currentQuestions.length) {
      setMpQuestionIndex((prev) => prev + 1);
    } else {
      multiplayerService.completeMode(battleRoom.currentModeIndex);
    }
  };

  const handleQuitGame = () => {
    setShowQuitConfirm(true);
  };

  const confirmQuitGame = () => {
    soundService.playTap();
    setShowQuitConfirm(false);
    if (battleRoom) {
      multiplayerService.leaveRoom();
    }
    setScreenState('tabs');
  };

  const handleProfileReset = () => {
    setProfile(storageService.getProfile());
  };

  const currentQuestion = sessionQuestions[questionIndex];

  const renderQuestionMode = (params: {
    mode: GameModeId;
    question: AnyQuestion;
    qIndex: number;
    total: number;
    settings: GameSettings;
    onSubmitted: (isCorrect: boolean, timeLeft?: number) => void;
  }) => {
    const { mode, question, qIndex, total, settings, onSubmitted } = params;
    switch (mode) {
      case 'three-clubs':
        return (
          <ThreeClubsGame
            question={question as any}
            questionIndex={qIndex}
            totalQuestions={total}
            settings={settings}
            playerPool={playerPool}
            onAnswerSubmitted={onSubmitted}
            onQuit={handleQuitGame}
          />
        );
      case 'career-path':
        return (
          <CareerPathGame
            question={question as any}
            questionIndex={qIndex}
            totalQuestions={total}
            settings={settings}
            playerPool={playerPool}
            onAnswerSubmitted={onSubmitted}
            onQuit={handleQuitGame}
          />
        );
      case 'guess-player':
        return (
          <GuessPlayerGame
            question={question as any}
            questionIndex={qIndex}
            totalQuestions={total}
            settings={settings}
            playerPool={playerPool}
            onAnswerSubmitted={onSubmitted}
            onQuit={handleQuitGame}
          />
        );
      case 'football-quiz':
      case 'transfer-quiz':
      case 'shirt-number':
        return (
          <FootballQuizGame
            question={question as any}
            questionIndex={qIndex}
            totalQuestions={total}
            settings={settings}
            onAnswerSubmitted={onSubmitted}
            onQuit={handleQuitGame}
          />
        );
      case 'jumbled-name':
        return (
          <JumbledNameGame
            question={question as any}
            questionIndex={qIndex}
            totalQuestions={total}
            settings={settings}
            playerPool={playerPool}
            onAnswerSubmitted={onSubmitted}
            onQuit={handleQuitGame}
          />
        );
      default:
        return null;
    }
  };

  if (!poolReady) {
    return (
      <div className="min-h-screen bg-[#070D18] flex items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <div className="space-y-1">
            <h1 className="font-athletic text-2xl font-bold uppercase tracking-wider text-white">
              Building Player Database
            </h1>
            <p className="text-xs text-slate-400">
              {poolProgress.league
                ? `Loading ${poolProgress.league} (${poolProgress.done}/${poolProgress.total})`
                : 'Connecting to Gemini AI...'}
            </p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i < poolProgress.done ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mpCurrentPlayer = battleRoom?.players.find((p) => p.playerId === profile.id);
  const isPlayingMultiplayerQuestion =
    Boolean(battleRoom) &&
    battleRoom!.phase === 'playing' &&
    !mpCurrentPlayer?.finishedCurrentMode &&
    mpQuestionIndex < battleRoom!.currentQuestions.length;

  const mpActiveMode = battleRoom
    ? battleRoom.modes[battleRoom.currentModeIndex]
    : 'three-clubs';

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-start antialiased text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Mobile-First Frame Container */}
      <div className="w-full max-w-md min-h-screen bg-[#070D18] border-x border-white/5 relative flex flex-col shadow-2xl">
        {/* Sticky Header */}
        {!battleRoom && screenState !== 'playing' && (
          <TopHeader
            profile={profile}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateToProfile={() => {
              setCurrentTab('profile');
              setScreenState('tabs');
            }}
            onSoundChanged={(enabled) =>
              setProfile((prev) => ({ ...prev, soundEnabled: enabled }))
            }
          />
        )}

        {/* Dynamic Screen Viewport */}
        <main
          className={`flex-1 w-full flex flex-col ${
            battleRoom || screenState === 'playing' ? 'game-safe' : ''
          }`}
>          {battleRoom ? (
            isPlayingMultiplayerQuestion ? (
              <>
                <MultiplayerTopBar room={battleRoom} profile={profile} />
                {renderQuestionMode({
                  mode: mpActiveMode,
                  question: battleRoom.currentQuestions[mpQuestionIndex],
                  qIndex: mpQuestionIndex,
                  total: battleRoom.currentQuestions.length,
                  settings: {
                    mode: mpActiveMode,
                    difficulty: 'expert',
                    questionCount: battleRoom.questionCount,
                    timerSeconds: battleRoom.timerSeconds,
                    inputMode: getLockedInputMode(mpActiveMode),
                  },
                  onSubmitted: handleMpAnswerSubmitted,
                })}
              </>
            ) : (
              <MultiplayerScreen
                room={battleRoom}
                profile={profile}
                onStartBattle={() => multiplayerService.startBattle()}
                onResetLobby={() => multiplayerService.resetToLobby()}
                onForceAdvance={() =>
                  multiplayerService.forceAdvanceMode(battleRoom.currentModeIndex)
                }
                onLeaveRoom={() => {
                  multiplayerService.leaveRoom();
                  setCurrentTab('friends');
                  setScreenState('tabs');
                }}
              />
            )
          ) : (
            <>
              {screenState === 'tabs' && (
                <>
                  {currentTab === 'home' && (
                    <HomeScreen
                      profile={profile}
                      onSelectMode={handleSelectMode}
                    />
                  )}
                  {currentTab === 'friends' && (
                    <FriendsScreen
                      onCreateBattle={handleCreateBattle}
                      onJoinBattle={handleJoinBattle}
                      roomError={mpError}
                    />
                  )}
                  {currentTab === 'profile' && (
                    <ProfileScreen
                      profile={profile}
                      onProfileUpdated={(updated) => setProfile(updated)}
                    />
                  )}
                </>
              )}

              {screenState === 'setup' && (
                <GameSetupScreen
                  mode={selectedMode}
                  onBack={() => setScreenState('tabs')}
                  onStartGame={handleStartGame}
                />
              )}

              {screenState === 'playing' && gameSettings.mode === 'tictactoe' && (
                <TicTacToeGame
                  playerPool={playerPool}
                  onGameComplete={handleTicTacToeComplete}
                  onQuit={handleQuitGame}
                />
              )}

              {screenState === 'playing' &&
                gameSettings.mode !== 'tictactoe' &&
                currentQuestion &&
                renderQuestionMode({
                  mode: gameSettings.mode,
                  question: currentQuestion,
                  qIndex: questionIndex,
                  total: sessionQuestions.length,
                  settings: gameSettings,
                  onSubmitted: handleAnswerSubmitted,
                })}
            </>
          )}
        </main>

        {/* Fixed 3-Tab Mobile Bottom Navigation */}
        {!battleRoom && screenState === 'tabs' && (
          <BottomNav
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Global Settings & Rules Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onProfileReset={handleProfileReset}
          onSoundChanged={(enabled) =>
            setProfile((prev) => ({ ...prev, soundEnabled: enabled }))
          }
        />

        {/* Generating Fresh Questions Loading Overlay */}
        {isLoadingQuestions && (
          <div className="fixed inset-0 bg-[#070D18]/95 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <p className="text-slate-200 text-sm font-semibold">
              Generating fresh questions...
            </p>
            <p className="text-slate-500 text-xs">Powered by Gemini AI</p>
          </div>
        )}

        {/* 1.5s Full Time Overlay on Single-Player Match Completion */}
        {showFullTime && (
          <div className="fixed inset-0 bg-[#070D18]/95 z-50 flex flex-col items-center justify-center gap-2 px-6 text-center animate-fade-in">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Match Complete
            </span>
            <h2 className="font-athletic text-5xl font-black uppercase tracking-wider text-white">
              Full Time
            </h2>
          </div>
        )}

        {/* Quit Match Confirmation Modal */}
        {showQuitConfirm && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQuitConfirm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-3xl bg-[#0F172A] border border-white/10 p-5 space-y-4 shadow-2xl text-center"
            >
              <div>
                <h3 className="font-athletic text-xl font-bold uppercase text-white">
                  {battleRoom ? 'Leave Battle Room?' : 'Quit Current Match?'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {battleRoom
                    ? 'You will exit the live multiplayer battle.'
                    : 'Your current match progress will be discarded.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    soundService.playTap();
                    setShowQuitConfirm(false);
                  }}
                  className="min-h-[44px] rounded-2xl bg-slate-800 text-slate-200 text-xs font-semibold"
                >
                  Keep Playing
                </button>
                <button
                  onClick={confirmQuitGame}
                  className="min-h-[44px] rounded-2xl bg-rose-500 text-white text-xs font-bold"
                >
                  {battleRoom ? 'Leave Battle' : 'Quit Match'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3-Second Bottom Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-max max-w-[90vw]">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl text-xs font-medium text-slate-200 backdrop-blur-md">
              {toastMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
