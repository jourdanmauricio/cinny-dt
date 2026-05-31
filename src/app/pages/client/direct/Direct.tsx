import React, {
  MouseEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  PopOut,
  RectCords,
  Text,
  config,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import FocusTrap from 'focus-trap-react';
import { useNavigate } from 'react-router-dom';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { factoryRoomIdByActivity } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
} from '../../../components/nav';
import { getDirectCreatePath, getDirectRoomPath } from '../../pathUtils';
import {
  addRoomIdToMDirect,
  getCanonicalAliasOrRoomId,
  getDMRoomFor,
} from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { useDirectRooms } from './useDirectRooms';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../utils/notifications';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { useDirectCreateSelected } from '../../../hooks/router/useDirectSelected';
import { dtAdminsAtom, DtAdmin } from '../../../state/dtAdmins';

type DirectMenuProps = {
  requestClose: () => void;
};
const DirectMenu = forwardRef<HTMLDivElement, DirectMenuProps>(({ requestClose }, ref) => {
  const mx = useMatrixClient();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const orphanRooms = useDirectRooms();
  const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);

  const handleMarkAsRead = () => {
    if (!unread) return;
    orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Marcar como leído
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

function DirectHeader() {
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Text size="H4" truncate>
              Mensajes directos
            </Text>
          </Box>
          <Box>
            <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <DirectMenu requestClose={() => setMenuAnchor(undefined)} />
          </FocusTrap>
        }
      />
    </>
  );
}

type DirectEmptyProps = {
  isAdmin: boolean;
  dtAdmins: DtAdmin[] | null;
  onAdminClick: (admin: DtAdmin) => void;
};

function DirectEmpty({ isAdmin, dtAdmins, onAdminClick }: DirectEmptyProps) {
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <NavEmptyCenter>
        <NavEmptyLayout
          icon={<Icon size="600" src={Icons.Mention} />}
          title={
            <Text size="H5" align="Center">
              Sin mensajes directos
            </Text>
          }
          content={
            <Text size="T300" align="Center">
              Enviá un mensaje a un administrador.
            </Text>
          }
          options={
            <Box direction="Column" gap="200">
              {(dtAdmins ?? []).map((admin) => (
                <Button
                  key={admin.synapseUserId}
                  variant="Secondary"
                  size="300"
                  onClick={() => onAdminClick(admin)}
                >
                  <Text size="B300" truncate>
                    {admin.displayName}
                  </Text>
                </Button>
              ))}
            </Box>
          }
        />
      </NavEmptyCenter>
    );
  }

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Mention} />}
        title={
          <Text size="H5" align="Center">
            Sin mensajes directos
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            Aún no tienes ningún mensaje directo.
          </Text>
        }
        options={
          <Button variant="Secondary" size="300" onClick={() => navigate(getDirectCreatePath())}>
            <Text size="B300" truncate>
              Mensaje directo
            </Text>
          </Button>
        }
      />
    </NavEmptyCenter>
  );
}

