import React, { useCallback, useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  color,
  config,
} from 'folds';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { stopPropagation } from '../../utils/keyboard';
import {
  OPEN_ACTIVATION_EVENT,
  PERMISSION_NOT_GRANTED_MESSAGE,
  PushStatus,
  dismissBanner,
  enablePush,
  getPushStatus,
  isBannerDismissed,
  isDtAdminSession,
  syncPushSubscription,
  takePendingActivation,
} from './pushNotifications';

const ACTIVATE_TEXT = 'Activá las notificaciones para enterarte cuando empiece la capacitación.';

function StatusMessage({ status }: { status: PushStatus }) {
  switch (status) {
    case 'subscribed':
      return <Text priority="400">Ya tenés las notificaciones activadas ✅</Text>;
    case 'denied':
      return (
        <Text priority="400">
          Las notificaciones están bloqueadas en este dispositivo. Para activarlas, habilitalas
          desde la configuración del navegador o del celular para este sitio, y volvé a abrir este
          aviso.
        </Text>
      );
    case 'ios-not-installed':
      return (
        <Text priority="400">
          En iPhone las notificaciones solo funcionan con la app instalada. Tocá el botón
          Compartir, elegí &quot;Agregar a inicio&quot; y abrí el chat desde ese ícono.
        </Text>
      );
    case 'unsupported':
      return (
        <Text priority="400">Este navegador no permite recibir notificaciones. Probá con otro.</Text>
      );
    default:
      return <Text priority="400">{ACTIVATE_TEXT}</Text>;
  }
}

type ActivationDialogProps = {
  status: PushStatus;
  initialError?: string;
  onStatusChange: (status: PushStatus) => void;
  onClose: () => void;
};

function ActivationDialog({ status, initialError, onStatusChange, onClose }: ActivationDialogProps) {
  const mx = useMatrixClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);
  const canActivate = status === 'default' || status === 'granted-unsubscribed';

  const handleActivate = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await enablePush(mx);
      onStatusChange(next);
      if (next === 'default') setError(PERMISSION_NOT_GRANTED_MESSAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron activar las notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="500"
            >
              <Box grow="Yes">
                <Text size="H4">Notificaciones</Text>
              </Box>
              <IconButton size="300" onClick={onClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
              <StatusMessage status={canActivate ? 'default' : status} />
              {error && (
                <Text style={{ color: color.Critical.Main }} size="T300">
                  {error}
                </Text>
              )}
              {canActivate ? (
                <Button
                  variant="Primary"
                  onClick={handleActivate}
                  disabled={loading}
                  before={loading ? <Spinner fill="Solid" variant="Primary" size="200" /> : undefined}
                >
                  <Text size="B400">{loading ? 'Activando...' : 'Activar'}</Text>
                </Button>
              ) : (
                <Button variant="Secondary" fill="Soft" onClick={onClose}>
                  <Text size="B400">Entendido</Text>
                </Button>
              )}
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

type ActivationBannerProps = { loading: boolean; onActivate: () => void; onDismiss: () => void };

function ActivationBanner({ loading, onActivate, onDismiss }: ActivationBannerProps) {
  return (
    <Box
      role="status"
      alignItems="Center"
      gap="300"
      style={{
        position: 'fixed',
        left: config.space.S300,
        right: config.space.S300,
        bottom: config.space.S300,
        zIndex: 50,
        maxWidth: 480,
        margin: '0 auto',
        padding: config.space.S300,
        borderRadius: config.radii.R400,
        background: color.Surface.Container,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
      }}
    >
      <Icon src={Icons.Bell} />
      <Text size="T300" style={{ flexGrow: 1 }}>
        {ACTIVATE_TEXT}
      </Text>
      <Button
        size="300"
        radii="300"
        onClick={onActivate}
        disabled={loading}
        before={loading ? <Spinner fill="Solid" variant="Primary" size="100" /> : undefined}
      >
        <Text size="B300">Activar</Text>
      </Button>
      <IconButton size="300" radii="300" onClick={onDismiss} aria-label="Cerrar aviso">
        <Icon size="100" src={Icons.Cross} />
      </IconButton>
    </Box>
  );
}

/**
 * Montado una vez en el cliente: sincroniza la suscripción al abrir, muestra el
 * aviso de activación y abre el diálogo desde el link de invitación. Solo para
 * usuarias (las admins no reciben estas notificaciones).
 */
export function DtPushFeature() {
  const mx = useMatrixClient();
  const isAdmin = isDtAdminSession();
  const [status, setStatus] = useState<PushStatus>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(isBannerDismissed);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string>();

  const refreshStatus = useCallback(() => {
    getPushStatus().then(setStatus);
  }, []);

  useEffect(() => {
    if (isAdmin) return undefined;
    syncPushSubscription(mx);
    refreshStatus();
    if (takePendingActivation()) setDialogOpen(true);

    const open = () => {
      refreshStatus();
      setDialogOpen(true);
    };
    window.addEventListener(OPEN_ACTIVATION_EVENT, open);
    return () => window.removeEventListener(OPEN_ACTIVATION_EVENT, open);
  }, [mx, isAdmin, refreshStatus]);

  // El "Activar" del aviso pide el permiso directamente (un solo paso). La
  // ventana se abre solo si no se pudo: permiso rechazado, iPhone sin instalar
  // o error del navegador, para explicar qué hacer.
  const handleBannerActivate = async () => {
    if (status !== 'default' && status !== 'granted-unsubscribed') {
      setDialogOpen(true);
      return;
    }
    setBannerLoading(true);
    try {
      const next = await enablePush(mx);
      setStatus(next);
      if (next === 'default') setDialogError(PERMISSION_NOT_GRANTED_MESSAGE);
      if (next !== 'subscribed') setDialogOpen(true);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : undefined);
      setDialogOpen(true);
    } finally {
      setBannerLoading(false);
    }
  };

  if (isAdmin || !status) return null;

  const showBanner =
    !bannerDismissed && !dialogOpen && (status === 'default' || status === 'ios-not-installed');

  return (
    <>
      {showBanner && (
        <ActivationBanner
          loading={bannerLoading}
          onActivate={handleBannerActivate}
          onDismiss={() => {
            dismissBanner();
            setBannerDismissed(true);
          }}
        />
      )}
      {dialogOpen && (
        <ActivationDialog
          status={status}
          initialError={dialogError}
          onStatusChange={setStatus}
          onClose={() => {
            setDialogOpen(false);
            setDialogError(undefined);
          }}
        />
      )}
    </>
  );
}
