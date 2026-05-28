import React from 'react';
import { Box, toRem, config, Icons, Icon, Text } from 'folds';

export function NoStickerPacks() {
  return (
    <Box
      style={{ padding: `${toRem(60)} ${config.space.S500}` }}
      alignItems="Center"
      justifyContent="Center"
      direction="Column"
      gap="300"
    >
      <Icon size="600" src={Icons.Sticker} />
      <Box direction="Inherit">
        <Text align="Center">¡Sin packs de stickers!</Text>
        <Text priority="300" align="Center" size="T200">
          Agrega stickers desde la configuración de usuario, sala o espacio.
        </Text>
      </Box>
    </Box>
  );
}
