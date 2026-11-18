import { BattleRoomState, GameModeId, UserProfile } from '../types/football';

type RoomListener = (room: BattleRoomState | null) => void;
type ErrorListener = (error: string) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private room: BattleRoomState | null = null;
  private listeners = new Set<RoomListener>();
  private errorListeners = new Set<ErrorListener>();
  private pendingMessages: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private activeRoomCode: string | null = null;
  private lastProfile: UserProfile | null = null;
  private manualLeave = false;

  private getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin;
  return apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/ws';
}

  private ensureSocket(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualLeave = false;
    const socket = new WebSocket(this.getWsUrl());
    this.ws = socket;

    socket.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      // If reconnecting to an active room, rejoin first before flushing queue
      if (this.activeRoomCode && this.lastProfile && this.pendingMessages.length === 0) {
        socket.send(
          JSON.stringify({
            type: 'room:join',
            code: this.activeRoomCode,
            playerId: this.lastProfile.id,
            username: this.lastProfile.username,
            avatarId: this.lastProfile.avatarId,
          })
        );
      }
      while (this.pendingMessages.length > 0 && socket.readyState === WebSocket.OPEN) {
        const msg = this.pendingMessages.shift();
        if (msg) socket.send(msg);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room:state' && data.room) {
          this.room = data.room as BattleRoomState;
          this.activeRoomCode = this.room.code;
          this.notifyRoom();
        } else if (data.type === 'room:error' && data.error) {
          this.notifyError(String(data.error));
        }
      } catch {
        // Ignore malformed server frame
      }
    };

    socket.onclose = () => {
      if (this.ws === socket) {
        this.ws = null;
      }
      if (!this.manualLeave && this.activeRoomCode) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.ensureSocket();
        }, 1500);
      }
    };
  }

  private send(payload: Record<string, unknown>): void {
    const serialized = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
    } else {
      this.pendingMessages.push(serialized);
      this.ensureSocket();
    }
  }

  private notifyRoom(): void {
    for (const listener of this.listeners) {
      listener(this.room);
    }
  }

  private notifyError(err: string): void {
    for (const listener of this.errorListeners) {
      listener(err);
    }
  }

  subscribe(listener: RoomListener): () => void {
    this.listeners.add(listener);
    listener(this.room);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  getRoom(): BattleRoomState | null {
    return this.room;
  }

  createRoom(params: {
    profile: UserProfile;
    modes: GameModeId[];
    questionCount: 5 | 10 | 15;
    timerSeconds: number;
  }): void {
    this.lastProfile = params.profile;
    this.activeRoomCode = null;
    this.send({
      type: 'room:create',
      playerId: params.profile.id,
      username: params.profile.username,
      avatarId: params.profile.avatarId,
      modes: params.modes,
      questionCount: params.questionCount,
      timerSeconds: params.timerSeconds,
    });
  }

  joinRoom(code: string, profile: UserProfile): void {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    this.lastProfile = profile;
    this.activeRoomCode = cleanCode;
    this.send({
      type: 'room:join',
      code: cleanCode,
      playerId: profile.id,
      username: profile.username,
      avatarId: profile.avatarId,
    });
  }

  startBattle(): void {
    this.send({ type: 'room:start' });
  }

  resetToLobby(): void {
    this.send({ type: 'room:reset_lobby' });
  }

  submitAnswer(
    modeIndex: number,
    questionIndex: number,
    isCorrect: boolean,
    timeLeft?: number
  ): void {
    this.send({
      type: 'game:answer',
      modeIndex,
      questionIndex,
      isCorrect,
      timeLeft: typeof timeLeft === 'number' ? timeLeft : 0,
    });
  }

  completeMode(modeIndex: number): void {
    this.send({
      type: 'game:mode_complete',
      modeIndex,
    });
  }

  forceAdvanceMode(modeIndex: number): void {
    this.send({
      type: 'room:force_advance',
      modeIndex,
    });
  }

  leaveRoom(): void {
    this.manualLeave = true;
    this.activeRoomCode = null;
    this.room = null;
    this.pendingMessages = [];
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'room:leave' }));
      this.ws.close();
    } else if (this.ws) {
      this.ws.close();
    }
    this.ws = null;
    this.notifyRoom();
  }
}

export const multiplayerService = new MultiplayerService();
