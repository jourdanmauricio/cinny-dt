import { atom, useSetAtom } from 'jotai';
import { ClientEvent, MatrixClient, MatrixEvent, Room, RoomEvent } from 'matrix-js-sdk';
import { useEffect } from 'react';
import { AccountDataEvent } from '../../types/matrix/accountData';
import { getAccountData, getMDirects } from '../utils/room';
import { addRoomIdToMDirect } from '../utils/matrix';

export type MDirectAction = {
  type: 'INITIALIZE' | 'UPDATE';
  rooms: Set<string>;
};

const baseMDirectAtom = atom(new Set<string>());
export const mDirectAtom = atom<Set<string>, [MDirectAction], undefined>(
  (get) => get(baseMDirectAtom),
  (get, set, action) => {
    set(baseMDirectAtom, action.rooms);
  }
);

export const useBindMDirectAtom = (mx: MatrixClient, mDirect: typeof mDirectAtom) => {
  const setMDirect = useSetAtom(mDirect);

  useEffect(() => {
    const mDirectEvent = getAccountData(mx, AccountDataEvent.Direct);
    if (mDirectEvent) {
      setMDirect({
        type: 'INITIALIZE',
        rooms: getMDirects(mDirectEvent),
      });
    }

    const handleAccountData = (event: MatrixEvent) => {
      if (event.getType() === AccountDataEvent.Direct) {
        setMDirect({
          type: 'UPDATE',
          rooms: getMDirects(event),
        });
      }
    };

    mx.on(ClientEvent.AccountData, handleAccountData);
    return () => {
      mx.removeListener(ClientEvent.AccountData, handleAccountData);
    };
  }, [mx, setMDirect]);
};

// Safety net: whenever our own membership in a room becomes "join" (no
// matter which code path caused it - accepting via Inbox, a permalink,
// the /join command, or even a different Matrix client), check if it was
// a DM invite and mark it in m.direct if it isn't already. `getDMInviter`
// looks at the member event's prev_content, so it works even if the
// current content no longer carries `is_direct` (which only ever lives
// on the pending invite's content).
export const useBindDirectSelfHeal = (mx: MatrixClient) => {
  useEffect(() => {
    const handleMyMembership = (room: Room, membership: string) => {
      if (membership !== 'join') return;

      const userId = mx.getSafeUserId();
      const me = room.getMember(userId);
      const inviterId = me?.getDMInviter();
      if (!inviterId) return;

      const mDirectEvent = getAccountData(mx, AccountDataEvent.Direct);
      const alreadyMarked = mDirectEvent ? getMDirects(mDirectEvent).has(room.roomId) : false;
      if (alreadyMarked) return;

      addRoomIdToMDirect(mx, room.roomId, inviterId);
    };

    mx.on(RoomEvent.MyMembership, handleMyMembership);
    return () => {
      mx.removeListener(RoomEvent.MyMembership, handleMyMembership);
    };
  }, [mx]);
};
