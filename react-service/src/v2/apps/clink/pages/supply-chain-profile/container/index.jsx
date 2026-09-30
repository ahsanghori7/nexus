import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import {
  MuiSectionTitle,
  MuiRegistrationNumber,
  MuiIconButton,
} from 'v2/apps/clink/pages/supply-chain-profile/mui.styled';
import Loading from 'v2/apps/shared/components/Loading';
import ContainerContent from './ContainerContent';

const SupplyChainContainer = ({
  aid,
  contextType = 'clink',
  prequalification = {},
  company = {},
}) => {
  const { t } = useTranslation();
  const { details, status } = company;
  const { reg_number } = details;

  const [url, setUrl] = useState(false);

  useEffect(() => {
    if (aid) {
      setUrl(`/relay?action=account&method=downloadPrequalification&id=${aid}`);
    }
  }, [aid]);

  const urlConfig = {
    href: url,
    target: '_blank',
    rel: 'noreferrer',
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 80px)', pt: '2px' }}>
      <Loading status={status.message} />
      {!status.message && (
        <>
          <MuiSectionTitle
            rightContent={
              url && (
                <MuiIconButton urlConfig={urlConfig}>
                  {t('download-prequal-pdf')}
                </MuiIconButton>
              )
            }
          />
          <MuiRegistrationNumber>{reg_number}</MuiRegistrationNumber>
        </>
      )}
      {!status.message && (
        <ContainerContent
          aid={aid}
          contextType={contextType}
          prequalification={prequalification}
          company={company}
          urlConfig={urlConfig}
          url={url}
        />
      )}
    </Box>
  );
};

export default SupplyChainContainer;
