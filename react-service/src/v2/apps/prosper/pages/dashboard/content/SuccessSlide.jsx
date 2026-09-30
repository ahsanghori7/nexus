import React from 'react';
import DOMPurify from 'dompurify';
import { CONSTANTS, Image, Button } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { goTo, getUrl } from 'v2/helpers/url';
import {
  Slide,
  Content,
  QuottedParagraph,
  QuottedParagraphText,
  QuottedParagraphSubtext,
  SubtextStrong,
  ButtonWrapper,
} from './Dashboard.styled';

const { luke, pngLightpurpleQuotes, pngPurpleQuotes } = CONSTANTS.s3;
const SuccessSlide = () => {
  const { t } = useTranslation();
  return (
    <Slide src={luke}>
      <Content>
        <QuottedParagraph>
          <Image src={pngLightpurpleQuotes} />
          <QuottedParagraphText
            data-i18n="[html]content.body"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                t('dashboard-success', {
                  interpolation: { escapeValue: false },
                }),
              ),
            }}
          />
          <Image src={pngPurpleQuotes} />
        </QuottedParagraph>
        <QuottedParagraphSubtext>
          <SubtextStrong>Luke</SubtextStrong> - LBC Design & Install
        </QuottedParagraphSubtext>
        <ButtonWrapper success>
          <Button
            color="prosperGreenButton"
            handleClick={() =>
              goTo(
                getUrl(
                  'prosper',
                  'resources/success-stories?popoverShowOnLoad=true',
                ),
              )
            }
          >
            {t('dashboard-watch-success')}
          </Button>
        </ButtonWrapper>
      </Content>
    </Slide>
  );
};

export default SuccessSlide;
