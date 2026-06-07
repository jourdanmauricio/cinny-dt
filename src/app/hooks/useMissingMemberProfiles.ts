import { useEffect, useRef } from 'react';
import { MatrixClient, MatrixEvent, Room } from 'matrix-js-sdk';

type ProfileData = { displayname?: string; avatar_url?: string };

// Session-scoped: stores profile data to reuse across rooms without re-fetching.
// null means the fetch was attempted and failed or returned empty.
const profileDataCache = new Map<string, ProfileData | null>();

// Tracks in-flight requests to deduplicate concurrent fetches for the same userId.
const inFlight = new Map<string, Promise<ProfileData | null>>();

async function fetchProfileData(mx: MatrixClient, userId: string): Promise<ProfileData | null> {
  if (inFlight.has(userId)) return inFlight.get(userId)!;

  const promise = mx
    .getProfileInfo(userId)
    .then((p) => {
      const data = p.displayname || p.avatar_url ? p : null;
      profileDataCache.set(userId, data);
      return data;
    })
    .catch(() => {
      profileDataCache.set(userId, null);
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

    // Inject immediately from cache for users already fetched in other rooms.
    for (const userId of needsResolution) {
      if (profileDataCache.has(userId)) {
        const cached = profileDataCache.get(userId);
        if (cached && injectIntoRoom(room, userId, cached)) anyCacheResolved = true;
      } else {
        toFetch.push(userId);
      }
    }

    if (anyCacheResolved) onResolvedRef.current();
    if (toFetch.length === 0) return;

    // Fetch profiles not yet in cache.
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
