import { UserProfile } from '../types/football';

const PROFILE_KEY = 'football_iq_profile';
const SOUND_KEY = 'football_iq_sound';

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_default',
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
        return {
          id: parsed.id || DEFAULT_PROFILE.id,
          username: parsed.username || DEFAULT_PROFILE.username,
          avatarId: parsed.avatarId || DEFAULT_PROFILE.avatarId,
          createdAt: parsed.createdAt || DEFAULT_PROFILE.createdAt,
          soundEnabled:
            typeof parsed.soundEnabled === 'boolean'
              ? parsed.soundEnabled
              : this.getSoundEnabled(),
        };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_PROFILE, soundEnabled: this.getSoundEnabled() };
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
