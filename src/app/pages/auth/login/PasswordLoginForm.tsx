import React, { FormEventHandler, useState } from 'react';
import { Overlay, OverlayBackdrop, OverlayCenter, Spinner } from 'folds';
import { CustomLoginResponse, useLoginComplete } from './loginUtil';
import { dtLogin } from './dtLogin';
import { clearPreviousSessionData } from '../../../state/sessions';
import * as css from './loginForm.css';

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #EDB5C0',
  borderRadius: '8px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#3c4043',
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...baseInputStyle,
  borderColor: '#E8829F',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B3D4E',
  fontWeight: 400,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PasswordLoginFormProps = {
  defaultUsername?: string;
  defaultEmail?: string;
};

export function PasswordLoginForm({ defaultEmail }: PasswordLoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<CustomLoginResponse | undefined>();
  const [passwordVisible, setPasswordVisible] = useState(false);

  useLoginComplete(loginData);

  const webUrl = import.meta.env.VITE_DT_WEB_URL ?? 'http://localhost:3000';

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    const { emailInput, passwordInput } = evt.target as HTMLFormElement & {
      emailInput: HTMLInputElement;
      passwordInput: HTMLInputElement;
    };
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;

    if (!email) {
      setEmailError('El email es requerido');
      hasError = true;
    } else if (!EMAIL_RE.test(email)) {
      setEmailError('Email inválido');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('La contraseña es requerida');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    setLoading(true);
    setServerError(null);
    try {
      const dtRes = await dtLogin(email, password);
      clearPreviousSessionData();
      localStorage.setItem('dt_access_token', dtRes.dtToken);
      localStorage.setItem('dt_is_admin', String(dtRes.isAdmin === true));
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
      if (err.status === 401) setServerError('Email o contraseña incorrectos.');
      else if (err.status === 403) window.location.href = `${webUrl}/user`;
      else setServerError('Error al iniciar sesión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={css.dtLoginForm}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      {/* Email */}
      <div style={{ position: 'relative', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>Email</label>
        <input
          defaultValue={defaultEmail}
          name="emailInput"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@email.com"
          style={emailError ? inputErrorStyle : baseInputStyle}
        />
        {emailError && <p className={css.dtFieldError}>{emailError}</p>}
      </div>

      {/* Contraseña */}
      <div style={{ position: 'relative', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>Contraseña</label>
          <a
            href={`${webUrl}/forgot-password?redirect=chat`}
            style={{ fontSize: '13px' }}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            name="passwordInput"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            style={{
              ...(passwordError ? inputErrorStyle : baseInputStyle),
              paddingRight: '42px',
            }}
          />
          <button
            type="button"
            onClick={() => setPasswordVisible(!passwordVisible)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {passwordVisible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {passwordError && <p className={css.dtFieldError}>{passwordError}</p>}
        {serverError && <p className={css.dtFieldError}>{serverError}</p>}
      </div>

      {/* Botón ingresar */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#E8829F',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: loading ? 0.7 : 1,
          transition: 'background-color 0.15s',
        }}
        onMouseOver={(e) => {
          if (!loading)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4637E';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8829F';
        }}
      >
        Ingresar
      </button>

      {/* Separador OAuth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, height: '1px', background: '#EDB5C0' }} />
        <span
          style={{
            fontSize: '11px',
            color: '#9ca3af',
            letterSpacing: '0.06em',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          O CONTINUÁ CON
        </span>
        <div style={{ flex: 1, height: '1px', background: '#EDB5C0' }} />
      </div>

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
          background: '#ffffff',
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
      <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        ¿No tenés cuenta?{' '}
        <a
          href={`${webUrl}/register`}
          style={{ fontWeight: 600, color: '#1C1719' }}
        >
          Registrate
        </a>
      </div>

      <Overlay open={loading} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <Spinner variant="Secondary" size="600" />
        </OverlayCenter>
      </Overlay>
    </form>
  );
}
