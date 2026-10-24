// DT: notificaciones push de capacitación (Oct-26 Req 7). Web Push propio,
// registrado en la API de DT; no usa los pushers de Matrix (todas las sesiones
// comparten el device_id DT_DEVICE).

type AccessTokenSource = { getAccessToken: () => string | null };

const API_URL = import.meta.env.VITE_DT_API_URL;
export const INVITE_PATH = '/activar-notificaciones';
export const OPEN_ACTIVATION_EVENT = 'dt:open-push-activation';
const PENDING_ACTIVATION_KEY = 'dt_open_push_activation';
const BANNER_DISMISSED_KEY = 'dt_push_banner_dismissed';

export type PushStatus =
  | 'unsupported' // el navegador no soporta push
  | 'ios-not-installed' // iPhone/iPad desde el navegador: hay que instalar la app
  | 'denied' // la usuaria bloqueó el permiso
  | 'default' // nunca se le preguntó
  | 'subscribed' // permiso concedido y suscripción activa
  | 'granted-unsubscribed'; // permiso concedido pero sin suscripción (ej. la desactivó en Ajustes)

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const isDtAdminSession = () => localStorage.getItem('dt_is_admin') === 'true';

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return isIos() && !isStandalone() ? 'ios-not-installed' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'default') return 'default';
  return (await getPushSubscription()) ? 'subscribed' : 'granted-unsubscribed';
}

const urlBase64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/push/vapid-public-key`);
  const { publicKey } = await res.json();
  if (!publicKey) throw new Error('Las notificaciones no están disponibles en este momento.');
  return publicKey;
}

async function registerInApi(mx: AccessTokenSource, subscription: PushSubscription) {
  const res = await fetch(`${API_URL}/push/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mx.getAccessToken() ?? ''}`,
    },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!res.ok) throw new Error('No se pudo registrar el dispositivo. Intentá de nuevo.');
}

/**
 * Pide permiso y suscribe el dispositivo. Debe llamarse desde un toque de la
 * usuaria: Safari exige que requestPermission ocurra dentro del gesto, por eso
 * va primero, antes de cualquier await de red.
 */
export async function enablePush(mx: AccessTokenSource): Promise<PushStatus> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'default';

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const applicationServerKey = urlBase64ToUint8Array(await fetchVapidPublicKey());
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch {
      // El navegador no pudo conectarse a su servicio de push. Caso típico:
      // Brave, que trae desactivado el servicio de push de Google.
      throw new Error(
        'Tu navegador no pudo activar las notificaciones. Si usás Brave, activá "Usar los servicios de Google para mensajería push" en Configuración → Privacidad y seguridad, reiniciá el navegador y volvé a intentar. Si no, probá con Chrome.'
      );
    }
  }
  await registerInApi(mx, subscription);
  return 'subscribed';
}

/** Da de baja el dispositivo en la API y en el navegador. Nunca lanza. */
export async function disablePush(mx: AccessTokenSource): Promise<void> {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) return;
    await fetch(`${API_URL}/push/subscriptions`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mx.getAccessToken() ?? ''}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    // ignorar: el logout no debe trabarse por esto
  }
}

/**
 * Al abrir la app: si el dispositivo ya está suscripto, se vuelve a registrar
 * en la API (cubre que otra cuenta haya iniciado sesión en el mismo celular, o
 * que la API haya dado de baja la suscripción).
 */
export async function syncPushSubscription(mx: AccessTokenSource): Promise<void> {
  try {
    if (!isPushSupported() || Notification.permission !== 'granted') return;
    const subscription = await getPushSubscription();
    if (subscription) await registerInApi(mx, subscription);
  } catch {
    // reintenta en la próxima apertura
  }
}

export const isBannerDismissed = () => localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
export const dismissBanner = () => localStorage.setItem(BANNER_DISMISSED_KEY, 'true');

/** Link de invitación abierto desde fuera de la app: se recuerda y se abre al entrar. */
export const capturePendingActivationFromUrl = () => {
  if (window.location.pathname.replace(/\/+$/, '') !== INVITE_PATH) return;
  sessionStorage.setItem(PENDING_ACTIVATION_KEY, 'true');
  window.history.replaceState(null, '', '/');
};

export const takePendingActivation = () => {
  const pending = sessionStorage.getItem(PENDING_ACTIVATION_KEY) === 'true';
  sessionStorage.removeItem(PENDING_ACTIVATION_KEY);
  return pending;
};

export const isInviteLink = (href: string | undefined): boolean => {
  if (!href) return false;
  try {
    return new URL(href, window.location.origin).pathname.replace(/\/+$/, '') === INVITE_PATH;
  } catch {
    return false;
  }
};

export const openPushActivation = () => window.dispatchEvent(new Event(OPEN_ACTIVATION_EVENT));

/** El navegador resolvió el pedido sin conceder el permiso (ventana cerrada sin elegir). */
export const PERMISSION_NOT_GRANTED_MESSAGE =
  'No se otorgó el permiso. Tocá Activar y elegí "Permitir" cuando el navegador lo pregunte. Si no aparece la pregunta, recargá la página y volvé a intentar.';

