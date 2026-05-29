/* eslint-disable import/first */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';

enableMapSet();

import './index.css';

import { trimTrailingSlash } from './app/utils/common';
import App from './app/pages/App';

// import i18n (needs to be bundled ;))
import './app/i18n';
import { pushSessionToSW } from './sw-session';
import { clearPreviousSessionData, getFallbackSession, setFallbackSession } from './app/state/sessions';

document.body.classList.add(configClass, varsClass);

// Register Service Worker
if ('serviceWorker' in navigator) {
  const swUrl =
    import.meta.env.MODE === 'production'
      ? `${trimTrailingSlash(import.meta.env.BASE_URL)}/sw.js`
      : `/dev-sw.js?dev-sw`;

  const sendSessionToSW = () => {
    const session = getFallbackSession();
    pushSessionToSW(session?.baseUrl, session?.accessToken);
  };

  navigator.serviceWorker.register(swUrl).then(sendSessionToSW);
  navigator.serviceWorker.ready.then(sendSessionToSW);

  navigator.serviceWorker.addEventListener('message', (ev) => {
    const { type } = ev.data ?? {};

    if (type === 'requestSession') {
      sendSessionToSW();
    }
  });
}

const mountApp = () => {
  const rootContainer = document.getElementById('root');

  if (rootContainer === null) {
    console.error('Root container element not found!');
    return;
  }

  const root = createRoot(rootContainer);
  root.render(<App />);
};

async function init() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const dtToken = params.get('dtToken');

  if (code) {
    try {
      const res = await fetch(`${import.meta.env.VITE_DT_API_URL}/matrix/exchange?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        // Limpiar datos de sesión anterior antes de guardar los nuevos tokens
        clearPreviousSessionData();
        // Guardar el DT JWT si viene en la URL (flujo Google OAuth)
        if (dtToken) {
          localStorage.setItem('dt_access_token', dtToken);
        }
        localStorage.setItem('dt_is_admin', String(data.isAdmin === true));
        setFallbackSession(data.token, data.deviceId, data.userId, data.homeserver);
      }
    } catch {
      // continue normally
    }
    window.history.replaceState({}, '', window.location.pathname);
  }

  mountApp();
}

init();
