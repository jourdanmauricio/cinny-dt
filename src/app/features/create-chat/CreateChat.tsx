import { Box, Button, color, Icon, Icons, Input, Spinner, Text } from 'folds';
import React, { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { MatrixError, Preset, Visibility } from 'matrix-js-sdk';
import { useNavigate } from 'react-router-dom';
import {
  addRoomIdToMDirect,
  getCanonicalAliasOrRoomId,
  getDMRoomFor,
  isUserId,
} from '../../utils/matrix';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { ErrorCode } from '../../cs-errorcode';
import { millisecondsToMinutes } from '../../utils/common';
import { useAlive } from '../../hooks/useAlive';
import { getDirectPath, getDirectRoomPath } from '../../pages/pathUtils';
import { AppIdMatch, AppIdMatches, searchByAppId } from '../../components/app-id-search';

type CreateChatProps = {
  defaultUserId?: string;
};
export function CreateChat({ defaultUserId }: CreateChatProps) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const navigate = useNavigate();

  const isAdmin = localStorage.getItem('dt_is_admin') === 'true';

  useEffect(() => {
    if (!isAdmin) navigate(getDirectPath(), { replace: true });
  }, [isAdmin, navigate]);

  const [invalidUserId, setInvalidUserId] = useState(false);
  const userIdInputRef = useRef<HTMLInputElement>(null);

  // DT: si no es un ID de Matrix, se busca como ID de Sugo/Contigo
  const [appIdMatches, setAppIdMatches] = useState<AppIdMatch[]>();
  const [appIdLookupState, lookupAppId] = useAsyncCallback<AppIdMatch[], Error, [string]>(
    useCallback((appId) => searchByAppId(mx, appId), [mx])
  );

  const [createState, create] = useAsyncCallback<string, Error | MatrixError, [string]>(
    useCallback(
      async (userId) => {
        const existing = getDMRoomFor(mx, userId);
        if (existing) {
          return getCanonicalAliasOrRoomId(mx, existing.roomId);
        }

        const result = await mx.createRoom({
          is_direct: true,
          invite: [userId],
          visibility: Visibility.Private,
          preset: Preset.TrustedPrivateChat,
        });

        // Wait for the m.direct echo before returning, otherwise
        // DirectRouteRoomProvider won't recognize the room yet when we
        // navigate to it and will bounce back to the Direct list.
        await addRoomIdToMDirect(mx, result.room_id, userId);

        return result.room_id;
      },
      [mx]
    )
  );
  const loading =
    createState.status === AsyncStatus.Loading || appIdLookupState.status === AsyncStatus.Loading;
  const error = createState.status === AsyncStatus.Error ? createState.error : undefined;
  const lookupError =
    appIdLookupState.status === AsyncStatus.Error ? appIdLookupState.error : undefined;
  const notFound =
    appIdLookupState.status === AsyncStatus.Success && appIdLookupState.data.length === 0;
  const disabled = loading;

  const openChat = (userId: string) => {
    create(userId).then((roomId) => {
      if (alive()) {
        if (userIdInputRef.current) userIdInputRef.current.value = '';
        setAppIdMatches(undefined);
        navigate(getDirectRoomPath(roomId));
      }
    });
  };

  if (!isAdmin) return null;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    setInvalidUserId(false);

    setAppIdMatches(undefined);
    const userId = userIdInputRef.current?.value.trim();
    if (!userId) return;

    if (isUserId(userId)) {
      openChat(userId);
      return;
    }
    if (userId.startsWith('@')) {
      setInvalidUserId(true);
      return;
    }

    lookupAppId(userId)
      .then((matches) => {
        if (!alive()) return;
        if (matches.length === 1) openChat(matches[0].synapseUserId);
        else if (matches.length > 1) setAppIdMatches(matches);
      })
      .catch(() => {
        // el error queda en appIdLookupState y se muestra en el formulario
      });
  };

  return (
    <Box as="form" onSubmit={handleSubmit} grow="Yes" direction="Column" gap="500">
      <Box direction="Column" gap="100">
        <Text size="L400">ID de usuario o ID de Sugo/Contigo</Text>
        <Input
          ref={userIdInputRef}
          defaultValue={defaultUserId}
          placeholder="@usuario:servidor o ID de la app"
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
        {notFound && (
          <Box style={{ color: color.Critical.Main }} alignItems="Center" gap="100">
            <Icon src={Icons.Warning} filled size="50" />
            <Text size="T200" style={{ color: color.Critical.Main }}>
              <b>No se encontró ninguna usuaria con ese ID.</b>
            </Text>
          </Box>
        )}
        {lookupError && (
          <Box style={{ color: color.Critical.Main }} alignItems="Center" gap="100">
            <Icon src={Icons.Warning} filled size="50" />
            <Text size="T200" style={{ color: color.Critical.Main }}>
              <b>{lookupError.message}</b>
            </Text>
          </Box>
        )}
      </Box>
      {appIdMatches && (
        <Box direction="Column" gap="200">
          <Text size="L400">Hay varias usuarias con ese ID. Elegí con quién chatear:</Text>
          <AppIdMatches
            matches={appIdMatches}
            disabled={disabled}
            onSelect={(match) => openChat(match.synapseUserId)}
          />
        </Box>
      )}

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
