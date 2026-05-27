import React, { FormEventHandler, useState } from 'react';
import { Box, Button, Overlay, OverlayBackdrop, OverlayCenter, Spinner, Text } from 'folds';
import { CustomLoginResponse, useLoginComplete } from './loginUtil';
import { PasswordInput } from '../../../components/password-input';
import { FieldError } from '../FiledError';
import { dtLogin } from './dtLogin';

type PasswordLoginFormProps = {
  defaultUsername?: string;
  defaultEmail?: string;
};
export function PasswordLoginForm({ defaultEmail }: PasswordLoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<CustomLoginResponse | undefined>();

  useLoginComplete(loginData);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    const { emailInput, passwordInput } = evt.target as HTMLFormElement & {
      emailInput: HTMLInputElement;
      passwordInput: HTMLInputElement;
    };
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email) {
      emailInput.focus();
      return;
    }
    if (!password) {
      passwordInput.focus();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dtRes = await dtLogin(email, password);
      const data: CustomLoginResponse = {
        baseUrl: dtRes.homeserver,
        response: {
          access_token: dtRes.token,
          device_id: `DT_${Date.now()}`,
          user_id: dtRes.userId,
        } as any,
      };
      setLoginData(data);
    } catch (err: any) {
      if (err.status === 401) setError('Email o contraseña incorrectos.');
      else if (err.status === 403) setError('Tu cuenta aún no fue aprobada.');
      else setError('Error al iniciar sesión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const webUrl = import.meta.env.VITE_DT_WEB_URL ?? 'http://localhost:3000';

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Inherit" gap="400">
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Email
        </Text>
        <input
          defaultValue={defaultEmail}
          name="emailInput"
          type="email"
          required
          autoComplete="email"
          style={{ width: '100%' }}
        />
      </Box>
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Password
        </Text>
        <PasswordInput name="passwordInput" variant="Background" size="500" outlined required />
        <Box alignItems="Start" justifyContent="SpaceBetween" gap="200">
          {error && <FieldError message={error} />}
          <Box grow="Yes" shrink="No" justifyContent="End">
            <Text as="span" size="T200" priority="400" align="Right">
              <a href={`${webUrl}/forgot-password?redirect=chat`}>¿Olvidaste tu contraseña?</a>
            </Text>
          </Box>
        </Box>
      </Box>
      <Button type="submit" variant="Primary" size="500">
        <Text as="span" size="B500">
          Login
        </Text>
      </Button>

      <Overlay open={loading} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <Spinner variant="Secondary" size="600" />
        </OverlayCenter>
      </Overlay>
    </Box>
  );
}
