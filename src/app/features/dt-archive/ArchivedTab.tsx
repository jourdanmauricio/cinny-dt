import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../components/sidebar';
import { ARCHIVED_DMS_PATH, isDtAdminSession } from './archivedDms';

function ArchiveBoxIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

// DT: acceso a la sección "Archivados" (solo admins)
export function ArchivedTab() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!isDtAdminSession()) return null;
  const selected = pathname.startsWith(ARCHIVED_DMS_PATH);

  return (
    <SidebarItem active={selected}>
      <SidebarItemTooltip tooltip="Archivados">
        {(triggerRef) => (
          <SidebarAvatar
            as="button"
            ref={triggerRef}
            outlined
            onClick={() => navigate(ARCHIVED_DMS_PATH)}
            aria-label="Archivados"
          >
            <ArchiveBoxIcon />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
