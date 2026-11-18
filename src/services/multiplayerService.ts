import { BattleRoomState, GameModeId, UserProfile } from '../types/football';
import { storageService } from './storageService';

type RoomListener = (room: BattleRoomState | null) => void;
type ErrorListener = (error: string) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private room: BattleRoomState | null = null;
  private listeners = new Set<RoomListener>();
  private errorListeners = new Set<ErrorListener>();
  private pendingMessages: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private activeRoomCode: string | null = null;
  private lastProfile: UserProfile | null = null;
  private manualLeave = false;

  getMyPlayerId(): string {
    return storageService.getSessionPlayerId();
  }

 private getWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin;
  return apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws') + '/ws';
}

  private startHeartbeat(socket: WebSocket): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
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
      this.startHeartbeat(socket);

      // Always rejoin active room first on reconnect unless pendingMessages[0] already creates/joins a room
      const firstPending = this.pendingMessages[0];
      let firstType = '';
      if (firstPending) {
        try {
          firstType = String(JSON.parse(firstPending)?.type || '');
        } catch {
          firstType = '';
        }
      }

      if (
        this.activeRoomCode &&
        this.lastProfile &&
        firstType !== 'room:create' &&
        firstType !== 'room:join'
      ) {
        socket.send(
          JSON.stringify({
            type: 'room:join',
            code: this.activeRoomCode,
            playerId: this.getMyPlayerId(),
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
        if (data.type === 'pong') return;
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
      this.stopHeartbeat();
      if (this.ws === socket) {
        this.ws = null;
      }
      if (!this.manualLeave && this.activeRoomCode) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.ensureSocket();
        }, 1200);
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
    this.pendingMessages = [];
    this.send({
      type: 'room:create',
      playerId: this.getMyPlayerId(),
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
    this.pendingMessages = [];
    this.send({
      type: 'room:join',
      code: cleanCode,
      playerId: this.getMyPlayerId(),
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
    this.stopHeartbeat();
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
