import React from 'react';
import { CONSTANTS, Button } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { getUrl, goToNewTab } from 'v2/helpers/url';
import { ResourceContent, ButtonWrapper } from './Dashboard.styled';

const { tenderReturnTemplate } = CONSTANTS.s3;
const ResourcesSlide = () => {
  const { t } = useTranslation();
  return (
    <ResourceContent src={tenderReturnTemplate}>
      <ButtonWrapper resources>
        <Button
          color="prosperGreenButton"
          handleClick={() => goToNewTab(getUrl('SITE_PROSPER', 'resources'))}
        >
          {t('view-all-resources')}
        </Button>
      </ButtonWrapper>
    </ResourceContent>
  );
};

export default ResourcesSlide;
