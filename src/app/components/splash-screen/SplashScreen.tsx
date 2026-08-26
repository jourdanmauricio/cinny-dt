import { Box, Text } from 'folds';
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import * as patternsCSS from '../../styles/Patterns.css';
import * as css from './SplashScreen.css';

type SplashScreenProps = {
  children: ReactNode;
};
export function SplashScreen({ children }: SplashScreenProps) {
  return (
    <Box
      className={classNames(css.SplashScreen, patternsCSS.BackgroundDotPattern)}
      direction="Column"
    >
      {children}
      <Box
        className={css.SplashScreenFooter}
        shrink="No"
        alignItems="Center"
        justifyContent="Center"
      >
        <Text size="H2" align="Center" style={{ fontFamily: "'Lora', serif", color: '#8B6B3E', fontWeight: 600 }}>
          Agencia Dulce Terciopelo
        </Text>
      </Box>
    </Box>
  );
}
