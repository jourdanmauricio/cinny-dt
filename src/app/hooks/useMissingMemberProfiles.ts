import { useEffect, useRef } from 'react';
import { MatrixClient, MatrixEvent, Room } from 'matrix-js-sdk';

type ProfileData = { displayname?: string; avatar_url?: string };
type CacheEntry = { data: ProfileData | null; fetchedAt: number };

const STORAGE_KEY = 'cinny_dt_profile_cache';
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// In-memory mirror of the persisted (localStorage) cache, for synchronous
// reads. Persisting profiles avoids re-fetching them on every fresh
// login/reload - a profile is only re-fetched once its entry goes stale.
const profileDataCache = new Map<string, CacheEntry>();

const isFresh = (entry: CacheEntry | undefined): entry is CacheEntry =>
  !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;

function loadPersistedCache(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    Object.entries(parsed).forEach(([userId, entry]) => {
      if (isFresh(entry)) profileDataCache.set(userId, entry);
    });
  } catch {
    // Corrupt data or storage unavailable (e.g. private browsing) - start fresh.
  }
}
loadPersistedCache();

function persistCache(): void {
  try {
    const obj: Record<string, CacheEntry> = {};
    profileDataCache.forEach((entry, userId) => {
      obj[userId] = entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Storage unavailable/quota exceeded - cache stays in-memory only.
  }
}

// Tracks in-flight requests to deduplicate concurrent fetches for the same userId.
const inFlight = new Map<string, Promise<ProfileData | null>>();

async function fetchProfileData(mx: MatrixClient, userId: string): Promise<ProfileData | null> {
  if (inFlight.has(userId)) return inFlight.get(userId)!;

  const promise = mx
    .getProfileInfo(userId)
    .then((p) => {
      const data = p.displayname || p.avatar_url ? p : null;
      profileDataCache.set(userId, { data, fetchedAt: Date.now() });
      persistCache();
      return data;
    })
    .catch(() => {
      profileDataCache.set(userId, { data: null, fetchedAt: Date.now() });
      persistCache();
      return null;
    })
    .finally(() => inFlight.delete(userId));

  inFlight.set(userId, promise);
  return promise;
}

function injectIntoRoom(room: Room, userId: string, profile: ProfileData): boolean {
  if (!profile.displayname && !profile.avatar_url) return false;
  room.currentState.setStateEvents([
    new MatrixEvent({
      type: 'm.room.member',
      state_key: userId,
      room_id: room.roomId,
      content: {
        displayname: profile.displayname,
        avatar_url: profile.avatar_url,
        membership: 'join',
      },
      sender: userId,
      event_id: `$profile_fallback_${userId}`,
      origin_server_ts: Date.now(),
    }),
  ]);
  return true;
}

export function useMissingMemberProfiles(
  mx: MatrixClient,
  room: Room,
  senderIds: string[],
  onResolved: () => void
): void {
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    // Only process senders whose display name is missing in THIS room.
    const needsResolution = senderIds.filter((userId) => {
      const member = room.getMember(userId);
      return !member?.rawDisplayName || member.rawDisplayName === userId;
    });

    if (needsResolution.length === 0) return;

    const toFetch: string[] = [];
    let anyCacheResolved = false;

    // Inject immediately from cache for users already fetched (in this or
    // a previous session, as long as the entry hasn't gone stale).
    needsResolution.forEach((userId) => {
      const cached = profileDataCache.get(userId);
      if (isFresh(cached)) {
        if (cached.data && injectIntoRoom(room, userId, cached.data)) anyCacheResolved = true;
      } else {
        toFetch.push(userId);
      }
    });

    if (anyCacheResolved) onResolvedRef.current();
    if (toFetch.length === 0) return;

    // Fetch profiles not yet in cache (or gone stale).
    let anyFetchResolved = false;
    const fetches = toFetch.map(async (userId) => {
      const profile = await fetchProfileData(mx, userId);
      if (profile && injectIntoRoom(room, userId, profile)) anyFetchResolved = true;
    });

    Promise.allSettled(fetches).then(() => {
      if (anyFetchResolved) onResolvedRef.current();
    });
  }, [mx, room, senderIds]);
}
