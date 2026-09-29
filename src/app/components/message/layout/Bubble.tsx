import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Box, ContainerColor, as, color } from 'folds';
import * as css from './layout.css';

type BubbleArrowProps = {
  variant: ContainerColor;
};
function BubbleLeftArrow({ variant }: BubbleArrowProps) {
  return (
    <svg
      className={css.BubbleLeftArrow}
      width="9"
      height="8"
      viewBox="0 0 9 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.00004 8V0H4.82847C3.04666 0 2.15433 2.15428 3.41426 3.41421L8.00004 8H9.00004Z"
        fill={color[variant].Container}
      />
    </svg>
  );
}

function BubbleRightArrow() {
  return (
    <svg
      className={css.BubbleRightArrow}
      width="9"
      height="8"
      viewBox="0 0 9 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.00004 8V0H4.82847C3.04666 0 2.15433 2.15428 3.41426 3.41421L8.00004 8H9.00004Z"
        fill="currentColor"
      />
    </svg>
  );
}

type BubbleLayoutProps = {
  hideBubble?: boolean;
  before?: ReactNode;
  header?: ReactNode;
  // DT: mensaje propio, alineado a la derecha con color diferenciado
  own?: boolean;
  // DT: sin columna de avatar (mensajes propios en DMs)
  hideBefore?: boolean;
};

export const BubbleLayout = as<'div', BubbleLayoutProps>(
  ({ hideBubble, before, header, own, hideBefore, children, ...props }, ref) => {
    const showArrow = own ? !!header : !!before;

    return (
      <Box gap="300" direction={own ? 'RowReverse' : 'Row'} {...props} ref={ref}>
        {!hideBefore && (
          <Box className={css.BubbleBefore} shrink="No">
            {before}
          </Box>
        )}
        <Box
          className={css.BubbleColumn}
          grow="Yes"
          direction="Column"
          alignItems={own ? 'End' : undefined}
        >
          {header}
          {hideBubble ? (
            children
          ) : (
            <Box className={css.BubbleColumn}>
              <Box
                className={classNames(
                  css.BubbleContent,
                  own && css.BubbleContentOwn,
                  showArrow && (own ? css.BubbleContentArrowRight : css.BubbleContentArrowLeft)
                )}
                direction="Column"
              >
                {showArrow &&
                  (own ? <BubbleRightArrow /> : <BubbleLeftArrow variant="SurfaceVariant" />)}
                {children}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);
