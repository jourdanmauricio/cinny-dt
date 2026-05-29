import { style, globalStyle } from '@vanilla-extract/css';

// Wrapper class that scopes all overrides below.
// Specificity [0,1,1] beats the global `a { color: var(--tc-link) }` at [0,0,1].
export const dtLoginForm = style({});

globalStyle(`${dtLoginForm} a`, {
  color: '#7E676F',
  textDecoration: 'none',
});

globalStyle(`${dtLoginForm} a:hover`, {
  color: '#7E676F',
  textDecoration: 'none',
});

// Error message class — used alongside inline style for double-enforcement.
export const dtFieldError = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  margin: 0,
  fontSize: '12px',
  color: '#EF4343',
  whiteSpace: 'nowrap',
});
