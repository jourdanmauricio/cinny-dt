import React from 'react';
import { Box, Text, IconButton, Icon, Icons, Scroll } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { MatrixId } from './MatrixId';
import { Profile } from './Profile';
import { ContactInformation } from './ContactInfo';
import { IgnoredUserList } from './IgnoredUserList';
import { ChangePassword } from './ChangePassword';

type AccountProps = {
  requestClose: () => void;
};
export function Account({ requestClose }: AccountProps) {
  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Cuenta
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Profile />
              {/* DT: Matrix ID - oculto para todos los roles; expone el ID interno de Matrix
              <MatrixId />
              */}
              {/* DT: Información de contacto - oculto para todos los roles
              <ContactInformation />
              */}
              {/* DT: Blocked Users - oculto para todos los roles; no aplica para DT
              <IgnoredUserList />
              */}
              <ChangePassword />
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