const DEFAULT_CATEGORY_ID = makeNavCategoryId('direct', 'direct');
export function Direct() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('direct');
  const scrollRef = useRef<HTMLDivElement>(null);
  const directs = useDirectRooms();
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const navigate = useNavigate();

  const isAdmin = useMemo(() => localStorage.getItem('dt_is_admin') === 'true', []);
  const [dtAdmins, setDtAdmins] = useAtom(dtAdminsAtom);
  const [confirmAdmin, setConfirmAdmin] = useState<DtAdmin | null>(null);
  const [confirmRoomPath, setConfirmRoomPath] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin || dtAdmins !== null) return;
    const apiUrl = import.meta.env.VITE_DT_API_URL as string;
    fetch(`${apiUrl}/matrix/admins`)
      .then((r) => r.json())
      .then((data: DtAdmin[]) => setDtAdmins(data))
      .catch(() => setDtAdmins([]));
  }, [isAdmin, dtAdmins, setDtAdmins]);

  const handleAdminClick = useCallback(
    async (admin: DtAdmin) => {
      const existing = getDMRoomFor(mx, admin.synapseUserId);
      if (existing) {
        navigate(getDirectRoomPath(getCanonicalAliasOrRoomId(mx, existing.roomId)));
        return;
      }

      const result = await mx.createRoom({
        is_direct: true,
        invite: [admin.synapseUserId],
        visibility: 'private' as any,
        preset: 'trusted_private_chat' as any,
      });
      addRoomIdToMDirect(mx, result.room_id, admin.synapseUserId);
      navigate(getDirectRoomPath(result.room_id));
    },
    [mx, navigate]
  );

  const createDirectSelected = useDirectCreateSelected();

  const selectedRoomId = useSelectedRoom();
  const noRoomToDisplay = directs.length === 0;
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());

  const sortedDirects = useMemo(() => {
    const items = Array.from(directs).sort(factoryRoomIdByActivity(mx));
    if (closedCategories.has(DEFAULT_CATEGORY_ID)) {
      return items.filter((rId) => roomToUnread.has(rId) || rId === selectedRoomId);
    }
    return items;
  }, [mx, directs, closedCategories, roomToUnread, selectedRoomId]);

  const virtualizer = useVirtualizer({
    count: sortedDirects.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  return (
    <PageNav>
      <DirectHeader />
      {noRoomToDisplay ? (
        <DirectEmpty isAdmin={isAdmin} dtAdmins={dtAdmins} onAdminClick={setConfirmAdmin} />
      ) : (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            {isAdmin ? (
              <NavCategory>
                <NavItem variant="Background" radii="400" aria-selected={createDirectSelected}>
                  <NavButton onClick={() => navigate(getDirectCreatePath())}>
                    <NavItemContent>
                      <Box as="span" grow="Yes" alignItems="Center" gap="200">
                        <Avatar size="200" radii="400">
                          <Icon src={Icons.Plus} size="100" />
                        </Avatar>
                        <Box as="span" grow="Yes">
                          <Text as="span" size="Inherit" truncate>
                            Crear chat
                          </Text>
                        </Box>
                      </Box>
                    </NavItemContent>
                  </NavButton>
                </NavItem>
              </NavCategory>
            ) : (
              <NavCategory>
                {(dtAdmins ?? []).map((admin) => (
                  <NavItem key={admin.synapseUserId} variant="Background" radii="400">
                    <NavButton onClick={() => setConfirmAdmin(admin)}>
                      <NavItemContent>
                        <Box as="span" grow="Yes" alignItems="Center" gap="200">
                          <Avatar size="200" radii="400">
                            <Icon src={Icons.Mention} size="100" />
                          </Avatar>
                          <Box as="span" grow="Yes">
                            <Text as="span" size="Inherit" truncate>
                              {admin.displayName}
                            </Text>
                          </Box>
                        </Box>
                      </NavItemContent>
                    </NavButton>
                  </NavItem>
                ))}
              </NavCategory>
            )}
            <NavCategory>
              <NavCategoryHeader>
                <RoomNavCategoryButton
                  closed={closedCategories.has(DEFAULT_CATEGORY_ID)}
                  data-category-id={DEFAULT_CATEGORY_ID}
                  onClick={handleCategoryClick}
                >
                  Chats
                </RoomNavCategoryButton>
              </NavCategoryHeader>
              <div
                style={{
                  position: 'relative',
                  height: virtualizer.getTotalSize(),
                }}
              >
                {virtualizer.getVirtualItems().map((vItem) => {
                  const roomId = sortedDirects[vItem.index];
                  const room = mx.getRoom(roomId);
                  if (!room) return null;
                  const selected = selectedRoomId === roomId;

                  return (
                    <VirtualTile
                      virtualItem={vItem}
                      key={vItem.index}
                      ref={virtualizer.measureElement}
                    >
                      <RoomNavItem
                        room={room}
                        selected={selected}
                        showAvatar
                        direct
                        linkPath={getDirectRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                        notificationMode={getRoomNotificationMode(
                          notificationPreferences,
                          room.roomId
                        )}
                        onDirectClick={
                          !isAdmin
                            ? () =>
                                setConfirmRoomPath(
                                  getDirectRoomPath(getCanonicalAliasOrRoomId(mx, roomId))
                                )
                            : undefined
                        }
                      />
                    </VirtualTile>
                  );
                })}
              </div>
            </NavCategory>
          </Box>
        </PageNavContent>
      )}
      <Overlay
        open={confirmAdmin !== null || confirmRoomPath !== null}
        backdrop={<OverlayBackdrop />}
      >
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: () => {
                setConfirmAdmin(null);
                setConfirmRoomPath(null);
              },
              clickOutsideDeactivates: true,
              escapeDeactivates: true,
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
                  <Text size="H4">Mensajes directos</Text>
                </Box>
              </Header>
              <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
                <Text priority="400">
                  Solo podés escribirle a una administradora a la vez. Si ya le escribiste a otra,
                  por favor no abras un nuevo chat para evitar atrasos en las respuestas.
                </Text>
                <Box direction="Column" gap="200">
                  <Button
                    variant="Primary"
                    onClick={() => {
                      if (confirmAdmin) handleAdminClick(confirmAdmin);
                      else if (confirmRoomPath) navigate(confirmRoomPath);
                      setConfirmAdmin(null);
                      setConfirmRoomPath(null);
                    }}
                  >
                    <Text size="B400">Entendido, continuar</Text>
                  </Button>
                  <Button
                    variant="Secondary"
                    fill="Soft"
                    onClick={() => {
                      setConfirmAdmin(null);
                      setConfirmRoomPath(null);
                    }}
                  >
                    <Text size="B400">Cancelar</Text>
                  </Button>
                </Box>
              </Box>
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </PageNav>
  );
}
