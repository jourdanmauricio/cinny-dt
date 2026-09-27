import { style } from '@vanilla-extract/css';
import { config } from 'folds';

const PATTERN_URL = 'url(/dt-pattern.png)';
const PATTERN_SIZE = '189px auto';

export const RoomPatternContainer = style({
  position: 'relative',
  isolation: 'isolate',
});

export const RoomPattern = style({
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  backgroundColor: '#E8829F',
  maskImage: PATTERN_URL,
  WebkitMaskImage: PATTERN_URL,
  maskSize: PATTERN_SIZE,
  WebkitMaskSize: PATTERN_SIZE,
  maskRepeat: 'repeat',
  WebkitMaskRepeat: 'repeat',
});

// DT: altura de la barra de escritura flotante (la setea RoomView con un ResizeObserver)
export const COMPOSER_HEIGHT_PROP = '--dt-composer-height';
export const COMPOSER_HEIGHT = `var(${COMPOSER_HEIGHT_PROP}, 0px)`;

export const TimelineArea = style({
  position: 'relative',
});

export const ComposerOverlay = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2,
  padding: `0 ${config.space.S400}`,
});
