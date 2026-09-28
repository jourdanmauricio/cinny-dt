import React, { MouseEvent } from 'react';
import { Avatar, Box, Icon, Icons, MenuItem, Text, config } from 'folds';
import { UserAvatar } from '../user-avatar';
import { DT_APP_LABEL } from '../../hooks/useCommunityStats';
import { AppIdMatch } from './searchByAppId';

type AppIdMatchesProps = {
  matches: AppIdMatch[];
  onSelect: (match: AppIdMatch, target: HTMLElement) => void;
  disabled?: boolean;
};

// DT: lista de coincidencias al buscar por ID de Sugo/Contigo (puede haber una por app)
export function AppIdMatches({ matches, onSelect, disabled }: AppIdMatchesProps) {
  return (
    <Box direction="Column" gap="100">
      {matches.map((match) => {
        const name = match.displayName ?? match.synapseUserId;
        return (
          <MenuItem
            key={match.synapseUserId}
            type="button"
            style={{ padding: `${config.space.S100} ${config.space.S200}` }}
            variant="SurfaceVariant"
            radii="400"
            disabled={disabled}
            onClick={(evt: MouseEvent<HTMLButtonElement>) => onSelect(match, evt.currentTarget)}
            before={
              <Avatar size="300">
                <UserAvatar
                  userId={match.synapseUserId}
                  alt={name}
                  renderFallback={() => <Icon size="100" src={Icons.User} filled />}
                />
              </Avatar>
            }
          >
            <Box grow="Yes" direction="Column">
              <Text size="T400" truncate>
                {name}
              </Text>
              <Text size="T200" priority="300" truncate>
                {`ID: ${match.sugoId} · Cuenta: ${
                  DT_APP_LABEL[match.appOrigin] ?? match.appOrigin
                }`}
              </Text>
            </Box>
          </MenuItem>
        );
      })}
    </Box>
  );
}
