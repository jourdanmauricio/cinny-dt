import React from 'react';
import { Box, Text } from 'folds';
import { PasswordLoginForm } from './PasswordLoginForm';

export function Login() {
  return (
    <Box direction="Column" gap="500">
      <Text size="H2" priority="400">
        Iniciar sesión
      </Text>
      <PasswordLoginForm />
    </Box>
  );
}
