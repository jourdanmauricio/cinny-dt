import { ComplexStyleRule, keyframes, style } from '@vanilla-extract/css';
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { ContainerColor, DefaultReset, color, config, toRem } from 'folds';

const getVariant = (variant: ContainerColor): ComplexStyleRule => ({
  backgroundColor: color[variant].Container,
});

// DT: efecto "pulse" mientras cargan los mensajes (se desactiva con "reducir movimiento")
const PulseAnime = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.45 },
});

export const PlaceholderPulse = style({
  animation: `${PulseAnime} 1.5s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
});

export const LinePlaceholder = recipe({
  base: [
    DefaultReset,
    PlaceholderPulse,
    {
      width: '100%',
      height: toRem(16),
      borderRadius: config.radii.R300,
    },
  ],
  variants: {
    variant: {
      Background: getVariant('Background'),
      Surface: getVariant('Surface'),
      SurfaceVariant: getVariant('SurfaceVariant'),
      Primary: getVariant('Primary'),
      Secondary: getVariant('Secondary'),
      Success: getVariant('Success'),
      Warning: getVariant('Warning'),
      Critical: getVariant('Critical'),
    },
  },
  defaultVariants: {
    variant: 'SurfaceVariant',
  },
});

export type LinePlaceholderVariants = RecipeVariants<typeof LinePlaceholder>;
