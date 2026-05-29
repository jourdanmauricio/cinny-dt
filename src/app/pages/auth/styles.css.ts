import { style } from '@vanilla-extract/css';
import { DefaultReset, config, toRem } from 'folds';

export const AuthLayout = style({
  minHeight: '100vh',
  backgroundColor: '#FDF0F3',
  padding: '24px 16px',
  position: 'relative',
});

export const AuthCard = style({
  maxWidth: toRem(460),
  width: '100%',
  backgroundColor: '#ffffff',
  borderRadius: toRem(12),
  boxShadow: '0 2px 16px rgba(200, 100, 130, 0.10)',
  border: '1px solid #EDB5C0',
  overflow: 'hidden',
});

export const AuthLogo = style([
  DefaultReset,
  {
    width: toRem(26),
    height: toRem(26),
    borderRadius: '50%',
  },
]);

export const AuthHeader = style({
  padding: `${toRem(32)} ${config.space.S400} ${toRem(20)}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: toRem(4),
});

export const AuthBrandTitle = style({
  fontFamily: "'Lora', Georgia, serif",
  fontSize: toRem(24),
  fontWeight: 500,
  color: '#C9A97A',
  margin: 0,
  lineHeight: 1.3,
  textAlign: 'center',
});

export const AuthCardContent = style({
  maxWidth: toRem(402),
  width: '100%',
  margin: 'auto',
  padding: `${toRem(8)} ${config.space.S400} ${toRem(40)}`,
  gap: toRem(28),
  display: 'flex',
  flexDirection: 'column',
});

export const AuthFooter = style({
  padding: config.space.S200,
});
