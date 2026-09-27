import { style } from '@vanilla-extract/css';
import { color, config } from 'folds';
import { Editor } from '../../components/editor/Editor.css';
import { darkTheme } from '../../../colors.css';

// DT: efecto vidrio esmerilado en la barra de escritura (deja ver el mosaico desenfocado)
const GLASS_BLUR = 'blur(3px) saturate(140%)';

export const RoomInputGlass = style({
  selectors: {
    [`${Editor}&`]: {
      backgroundColor: [
        color.SurfaceVariant.Container,
        `color-mix(in srgb, ${color.SurfaceVariant.Container} 40%, transparent)`,
      ],
      backdropFilter: GLASS_BLUR,
      WebkitBackdropFilter: GLASS_BLUR,
      boxShadow: [
        `inset 0 1px 0 0 rgba(255, 255, 255, 0.6)`,
        `inset 0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.ContainerLine}`,
        `0 4px 16px rgba(0, 0, 0, 0.06)`,
      ].join(', '),
    },
    [`${darkTheme} ${Editor}&`]: {
      boxShadow: [
        `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`,
        `inset 0 0 0 ${config.borderWidth.B300} ${color.SurfaceVariant.ContainerLine}`,
        `0 4px 16px rgba(0, 0, 0, 0.3)`,
      ].join(', '),
    },
  },
});
