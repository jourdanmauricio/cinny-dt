import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Icon,
  IconButton,
  Icons,
  Input,
  Scroll,
  Spinner,
  Text,
  color,
  config,
} from 'folds';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../components/page';
import { BackRouteHandler } from '../../components/BackRouteHandler';
import { SequenceCard } from '../../components/sequence-card';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { nameInitials } from '../../utils/common';
import { getDirectRoomPath } from '../../pages/pathUtils';
import { ArchivedDm, listArchivedDms, unarchiveAndJoin } from './archivedDms';

const APP_LABEL: Record<string, string> = { sugo: 'Sugo', contigo: 'Contigo' };
const SEARCH_DEBOUNCE_MS = 400;

function ArchivedRow({
  item,
  opening,
  onOpen,
}: {
  item: ArchivedDm;
  opening: boolean;
  onOpen: () => void;
}) {
  const name = item.displayName?.trim() || item.otherSynapseUserId;
  const archivedAt = new Date(item.archivedAt).toLocaleDateString('es-AR');
  return (
    <SequenceCard
      variant="SurfaceVariant"
      direction="Row"
      alignItems="Center"
      gap="300"
      style={{ padding: config.space.S300, cursor: 'pointer' }}
      as="button"
      onClick={onOpen}
      disabled={opening}
    >
      <Avatar size="300" radii="400">
        <Text size="H6">{nameInitials(name)}</Text>
      </Avatar>
      <Box grow="Yes" direction="Column" style={{ minWidth: 0, textAlign: 'left' }}>
        <Text size="T400" truncate>
          {name}
        </Text>
        <Text size="T200" priority="300" truncate>
          {[
            item.appOrigin && APP_LABEL[item.appOrigin],
            item.sugoId && `ID ${item.sugoId}`,
            `Archivado el ${archivedAt}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </Box>
      {opening && <Spinner size="200" />}
    </SequenceCard>
  );
}

// DT: sección "Archivados" (solo admins). La lista sale de dt-api (no carga
// salas); al tocar un DM se desarchiva y se abre con todo el historial.
export function ArchivedDmsPage() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const screenSize = useScreenSizeContext();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ArchivedDm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [openingId, setOpeningId] = useState<string>();
  const requestId = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (query: string, pageToLoad: number) => {
      const current = ++requestId.current;
      setLoading(true);
      setError(undefined);
      try {
        const res = await listArchivedDms(mx, { search: query || undefined, page: pageToLoad });
        if (current !== requestId.current) return;
        setItems((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]));
        setTotal(res.total);
        setPage(pageToLoad);
      } catch (err) {
        if (current === requestId.current) setError((err as Error).message);
      } finally {
        if (current === requestId.current) setLoading(false);
      }
    },
    [mx]
  );

  // Búsqueda con espera: no consulta por cada tecla
  useEffect(() => {
    const timer = setTimeout(() => load(search.trim(), 1), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, load]);

  const handleOpen = async (item: ArchivedDm) => {
    setOpeningId(item.roomId);
    setError(undefined);
    try {
      const roomId = await unarchiveAndJoin(mx, item.roomId);
      navigate(getDirectRoomPath(roomId));
    } catch (err) {
      setError((err as Error).message);
      // El DM pudo quedar fuera de la lista (ej. ya no se puede recuperar)
      load(search.trim(), 1);
    } finally {
      setOpeningId(undefined);
    }
  };

  const hasMore = items.length < total;

  // Paginación al hacer scroll: al llegar al final de la lista se pide la
  // página siguiente (de a 20, desde dt-api)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) load(search.trim(), page + 1);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, load, page, search]);

  return (
    <Page>
      <PageHeader balance>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" basis="No">
            {screenSize === ScreenSize.Mobile && (
              <BackRouteHandler>
                {(onBack) => (
                  <IconButton onClick={onBack}>
                    <Icon src={Icons.ArrowLeft} />
                  </IconButton>
                )}
              </BackRouteHandler>
            )}
          </Box>
          <Box alignItems="Center" gap="200">
            {screenSize !== ScreenSize.Mobile && <Icon size="400" src={Icons.Inbox} />}
            <Text size="H3" truncate>
              Archivados
            </Text>
          </Box>
          <Box grow="Yes" basis="No" />
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <PageContentCenter>
              <Box direction="Column" gap="400">
                <Text size="T300" priority="300">
                  Al abrir una conversación se desarchiva y vuelve a tus mensajes, con todo el
                  historial. Si la otra persona te escribe, vuelve sola.
                </Text>
                <Input
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, email o ID de Sugo/Contigo"
                  before={<Icon size="200" src={Icons.Search} />}
                  variant="Background"
                  size="500"
                  radii="400"
                />
                {error && (
                  <Text size="T300" style={{ color: color.Critical.Main }}>
                    {error}
                  </Text>
                )}
                <Box direction="Column" gap="100">
                  {items.map((item) => (
                    <ArchivedRow
                      key={item.roomId}
                      item={item}
                      opening={openingId === item.roomId}
                      onOpen={() => handleOpen(item)}
                    />
                  ))}
                </Box>
                {!loading && items.length === 0 && !error && (
                  <Text size="T300" priority="300" align="Center">
                    {search.trim()
                      ? 'No hay conversaciones archivadas que coincidan.'
                      : 'No tenés conversaciones archivadas.'}
                  </Text>
                )}
                {loading && (
                  <Box justifyContent="Center">
                    <Spinner size="400" />
                  </Box>
                )}
                <div ref={sentinelRef} style={{ height: 1 }} />
              </Box>
            </PageContentCenter>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
