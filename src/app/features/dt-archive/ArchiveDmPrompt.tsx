import React, { useCallback, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Dialog,
  Overlay,
  OverlayCenter,
  OverlayBackdrop,
  Header,
  config,
  Box,
  Text,
  IconButton,
  Icon,
  Icons,
  color,
  Button,
  Spinner,
} from 'folds';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { stopPropagation } from '../../utils/keyboard';
import { archiveDm } from './archivedDms';

type ArchiveDmPromptProps = {
  room: Room;
  onDone: () => void;
  onCancel: () => void;
};

// DT: confirmación para archivar un DM (solo admins)
export function ArchiveDmPrompt({ room, onDone, onCancel }: ArchiveDmPromptProps) {
  const mx = useMatrixClient();
  const [archiveState, archive] = useAsyncCallback<void, Error, []>(
    useCallback(() => archiveDm(mx, room), [mx, room])
  );

  useEffect(() => {
    if (archiveState.status === AsyncStatus.Success) onDone();
  }, [archiveState, onDone]);

  const loading =
    archiveState.status === AsyncStatus.Loading || archiveState.status === AsyncStatus.Success;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onCancel,
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
                <Text size="H4">Archivar conversación</Text>
              </Box>
              <IconButton size="300" onClick={onCancel} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
              <Box direction="Column" gap="200">
                <Text priority="400">
                  La conversación pasa a Archivados y deja de cargarse al iniciar sesión. Podés
                  volver a abrirla desde ahí, con todo el historial. Si la otra persona te escribe,
                  vuelve sola a tus mensajes.
                </Text>
                {archiveState.status === AsyncStatus.Error && (
                  <Text style={{ color: color.Critical.Main }} size="T300">
                    No se pudo archivar. {archiveState.error.message}
                  </Text>
                )}
              </Box>
              <Button
                variant="Primary"
                onClick={() => archive()}
                before={loading ? <Spinner fill="Solid" variant="Primary" size="200" /> : undefined}
                aria-disabled={loading}
              >
                <Text size="B400">{loading ? 'Archivando...' : 'Archivar'}</Text>
              </Button>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
