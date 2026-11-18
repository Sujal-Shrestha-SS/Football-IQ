import { UserProfile } from '../types/football';

const PROFILE_KEY = 'football_iq_profile';
const SOUND_KEY = 'football_iq_sound';
const SESSION_PLAYER_ID_KEY = 'football_iq_session_player_id';

function createRandomId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    }
  } catch {
    // Fallback below
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_PROFILE_TEMPLATE: Omit<UserProfile, 'id'> = {
  username: 'Striker99',
  avatarId: 'jersey_gold',
  createdAt: Date.now(),
  soundEnabled: true,
};

export const AVATAR_OPTIONS = [
  { id: 'jersey_gold', label: 'Gold Number 10', emoji: '🔟', color: '#F59E0B' },
  { id: 'jersey_green', label: 'Pitch Captain', emoji: '⚡', color: '#10B981' },
  { id: 'jersey_blue', label: 'Playmaker', emoji: '🎯', color: '#3B82F6' },
  { id: 'jersey_red', label: 'Goalscorer', emoji: '🔥', color: '#EF4444' },
  { id: 'jersey_purple', label: 'Tactician', emoji: '🧠', color: '#8B5CF6' },
  { id: 'jersey_star', label: "Ballon d'Or", emoji: '🏆', color: '#EAB308' },
];

export const storageService = {
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const needsNewId = !parsed.id || parsed.id === 'user_default';
        const profile: UserProfile = {
          id: needsNewId ? createRandomId('u') : String(parsed.id),
          username: parsed.username || DEFAULT_PROFILE_TEMPLATE.username,
          avatarId: parsed.avatarId || DEFAULT_PROFILE_TEMPLATE.avatarId,
          createdAt: parsed.createdAt || Date.now(),
          soundEnabled:
            typeof parsed.soundEnabled === 'boolean'
              ? parsed.soundEnabled
              : this.getSoundEnabled(),
        };
        if (needsNewId) {
          this.saveProfile(profile);
        }
        return profile;
      }
    } catch {
      // Fallback
    }
    const fresh: UserProfile = {
      id: createRandomId('u'),
      ...DEFAULT_PROFILE_TEMPLATE,
      createdAt: Date.now(),
      soundEnabled: this.getSoundEnabled(),
    };
    this.saveProfile(fresh);
    return fresh;
  },

  /**
   * Returns a stable ID for the current browser tab/window.
   * Persists across page refreshes in the same tab (allowing WS reconnect)
   * while keeping two tabs in the same browser completely isolated in multiplayer.
   */
  getSessionPlayerId(): string {
    try {
      const existing = sessionStorage.getItem(SESSION_PLAYER_ID_KEY);
      if (existing && existing.trim().length > 4) {
        return existing;
      }
      const profileId = this.getProfile().id;
      const created = `${profileId}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem(SESSION_PLAYER_ID_KEY, created);
      return created;
    } catch {
      return this.getProfile().id;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  updateUsername(newUsername: string): UserProfile {
    const profile = this.getProfile();
    const updated = { ...profile, username: newUsername.trim() || 'Striker99' };
    this.saveProfile(updated);
    return updated;
  },

  updateAvatar(avatarId: string): UserProfile {
    const profile = this.getProfile();
    const updated = { ...profile, avatarId };
    this.saveProfile(updated);
    return updated;
  },

  getSoundEnabled(): boolean {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      if (saved !== null) return saved === 'true';
    } catch {
      // Ignore
    }
    return true;
  },

  setSoundEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(SOUND_KEY, String(enabled));
      const profile = this.getProfile();
      this.saveProfile({ ...profile, soundEnabled: enabled });
    } catch {
      // Ignore
    }
  },

  clearProfileData(): void {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem('football_iq_history');
    localStorage.removeItem('football_iq_challenges');
  },
};
