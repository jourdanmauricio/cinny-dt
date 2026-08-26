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
  background: 'linear-gradient(to bottom, #ffffff, rgba(253, 242, 248, 0.6))',
  borderRadius: toRem(32),
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
  border: '2px solid #FCE7F3',
  overflow: 'hidden',
});

export const AuthCrown = style({
  height: toRem(56),
  width: 'auto',
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
  color: '#8B6B3E',
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
