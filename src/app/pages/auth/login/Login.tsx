import React, { useState } from 'react';
import { PasswordLoginForm } from './PasswordLoginForm';

export type AppOrigin = 'sugo' | 'contigo';

const APP_LABEL: Record<AppOrigin, string> = { sugo: 'Sugo', contigo: 'Contigo' };
const APP_LOGO: Record<AppOrigin, string> = { sugo: '/sugo.webp', contigo: '/contigo.webp' };
const APP_DESCRIPTION: Record<AppOrigin, string> = {
  sugo: 'App de mensajería para generar ingresos desde casa con usuarios latinos 🇲🇽',
  contigo:
    'App de mensajería para generar ingresos desde casa con usuarios de Estados Unidos 🇺🇸',
};
const APP_OPTIONS: AppOrigin[] = ['sugo', 'contigo'];

const APP_ACCENT: Record<
  AppOrigin,
  {
    cardBg: string;
    cardBorder: string;
    divider: string;
    heart: string;
    gradientFrom: string;
    gradientTo: string;
    blob: string;
  }
> = {
  sugo: {
    cardBg: '#F4F0FC',
    cardBorder: '#D9CFF7',
    divider: '#D9CFF7',
    heart: '#8B7CF6',
    gradientFrom: '#8B7CF6',
    gradientTo: '#6C5CE7',
    blob: '#E8DFFA',
  },
  contigo: {
    cardBg: '#FDEEF0',
    cardBorder: '#F7C9D3',
    divider: '#F7C9D3',
    heart: '#F0435F',
    gradientFrom: '#FF7E87',
    gradientTo: '#F0435F',
    blob: '#FCE1E7',
  },
};

// Path de una onda de dos curvas — igual a la usada en el selector web.
const WAVE_PATH = 'M-1.41,108 C100.73,25 350.73,135 501.41,52 L501.41,-3.44 L0.28,-1.45 Z';

function HeartIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function Login() {
  const [appOrigin, setAppOrigin] = useState<AppOrigin | null>(null);

  if (!appOrigin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Subtítulo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span style={{ height: '1px', width: '24px', background: '#c59b6d' }} />
          <HeartIcon size={12} color="#c59b6d" />
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              color: '#f7bbc4',
            }}
          >
            ELEGÍ TU APLICACIÓN
          </p>
          <HeartIcon size={12} color="#c59b6d" />
          <span style={{ height: '1px', width: '24px', background: '#c59b6d' }} />
        </div>

        {/* Banner de advertencia */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #FDE0E4',
            background: '#FFF1F2',
          }}
        >
          <span
            style={{
              display: 'flex',
              flexShrink: 0,
              width: '40px',
              height: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: 'linear-gradient(to bottom right, #FF7A8A, #E23B57)',
              color: '#fff',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </span>
          <div style={{ fontSize: '14px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>
              Elegí <span style={{ color: '#E23B57' }}>UNA</span> sola aplicación.
            </p>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
              Enfocate al 100% en ella para lograr ganancias estables.{' '}
              <span style={{ fontWeight: 700, color: '#E23B57' }}>No te registres en ambas.</span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          <span style={{ height: '1px', flex: 1, background: '#F5D3DE' }} />
          <p style={{ margin: 0, whiteSpace: 'nowrap' }}>Seleccioná la app con la que querés trabajar</p>
          <span style={{ height: '1px', flex: 1, background: '#F5D3DE' }} />
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {APP_OPTIONS.map((app) => {
            const accent = APP_ACCENT[app];
            return (
              <button
                key={app}
                type="button"
                onClick={() => setAppOrigin(app)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 12px 14px',
                  borderRadius: '16px',
                  border: `1px solid ${accent.cardBorder}`,
                  background: accent.cardBg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'transform 0.15s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '80px',
                    opacity: 0.8,
                    pointerEvents: 'none',
                  }}
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path fill={accent.blob} d={WAVE_PATH} />
                </svg>

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <img
                      src={APP_LOGO[app]}
                      alt={APP_LABEL[app]}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: '#fff',
                        objectFit: 'contain',
                        padding: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        width: '24px',
                        height: '24px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '9999px',
                        background: '#fff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <HeartIcon size={12} color={accent.heart} />
                    </span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {APP_LABEL[app]}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                    <span style={{ height: '1px', width: '16px', background: accent.divider }} />
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '9999px',
                        background: accent.heart,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ height: '1px', width: '16px', background: accent.divider }} />
                  </span>
                  <span style={{ fontSize: '11px', lineHeight: 1.4, color: '#6b7280' }}>
                    {APP_DESCRIPTION[app]}
                  </span>
                  <span
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#fff',
                      background: `linear-gradient(to right, ${accent.gradientFrom}, ${accent.gradientTo})`,
                    }}
                  >
                    Elegir {APP_LABEL[app]}
                    <ChevronRightIcon />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer de contacto */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #FADFE5',
            background: '#FDEEF3',
          }}
        >
          <span
            style={{
              display: 'flex',
              flexShrink: 0,
              width: '40px',
              height: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: '#F5648A',
              color: '#fff',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
            </svg>
          </span>
          <p style={{ flex: 1, margin: 0, fontSize: '12px', color: '#6b7280' }}>
            ¿Tenés dudas o problemas para registrarte?
            <br />
            <a
              href="https://t.me/celidulceterciopelo"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                color: '#F0568B',
              }}
            >
              <span style={{ textDecoration: 'underline' }}>Escribinos para ayudarte</span>
              <span
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9999px',
                  background: '#F0568B',
                  color: '#fff',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                  <path d="m21.854 2.147-10.94 10.939" />
                </svg>
              </span>
            </a>
          </p>
        </div>

        {/* Tagline */}
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '20px 0 0',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}
        >
          <HeartIcon size={12} color="#C9A97A" />
          <span style={{ color: '#f7bbc4' }}>ENFOCATE EN UNA, CRECE Y LOGRÁ TUS METAS</span>
          <HeartIcon size={12} color="#C9A97A" />
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <p style={{ margin: 0, textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
        Iniciar sesión · {APP_LABEL[appOrigin]}{' '}
        <button
          type="button"
          onClick={() => setAppOrigin(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#E8829F',
            cursor: 'pointer',
            fontSize: '13px',
            textDecoration: 'underline',
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          Cambiar
        </button>
      </p>
      <PasswordLoginForm appOrigin={appOrigin} />
    </div>
  );
}
