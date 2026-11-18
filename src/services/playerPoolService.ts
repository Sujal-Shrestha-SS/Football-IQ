import { Player } from '../types/football';
import fallbackPlayers from '../data/players.json';

const POOL_CACHE_KEY = 'fiq_player_pool_v2';
const POOL_COOLDOWN_KEY = 'fiq_pool_cooldown_until';
const POOL_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const QUOTA_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const API = import.meta.env.VITE_API_URL ?? '';


let lastPoolQuotaExceeded = false;

const LEAGUES = [
  { league: 'Premier League', country: 'England', count: 500 },
  { league: 'La Liga', country: 'Spain', count: 500 },
  { league: 'Serie A', country: 'Italy', count: 500 },
  { league: 'Bundesliga', country: 'Germany', count: 500 },
  { league: 'Ligue 1', country: 'France', count: 450 },
];

function normName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function wasPoolQuotaExceeded(): boolean {
  return lastPoolQuotaExceeded;
}

function isInPoolCooldown(): boolean {
  try {
    const raw = localStorage.getItem(POOL_COOLDOWN_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function setPoolCooldown(): void {
  try {
    localStorage.setItem(
      POOL_COOLDOWN_KEY,
      String(Date.now() + QUOTA_COOLDOWN_MS)
    );
  } catch {
    // Ignore storage error
  }
}

export function hasCachedPlayerPool(): boolean {
  if (isInPoolCooldown()) return true;
  try {
    const raw = localStorage.getItem(POOL_CACHE_KEY);
    if (!raw) return false;
    const { timestamp, players } = JSON.parse(raw) as {
      timestamp?: number;
      players?: Player[];
    };
    return (
      typeof timestamp === 'number' &&
      Array.isArray(players) &&
      players.length > 0 &&
      Date.now() - timestamp < POOL_EXPIRY_MS
    );
  } catch {
    return false;
  }
}

async function fetchLeaguePlayers(
  league: string,
  country: string,
  count: number
): Promise<{ players: Player[]; stopLoop: boolean; quotaExceeded: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(`${API}/api/players/pool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league, country, count }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      return { players: [], stopLoop: true, quotaExceeded: true };
    }
    if (response.status === 503) {
      return { players: [], stopLoop: true, quotaExceeded: false };
    }
    if (!response.ok) {
      return { players: [], stopLoop: false, quotaExceeded: false };
    }
    const data = (await response.json()) as { players?: Player[] };
    return {
      players: Array.isArray(data?.players) ? data.players : [],
      stopLoop: false,
      quotaExceeded: false,
    };
  } catch {
    return { players: [], stopLoop: false, quotaExceeded: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

function mergePlayersIntoMap(
  playerMap: Map<string, Player>,
  incoming: Player[]
): void {
  for (const p of incoming) {
    if (!p?.name) continue;
    const key = normName(p.name);
    if (!key) continue;

    const existing = playerMap.get(key);
    if (existing) {
      const mergedClubs = Array.from(
        new Set([...existing.clubs, ...(p.clubs || [])])
      );
      existing.clubs = mergedClubs;
      if (!existing.nationality && p.nationality) {
        existing.nationality = p.nationality;
      }
    } else {
      playerMap.set(key, {
        ...p,
        clubs: Array.isArray(p.clubs) ? p.clubs : [],
      });
    }
  }
}

export async function getPlayerPool(
  onProgress?: (done: number, total: number, league: string) => void
): Promise<Player[]> {
  lastPoolQuotaExceeded = false;

  // 1. Return valid cached pool if present
  try {
    const cached = localStorage.getItem(POOL_CACHE_KEY);
    if (cached) {
      const { timestamp, players } = JSON.parse(cached) as {
        timestamp: number;
        players: Player[];
      };
      if (Date.now() - timestamp < POOL_EXPIRY_MS && players.length > 0) {
        return players;
      }
    }
  } catch {
    // Cache read failed — rebuild
  }

  const fallbackList = fallbackPlayers as unknown as Player[];

  // If in quota cooldown, return fallback immediately without spamming API
  if (isInPoolCooldown()) {
    lastPoolQuotaExceeded = true;
    return fallbackList;
  }

  // 2. Fetch all 5 leagues via server Gemini endpoint sequentially
  const playerMap = new Map<string, Player>();

  for (let i = 0; i < LEAGUES.length; i++) {
    const l = LEAGUES[i];
    onProgress?.(i, LEAGUES.length, l.league);
    const { players: batch, stopLoop, quotaExceeded } =
      await fetchLeaguePlayers(l.league, l.country, l.count);
    mergePlayersIntoMap(playerMap, batch);
    onProgress?.(i + 1, LEAGUES.length, l.league);

    if (stopLoop) {
      if (quotaExceeded) {
        lastPoolQuotaExceeded = true;
      }
      setPoolCooldown();
      break;
    }
  }

  // Always ensure fallback players are also represented if pool is sparse
  if (playerMap.size < 100) {
    mergePlayersIntoMap(playerMap, fallbackList);
  }

  const allPlayers = Array.from(playerMap.values());

  // 3. Cache only when Gemini returned substantial results (so offline fallback doesn't lock out real fetch)
  if (allPlayers.length >= 100) {
    try {
      localStorage.setItem(
        POOL_CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), players: allPlayers })
      );
      localStorage.removeItem(POOL_COOLDOWN_KEY);
    } catch {
      // localStorage quota exceeded — keep in memory for this session
    }
  }

  return allPlayers;
}

export function searchPlayerPool(
  pool: Player[],
  query: string,
  limit = 5
): Player[] {
  const norm = normName(query);
  if (norm.length < 2) return [];

  const source =
    pool.length > 0 ? pool : (fallbackPlayers as unknown as Player[]);

  return source
    .filter((p) => {
      const pName = normName(p.name);
      return (
        pName.includes(norm) ||
        (p.nationality && p.nationality.toLowerCase().includes(norm))
      );
    })
    .slice(0, limit);
}
