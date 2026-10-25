import { useEffect } from 'react';
import { MatrixClient, Room, RoomEvent } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { UNARCHIVE_REASON, forgetArchivedDm, isDtAdminSession } from './archivedDms';

const handled = new Set<string>();

// Invitación de la usuaria al escribir en un DM archivado → se acepta sola y
// el DM vuelve a la lista de la admin (y sale de Archivados).
async function acceptUnarchiveInvite(mx: MatrixClient, room: Room) {
  if (handled.has(room.roomId) || room.getMyMembership() !== 'invite') return;
  const reason = room.getMember(mx.getSafeUserId())?.events.member?.getContent().reason;
  if (reason !== UNARCHIVE_REASON) return;
  handled.add(room.roomId);
  try {
    await mx.joinRoom(room.roomId);
    await forgetArchivedDm(mx, room.roomId);
  } catch {
    handled.delete(room.roomId);
  }
}

/** Montado una vez en el cliente, solo actúa para admins. */
export function DtArchiveFeature() {
  const mx = useMatrixClient();

  useEffect(() => {
    if (!isDtAdminSession()) return undefined;
    // Invitaciones que llegaron mientras la admin no estaba conectada
    mx.getRooms().forEach((room) => acceptUnarchiveInvite(mx, room));

    const onMembership = (room: Room) => {
      acceptUnarchiveInvite(mx, room);
    };
    mx.on(RoomEvent.MyMembership, onMembership);
    return () => {
      mx.removeListener(RoomEvent.MyMembership, onMembership);
    };
  }, [mx]);

  return null;
}
