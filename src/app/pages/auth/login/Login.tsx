import React from 'react';
import { PasswordLoginForm } from './PasswordLoginForm';

export function Login() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <p style={{ margin: 0, textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        Iniciar sesión
      </p>
      <PasswordLoginForm />
    </div>
  );
}
