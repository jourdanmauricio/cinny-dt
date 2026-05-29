import React from 'react';
import { Box, Button, Icon, Icons, Text, config, toRem } from 'folds';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import GatitoImg from '../../../../public/res/img/logo.jpeg';

export function WelcomePage() {
  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={<img width="160" height="160" src={GatitoImg} alt="Dulce Terciopelo" style={{ borderRadius: '12px' }} />}
            title={
              <span style={{ fontFamily: "'Lora', serif", color: '#C9A97A', fontWeight: 600 }}>
                Agencia Dulce Terciopelo
              </span>
            }
            subTitle={<span>Tu espacio de chat.</span>}
          >
            <Box justifyContent="Center">
              <Box grow="Yes" style={{ maxWidth: toRem(300) }} direction="Column" gap="300">
                {/* DT: Source Code - oculto para rol user
                <Button
                  as="a"
                  href="https://github.com/cinnyapp/cinny"
                  target="_blank"
                  rel="noreferrer noopener"
                  before={<Icon size="200" src={Icons.Code} />}
                >
                  <Text as="span" size="B400" truncate>
                    Source Code
                  </Text>
                </Button>
                */}
                {/* DT: Support - oculto para rol user
                <Button
                  as="a"
                  href="https://cinny.in/#sponsor"
                  target="_blank"
                  rel="noreferrer noopener"
                  fill="Soft"
                  before={<Icon size="200" src={Icons.Heart} />}
                >
                  <Text as="span" size="B400" truncate>
                    Support
                  </Text>
                </Button>
                */}
              </Box>
            </Box>
          </PageHero>
        </PageHeroSection>
      </Box>
    </Page>
  );
}
