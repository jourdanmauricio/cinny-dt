import { createClient, Filter, IndexedDBStore, MatrixClient } from 'matrix-js-sdk';

// DT: E2E deshabilitado — salas son broadcast/admin, tokens sin device_id vinculado causan error 400 en key upload
// import { IndexedDBCryptoStore } from 'matrix-js-sdk';
// import { cryptoCallbacks } from './secretStorageKeys';
import { clearNavToActivePathStore } from '../app/state/navToActivePath';
import { pushSessionToSW } from '../sw-session';

type Session = {
  baseUrl: string;
  accessToken: string;
  userId: string;
  deviceId: string;
};

export const initClient = async (session: Session): Promise<MatrixClient> => {
  const indexedDBStore = new IndexedDBStore({
    indexedDB: global.indexedDB,
    localStorage: global.localStorage,
    dbName: 'web-sync-store',
  });

  // DT: E2E deshabilitado — no se crea cryptoStore ni se inicializa Rust crypto
  // const legacyCryptoStore = new IndexedDBCryptoStore(global.indexedDB, 'crypto-store');

  const mx = createClient({
    baseUrl: session.baseUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    store: indexedDBStore,
    // DT: cryptoStore, cryptoCallbacks y verificationMethods eliminados para deshabilitar E2E
    // cryptoStore: legacyCryptoStore,
    deviceId: session.deviceId,
    timelineSupport: true,
    // cryptoCallbacks: cryptoCallbacks as any,
    // verificationMethods: ['m.sas.v1'],
  });

  await indexedDBStore.startup();
  // DT: initRustCrypto omitido — dispara el upload de claves que falla con 400 sin device_id vinculado
  // await mx.initRustCrypto();

  mx.setMaxListeners(50);

  return mx;
};

export const startClient = async (mx: MatrixClient) => {
  // DT: exclude m.room.member from the sync timeline so broadcast rooms don't flood the
  // chat with join/invite events. room.timeline vs room.state are independent sections —
  // not_types here only suppresses timeline events; lazy_load_members still delivers
  // member state (displayNames) via the state section, unaffected.
  const syncFilter = new Filter(mx.getSafeUserId());
  syncFilter.setDefinition({
    room: {
      timeline: { not_types: ['m.room.member'] },
      state: { lazy_load_members: true },
    },
  });

  await mx.startClient({
    lazyLoadMembers: true,
    filter: syncFilter,
  });
};

export const clearCacheAndReload = async (mx: MatrixClient) => {
  mx.stopClient();
  clearNavToActivePathStore(mx.getSafeUserId());
  await mx.store.deleteAllData();
  window.location.reload();
};

export const logoutClient = async (mx: MatrixClient) => {
  pushSessionToSW();
  mx.stopClient();
  try {
    await mx.logout();
  } catch {
    // ignore if failed to logout
  }
  await mx.clearStores();
  window.localStorage.clear();
  window.location.reload();
};

export const clearLoginData = async () => {
  const dbs = await window.indexedDB.databases();

  dbs.forEach((idbInfo) => {
    const { name } = idbInfo;
    if (name) {
      window.indexedDB.deleteDatabase(name);
    }
  });

  window.localStorage.clear();
  window.location.reload();
};
