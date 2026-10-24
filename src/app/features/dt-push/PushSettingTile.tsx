import React, { useEffect, useState } from 'react';
import { Button, Spinner, Switch, Text, color } from 'folds';
import { SettingTile } from '../../components/setting-tile';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import {
  PERMISSION_NOT_GRANTED_MESSAGE,
  PushStatus,
  disablePush,
  enablePush,
  getPushStatus,
} from './pushNotifications';

const DESCRIPTION: Partial<Record<PushStatus, string>> = {
  denied:
    'Están bloqueadas en este dispositivo. Habilitalas desde la configuración del navegador o del celular para este sitio.',
  'ios-not-installed':
    'En iPhone solo funcionan con la app instalada: Compartir → "Agregar a inicio", y abrí el chat desde ese ícono.',
  unsupported: 'Este navegador no permite recibir notificaciones.',
};

// DT: interruptor de notificaciones de capacitación (Ajustes → Notificaciones)
export function PushSettingTile() {
  const mx = useMatrixClient();
  const [status, setStatus] = useState<PushStatus>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const next = await enablePush(mx);
      setStatus(next);
      if (next === 'default') setError(PERMISSION_NOT_GRANTED_MESSAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron activar las notificaciones.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    await disablePush(mx);
    setStatus(await getPushStatus());
    setBusy(false);
  };

  if (!status) return null;

  const blockedMessage = DESCRIPTION[status];
  let after: React.ReactNode = null;
  if (busy) after = <Spinner size="200" />;
  else if (status === 'subscribed') after = <Switch value onChange={handleDisable} />;
  else if (status === 'default' || status === 'granted-unsubscribed')
    after = (
      <Button size="300" radii="300" onClick={handleEnable}>
        <Text size="B300">Activar</Text>
      </Button>
    );

  return (
    <SettingTile
      title="Avisos de capacitación"
      description={
        blockedMessage || error ? (
          <Text as="span" style={{ color: color.Critical.Main }} size="T200">
            {error ?? blockedMessage}
          </Text>
        ) : (
          <span>Recibí un aviso en este dispositivo cuando esté por comenzar la capacitación, aunque tengas la app cerrada.</span>
        )
      }
      after={after}
    />
  );
}
