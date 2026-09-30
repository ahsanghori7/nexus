import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyledContainer, StyledContainerItem } from './styled';

const FooterContent = ({ revision = '1.6' }) => {
  const { t } = useTranslation();
  const main = `${t('prosper')} ${t('admin')}`;
  const revisionLabel = `${t('revision')} ${revision}`;
  return (
    <StyledContainer>
      <StyledContainerItem main>{main}</StyledContainerItem>
      <StyledContainerItem>{revisionLabel}</StyledContainerItem>
    </StyledContainer>
  );
};

export default FooterContent;
