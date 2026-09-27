import { style } from '@vanilla-extract/css';

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
