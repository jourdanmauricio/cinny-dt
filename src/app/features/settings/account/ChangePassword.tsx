import React, { useState } from 'react';
import { Box, Text, Icon, Icons, Input, Button, IconButton, Spinner, config } from 'folds';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';

const API_URL = import.meta.env.VITE_DT_API_URL as string;

type FieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

function validate(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!currentPassword.trim()) {
    errors.currentPassword = 'Este campo es obligatorio.';
  }
  if (!newPassword.trim()) {
    errors.newPassword = 'Este campo es obligatorio.';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (!confirmPassword.trim()) {
    errors.confirmPassword = 'Este campo es obligatorio.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setStatusMessage(null);
    const errors = validate(currentPassword, newPassword, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const token = localStorage.getItem('dt_access_token');
    console.log('[ChangePassword] dt_access_token:', token);

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setFieldErrors({});
      } else if (response.status === 401) {
        setStatusMessage({ type: 'error', text: 'Contraseña actual incorrecta.' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ocurrió un error. Por favor, intenta de nuevo.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'No se pudo conectar con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Cambiar contraseña</Text>
      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <Box direction="Column" gap="300">
          {/* Current Password */}
          <Box direction="Column" gap="100">
            <Text size="T300">Contraseña actual</Text>
            <Input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              variant="Secondary"
              radii="300"
              type={showCurrent ? 'text' : 'password'}
              readOnly={loading}
              style={{ paddingRight: config.space.S200 }}
              after={
                <IconButton
                  type="button"
                  size="300"
                  radii="300"
                  variant="Secondary"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon src={showCurrent ? Icons.EyeBlind : Icons.Eye} size="100" />
                </IconButton>
              }
            />
            {fieldErrors.currentPassword && (
              <Text size="T200" style={{ color: 'var(--mx-danger)' }}>
                {fieldErrors.currentPassword}
              </Text>
            )}
          </Box>

          {/* New Password */}
          <Box direction="Column" gap="100">
            <Text size="T300">Nueva contraseña</Text>
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              variant="Secondary"
              radii="300"
              type={showNew ? 'text' : 'password'}
              readOnly={loading}
              style={{ paddingRight: config.space.S200 }}
              after={
                <IconButton
                  type="button"
                  size="300"
                  radii="300"
                  variant="Secondary"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon src={showNew ? Icons.EyeBlind : Icons.Eye} size="100" />
                </IconButton>
              }
            />
            {fieldErrors.newPassword && (
              <Text size="T200" style={{ color: 'var(--mx-danger)' }}>
                {fieldErrors.newPassword}
              </Text>
            )}
          </Box>

          {/* Confirm New Password */}
          <Box direction="Column" gap="100">
            <Text size="T300">Confirmar nueva contraseña</Text>
            <Input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              variant="Secondary"
              radii="300"
              type={showConfirm ? 'text' : 'password'}
              readOnly={loading}
              style={{ paddingRight: config.space.S200 }}
              after={
                <IconButton
                  type="button"
                  size="300"
                  radii="300"
                  variant="Secondary"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon src={showConfirm ? Icons.EyeBlind : Icons.Eye} size="100" />
                </IconButton>
              }
            />
            {fieldErrors.confirmPassword && (
              <Text size="T200" style={{ color: 'var(--mx-danger)' }}>
                {fieldErrors.confirmPassword}
              </Text>
            )}
          </Box>

          {/* Status message */}
          {statusMessage && (
            <Text
              size="T200"
              style={{
                color: statusMessage.type === 'success' ? 'var(--mx-success)' : 'var(--mx-danger)',
              }}
            >
              {statusMessage.text}
            </Text>
          )}

          {/* Save button */}
          <Box justifyContent="End">
            <Button
              size="400"
              variant="Success"
              fill="Solid"
              radii="300"
              disabled={loading}
              onClick={handleSave}
            >
              {loading && <Spinner variant="Success" fill="Solid" size="300" />}
              <Text size="B400">Guardar</Text>
            </Button>
          </Box>
        </Box>
      </SequenceCard>
    </Box>
  );
}
