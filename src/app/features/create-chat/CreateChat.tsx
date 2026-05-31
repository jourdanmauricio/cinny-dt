import { Box, Button, color, config, Icon, Icons, Input, Spinner, Switch, Text } from 'folds';
import React, { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { ICreateRoomStateEvent, MatrixError, Preset, Visibility } from 'matrix-js-sdk';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { SettingTile } from '../../components/setting-tile';
import { SequenceCard } from '../../components/sequence-card';
import { addRoomIdToMDirect, isUserId } from '../../utils/matrix';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { ErrorCode } from '../../cs-errorcode';
import { millisecondsToMinutes } from '../../utils/common';
import { createRoomEncryptionState } from '../../components/create-room';
import { useAlive } from '../../hooks/useAlive';
import { getDirectPath, getDirectRoomPath } from '../../pages/pathUtils';
import { dtAdminsAtom, DtAdmin } from '../../state/dtAdmins';

type CreateChatProps = {
  defaultUserId?: string;
};
export function CreateChat({ defaultUserId }: CreateChatProps) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const navigate = useNavigate();

  const isAdmin = localStorage.getItem('dt_is_admin') === 'true';
  const [dtAdmins, setDtAdmins] = useAtom(dtAdminsAtom);

  useEffect(() => {
    if (!isAdmin) navigate(getDirectPath(), { replace: true });
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (dtAdmins !== null) return;
    const apiUrl = import.meta.env.VITE_DT_API_URL as string;
    fetch(`${apiUrl}/matrix/admins`)
      .then((r) => r.json())
      .then((data: DtAdmin[]) => setDtAdmins(data))
      .catch(() => setDtAdmins([]));
  }, [dtAdmins, setDtAdmins]);

  const [encryption, setEncryption] = useState(false);
  const [invalidUserId, setInvalidUserId] = useState(false);

  const [createState, create] = useAsyncCallback<string, Error | MatrixError, [string, boolean]>(
    useCallback(
      async (userId, encrypted) => {
        const initialState: ICreateRoomStateEvent[] = [];

        if (encrypted) initialState.push(createRoomEncryptionState());

        const currentUserId = mx.getUserId();
        let powerLevelOverride: Record<string, unknown> | undefined;
        if (currentUserId && dtAdmins !== null) {
          const adminIds = new Set(dtAdmins.map((a) => a.synapseUserId));
          powerLevelOverride = {
            users: {
              [currentUserId]: adminIds.has(currentUserId) ? 100 : 0,
              [userId]: adminIds.has(userId) ? 100 : 0,
            },
            redact: 50,
          };
        }

        const result = await mx.createRoom({
          is_direct: true,
          invite: [userId],
          visibility: Visibility.Private,
          preset: Preset.TrustedPrivateChat,
          initial_state: initialState,
          ...(powerLevelOverride ? { power_level_content_override: powerLevelOverride } : {}),
        });

        addRoomIdToMDirect(mx, result.room_id, userId);

        return result.room_id;
      },
      [mx, dtAdmins]
    )
  );
  const loading = createState.status === AsyncStatus.Loading;
  const error = createState.status === AsyncStatus.Error ? createState.error : undefined;
  const disabled = createState.status === AsyncStatus.Loading;

  if (!isAdmin) return null;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    setInvalidUserId(false);

    const target = evt.target as HTMLFormElement | undefined;
    const userIdInput = target?.userIdInput as HTMLInputElement | undefined;
    const userId = userIdInput?.value.trim();

    if (!userIdInput || !userId) return;
    if (!isUserId(userId)) {
      setInvalidUserId(true);
      return;
    }

    create(userId, encryption).then((roomId) => {
      if (alive()) {
        userIdInput.value = '';
        navigate(getDirectRoomPath(roomId));
      }
    });
  };

  return (
    <Box as="form" onSubmit={handleSubmit} grow="Yes" direction="Column" gap="500">
      <Box direction="Column" gap="100">
        <Text size="L400">ID de usuario</Text>
        <Input
          defaultValue={defaultUserId}
          placeholder="@username:server"
          name="userIdInput"
          variant="SurfaceVariant"
          size="500"
          radii="400"
          required
          autoFocus
          autoComplete="off"
          disabled={disabled}
        />
        {invalidUserId && (
          <Box style={{ color: color.Critical.Main }} alignItems="Center" gap="100">
            <Icon src={Icons.Warning} filled size="50" />
            <Text size="T200" style={{ color: color.Critical.Main }}>
              <b>Ingresa un ID de usuario válido.</b>
            </Text>
          </Box>
        )}
      </Box>
      <Box shrink="No" direction="Column" gap="100">
        <Text size="L400">Opciones</Text>
        <SequenceCard
          style={{ padding: config.space.S300 }}
          variant="SurfaceVariant"
          direction="Column"
          gap="500"
        >
          <SettingTile
            title="Cifrado de extremo a extremo"
            description="Una vez activada esta función no se puede desactivar después de crear la sala."
            after={
              <Switch
                variant="Primary"
                value={encryption}
                onChange={setEncryption}
                disabled={disabled}
              />
            }
          />
        </SequenceCard>
      </Box>
      {error && (
        <Box style={{ color: color.Critical.Main }} alignItems="Center" gap="200">
          <Icon src={Icons.Warning} filled size="100" />
          <Text size="T300" style={{ color: color.Critical.Main }}>
            <b>
              {error instanceof MatrixError && error.name === ErrorCode.M_LIMIT_EXCEEDED
                ? `Server rate-limited your request for ${millisecondsToMinutes(
                    (error.data.retry_after_ms as number | undefined) ?? 0
                  )} minutes!`
                : error.message}
            </b>
          </Text>
        </Box>
      )}
      <Box shrink="No" direction="Column" gap="200">
        <Button
          type="submit"
          size="500"
          variant="Primary"
          radii="400"
          disabled={disabled}
          before={loading && <Spinner variant="Primary" fill="Solid" size="200" />}
        >
          <Text size="B500">Crear</Text>
        </Button>
      </Box>
    </Box>
  );
}
