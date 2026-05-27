import React, { FormEventHandler, useState } from 'react';
import { Box, Button, Overlay, OverlayBackdrop, OverlayCenter, Spinner, Text } from 'folds';
import { CustomLoginResponse, useLoginComplete } from './loginUtil';
import { PasswordInput } from '../../../components/password-input';
import { FieldError } from '../FiledError';
import { dtLogin } from './dtLogin';
import { clearPreviousSessionData } from '../../../state/sessions';

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
      // Limpiar datos de sesión anterior antes de guardar los nuevos tokens
      clearPreviousSessionData();
      localStorage.setItem('dt_access_token', dtRes.dtToken);
      const data: CustomLoginResponse = {
        baseUrl: dtRes.homeserver,
        response: {
          access_token: dtRes.token,
          device_id: dtRes.deviceId,
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

      {/* Separador OAuth */}
      <Box alignItems="Center" gap="200">
        <Box
          grow="Yes"
          style={{ height: '1px', background: 'var(--bg-surface-border, #e0e0e0)' }}
        />
        <Text size="T200" priority="300">
          O CONTINUÁ CON
        </Text>
        <Box
          grow="Yes"
          style={{ height: '1px', background: 'var(--bg-surface-border, #e0e0e0)' }}
        />
      </Box>

      {/* Botón Google */}
      <button
        type="button"
        onClick={() => {
          window.location.href = `${import.meta.env.VITE_DT_API_URL}/auth/google?state=chat`;
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          padding: '10px 16px',
          border: '1.5px solid #dadce0',
          borderRadius: '8px',
          background: '#fff',
          color: '#3c4043',
          fontSize: '15px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'box-shadow 0.15s',
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        }}
      >
        {/* Google logo SVG */}
        <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        Continuar con Google
      </button>

      {/* Link de registro */}
      <Box justifyContent="Center" gap="200">
        <Text size="T300" priority="300">
          ¿No tenés cuenta?{' '}
          <a href={`${webUrl}/register`}>Registrate</a>
        </Text>
      </Box>

      <Overlay open={loading} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <Spinner variant="Secondary" size="600" />
        </OverlayCenter>
      </Overlay>
    </Box>
  );
}
