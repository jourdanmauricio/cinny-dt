import { style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';
import { Editor } from '../../components/editor/Editor.css';
import { darkTheme } from '../../../colors.css';

// DT: efecto vidrio esmerilado en la barra de escritura flotante (los mensajes pasan desenfocados por detrás)
const GLASS_BLUR = 'blur(14px) saturate(140%)';

export const RoomInputGlass = style({
  selectors: {
    [`${Editor}&`]: {
      // DT: forma de píldora (con una línea la barra mide ~48px: extremos completamente redondos)
      borderRadius: toRem(24),
      backgroundColor: [
        color.SurfaceVariant.Container,
        `color-mix(in srgb, ${color.SurfaceVariant.Container} 65%, transparent)`,
      ],
      backdropFilter: GLASS_BLUR,
      WebkitBackdropFilter: GLASS_BLUR,
      boxShadow: [
        `inset 0 1px 0 0 rgba(255, 255, 255, 0.6)`,
        `inset 0 0 0 ${config.borderWidth.B300} ${color.Primary.ContainerLine}`,
        `0 4px 20px rgba(0, 0, 0, 0.1)`,
      ].join(', '),
    },
    // En oscuro el ContainerLine de Primary es lavanda: se mantiene el borde neutro
    [`${darkTheme} ${Editor}&`]: {
      boxShadow: [
        `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`,
        `inset 0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.ContainerLine}`,
        `0 4px 20px rgba(0, 0, 0, 0.35)`,
      ].join(', '),
    },
  },
});
