import { EventType, Room, RoomEvent, RoomEventHandlerMap } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';

const isRoomMarkedUnread = (room: Room): boolean =>
  room.getAccountData(EventType.MarkedUnread)?.getContent()?.unread === true;

export function useRoomMarkedUnread(roomId: string): boolean {
  const mx = useMatrixClient();
  const [marked, setMarked] = useState(() => {
    const room = mx.getRoom(roomId);
    return room ? isRoomMarkedUnread(room) : false;
  });

  useEffect(() => {
    const room = mx.getRoom(roomId);
    if (!room) return;

    const handler: RoomEventHandlerMap[RoomEvent.AccountData] = (event) => {
      if (event.getType() === EventType.MarkedUnread) {
        setMarked(event.getContent()?.unread === true);
      }
    };

    room.on(RoomEvent.AccountData, handler);
    return () => {
      room.off(RoomEvent.AccountData, handler);
    };
  }, [mx, roomId]);

  return marked;
}

export function useDirectsHasMarkedUnread(roomIds: string[]): boolean {
  const mx = useMatrixClient();
  const roomIdsKey = roomIds.join(',');

  const [hasMarked, setHasMarked] = useState(() =>
    roomIds.some((id) => {
      const room = mx.getRoom(id);
      return room ? isRoomMarkedUnread(room) : false;
    })
  );

  useEffect(() => {
    const ids = roomIdsKey ? roomIdsKey.split(',') : [];
    const update = () =>
      setHasMarked(
        ids.some((id) => {
          const room = mx.getRoom(id);
          return room ? isRoomMarkedUnread(room) : false;
        })
      );

    const rooms = ids.map((id) => mx.getRoom(id)).filter((r): r is Room => r !== null);
    rooms.forEach((r) => r.on(RoomEvent.AccountData, update));
    return () => rooms.forEach((r) => r.off(RoomEvent.AccountData, update));
  }, [mx, roomIdsKey]);

  return hasMarked;
}
