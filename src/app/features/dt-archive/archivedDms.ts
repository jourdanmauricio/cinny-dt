// DT: DMs archivados (Oct-26 Req 6). Archivar = la admin sale del DM con
// reason "dt:archived" (la usuaria se queda); así la sala deja de cargarse en
// su login. Desarchivar = la admin vuelve a entrar con todo el historial:
// - desde la sección Archivados o al abrir un chat: dt-api usa make_room_admin
//   (invita a la admin a través de la usuaria) y este cliente entra;
// - si la usuaria escribe: su cliente invita a la admin con reason
//   "dt:unarchive" y el cliente de la admin acepta solo al conectarse.
// Los eventos de salir / invitar / entrar no se ven: este fork ya oculta
// todos los eventos de membresía (hideMembershipEvents forzado a true).
import { ClientEvent, MatrixClient, Room } from 'matrix-js-sdk';

export const ARCHIVED_REASON = 'dt:archived';
export const UNARCHIVE_REASON = 'dt:unarchive';
export const ARCHIVED_DMS_PATH = '/archivados/';

const API_URL = import.meta.env.VITE_DT_API_URL;

export type ArchivedDm = {
  roomId: string;
  otherSynapseUserId: string;
  displayName: string | null;
  email: string | null;
  sugoId: string | null;
  appOrigin: 'sugo' | 'contigo' | null;
  archivedAt: string;
};

export type ArchivedDmPage = { data: ArchivedDm[]; total: number; page: number; limit: number };

export const isDtAdminSession = () => localStorage.getItem('dt_is_admin') === 'true';

async function apiFetch<T>(mx: MatrixClient, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mx.getAccessToken() ?? ''}`,
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Error de conexión. Intentá de nuevo.'
    );
  }
  return body as T;
}

async function matrixPost(mx: MatrixClient, path: string, body: object) {
  const res = await fetch(`${mx.getHomeserverUrl()}/_matrix/client/v3${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mx.getAccessToken() ?? ''}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No se pudo completar la acción en el chat.');
}

/** La otra persona del DM (la que no soy yo), esté o no en la sala. */
export const getDmPartnerId = (mx: MatrixClient, room: Room): string | undefined => {
  const me = mx.getSafeUserId();
  return room
    .getMembers()
    .map((m) => m.userId)
    .find((id) => id !== me);
};

export async function archiveDm(mx: MatrixClient, room: Room): Promise<void> {
  const otherSynapseUserId = getDmPartnerId(mx, room);
  if (!otherSynapseUserId) throw new Error('No se encontró a la otra persona del chat.');
  // Primero el registro: si falla, la admin no sale de la sala
  await apiFetch(mx, '/archived-dms', {
    method: 'POST',
    body: JSON.stringify({ roomId: room.roomId, otherSynapseUserId }),
  });
  await matrixPost(mx, `/rooms/${encodeURIComponent(room.roomId)}/leave`, {
    reason: ARCHIVED_REASON,
  });
}

export const listArchivedDms = (
  mx: MatrixClient,
  params: { search?: string; page?: number; otherSynapseUserId?: string }
) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.otherSynapseUserId) query.set('otherSynapseUserId', params.otherSynapseUserId);
  return apiFetch<ArchivedDmPage>(mx, `/archived-dms?${query.toString()}`);
};

/**
 * Espera a que la sincronización traiga la sala como "unida": si se navega
 * antes, la ruta de DMs no la reconoce y vuelve a la lista.
 */
const waitForJoinedRoom = (mx: MatrixClient, roomId: string, timeoutMs = 10000) =>
  new Promise<void>((resolve) => {
    const isJoined = () => mx.getRoom(roomId)?.getMyMembership() === 'join';
    if (isJoined()) {
      resolve();
      return;
    }
    const done = () => {
      mx.removeListener(ClientEvent.Sync, check);
      clearTimeout(timer);
      resolve();
    };
    const check = () => {
      if (isJoined()) done();
    };
    const timer = setTimeout(done, timeoutMs);
    mx.on(ClientEvent.Sync, check);
  });

/** Desarchiva (dt-api invita a la admin) y entra al DM. Devuelve el roomId. */
export async function unarchiveAndJoin(mx: MatrixClient, roomId: string): Promise<string> {
  await apiFetch(mx, `/archived-dms/${encodeURIComponent(roomId)}/unarchive`, { method: 'POST' });
  await mx.joinRoom(roomId);
  await waitForJoinedRoom(mx, roomId);
  return roomId;
}

/** Si hay un DM archivado con esa persona, lo desarchiva y devuelve su roomId. */
export async function recoverArchivedDmWith(
  mx: MatrixClient,
  otherSynapseUserId: string
): Promise<string | undefined> {
  if (!isDtAdminSession()) return undefined;
  const { data } = await listArchivedDms(mx, { otherSynapseUserId });
  const archived = data[0];
  if (!archived) return undefined;
  return unarchiveAndJoin(mx, archived.roomId);
}

export const forgetArchivedDm = (mx: MatrixClient, roomId: string) =>
  apiFetch(mx, `/archived-dms/${encodeURIComponent(roomId)}`, { method: 'DELETE' }).catch(
    () => undefined
  );

/** Miembro que salió del DM archivando (lado usuaria). */
export const getArchivingMemberId = (room: Room): string | undefined =>
  room
    .getMembers()
    .find(
      (m) => m.membership === 'leave' && m.events.member?.getContent().reason === ARCHIVED_REASON
    )?.userId;

/**
 * Nombre a mostrar de la sala. Mientras la admin tiene el DM archivado, el SDK
 * lo nombra "Empty room (was …)"; la usuaria tiene que seguir viendo el nombre
 * de la admin.
 */
export const getDtRoomName = (room: Room): string => {
  if (room.currentState.getStateEvents('m.room.name', '')?.getContent().name) return room.name;
  const archivingId = getArchivingMemberId(room);
  if (!archivingId) return room.name;
  return room.getMember(archivingId)?.name ?? room.name;
};

/**
 * Lado usuaria: antes de enviar en un DM archivado por la admin, la invita
 * de nuevo para que el DM vuelva a su lista. Nunca bloquea el envío.
 */
export async function inviteBackArchivingAdmin(mx: MatrixClient, room: Room): Promise<void> {
  const adminId = getArchivingMemberId(room);
  if (!adminId) return;
  try {
    await matrixPost(mx, `/rooms/${encodeURIComponent(room.roomId)}/invite`, {
      user_id: adminId,
      reason: UNARCHIVE_REASON,
    });
  } catch {
    // si falla, el mensaje igual se envía; la admin lo verá al desarchivar
  }
}
