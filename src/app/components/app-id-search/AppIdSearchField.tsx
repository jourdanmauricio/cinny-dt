import React, { FormEventHandler, useCallback, useRef, useState } from 'react';
import { Box, Icon, Icons, Input, Spinner, Text, color } from 'folds';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { AppIdMatch, searchByAppId } from './searchByAppId';
import { AppIdMatches } from './AppIdMatches';

type AppIdSearchFieldProps = {
  onSelect: (match: AppIdMatch, target: HTMLElement) => void;
};

// DT: campo de búsqueda por ID de Sugo/Contigo (busca al presionar Enter, no en cada tecla)
export function AppIdSearchField({ onSelect }: AppIdSearchFieldProps) {
  const mx = useMatrixClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchedId, setSearchedId] = useState<string>();
  const [state, lookup] = useAsyncCallback<AppIdMatch[], Error, [string]>(
    useCallback((appId) => searchByAppId(mx, appId), [mx])
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const appId = inputRef.current?.value.trim();
    if (!appId) return;
    setSearchedId(appId);
    lookup(appId).catch(() => {
      // el error queda en state y se muestra debajo del campo
    });
  };

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    setSearchedId(undefined);
  };

  const loading = state.status === AsyncStatus.Loading;

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Column" gap="100">
      <Input
        ref={inputRef}
        placeholder="Buscar por ID de Sugo/Contigo..."
        variant="Surface"
        size="400"
        radii="400"
        autoComplete="off"
        before={<Icon size="50" src={Icons.User} />}
        after={loading && <Spinner size="50" variant="Secondary" />}
        onChange={(evt) => {
          if (!evt.currentTarget.value) setSearchedId(undefined);
        }}
      />
      {searchedId && state.status === AsyncStatus.Error && (
        <Text size="T200" style={{ color: color.Critical.Main }}>
          {state.error.message}
        </Text>
      )}
      {searchedId && state.status === AsyncStatus.Success && state.data.length === 0 && (
        <Text size="T200" priority="300">
          No se encontró ninguna usuaria con ese ID.
        </Text>
      )}
      {searchedId && state.status === AsyncStatus.Success && state.data.length > 0 && (
        <AppIdMatches
          matches={state.data}
          onSelect={(match, target) => {
            onSelect(match, target);
            handleClear();
          }}
        />
      )}
    </Box>
  );
}
