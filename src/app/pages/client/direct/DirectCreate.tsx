import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Icon, IconButton, Icons, Scroll, Spinner } from 'folds';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { getDirectCreateSearchParams } from '../../pathSearchParam';
import { getDirectRoomPath } from '../../pathUtils';
import { getDMRoomFor } from '../../../utils/matrix';
import { useDirectRooms } from './useDirectRooms';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import {
  Page,
  PageContent,
  PageContentCenter,
  PageHeader,
  PageHero,
  PageHeroSection,
} from '../../../components/page';
import { BackRouteHandler } from '../../../components/BackRouteHandler';
import { CreateChat } from '../../../features/create-chat';
import { recoverArchivedDmWith } from '../../../features/dt-archive/archivedDms';

export function DirectCreate() {
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId } = getDirectCreateSearchParams(searchParams);

  const directs = useDirectRooms();
  const [recovering, setRecovering] = useState(false);
  const recoverTried = useRef<string>();

  useEffect(() => {
    if (userId) {
      const roomId = getDMRoomFor(mx, userId)?.roomId;
      if (roomId && directs.includes(roomId)) {
        navigate(getDirectRoomPath(roomId), { replace: true });
      }
    }
  }, [mx, navigate, directs, userId]);

  // DT: si no hay DM abierto pero la admin tiene uno archivado con esta
  // persona, se recupera y se abre directo (sin pasar por "Crear chat")
  useEffect(() => {
    if (!userId || recoverTried.current === userId || getDMRoomFor(mx, userId)) return;
    recoverTried.current = userId;
    setRecovering(true);
    recoverArchivedDmWith(mx, userId)
      .then((roomId) => {
        if (roomId) navigate(getDirectRoomPath(roomId), { replace: true });
      })
      .catch(() => undefined)
      .finally(() => setRecovering(false));
  }, [mx, navigate, userId]);

  return (
    <Page>
      {screenSize === ScreenSize.Mobile && (
        <PageHeader balance outlined={false}>
          <Box grow="Yes" alignItems="Center" gap="200">
            <BackRouteHandler>
              {(onBack) => (
                <IconButton onClick={onBack}>
                  <Icon src={Icons.ArrowLeft} />
                </IconButton>
              )}
            </BackRouteHandler>
          </Box>
        </PageHeader>
      )}
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <PageContentCenter>
              <PageHeroSection>
                <Box direction="Column" gap="700">
                  <PageHero
                    icon={<Icon size="600" src={Icons.Mention} />}
                    title="Crear chat"
                    subTitle="Iniciá un chat privado ingresando el ID de usuario."
                  />
                  {recovering ? (
                    <Box justifyContent="Center">
                      <Spinner size="400" />
                    </Box>
                  ) : (
                    <CreateChat defaultUserId={userId} />
                  )}
                </Box>
              </PageHeroSection>
            </PageContentCenter>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
