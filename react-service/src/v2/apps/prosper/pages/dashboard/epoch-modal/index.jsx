import React, { useEffect, useState } from 'react';
import flag from 'v2/helpers/flags';
import { useTranslation } from 'react-i18next';
import { Link as ReactLink } from 'react-router-dom';
import isNil from 'lodash/isNil';
import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import WISTIA from 'v2/constants/wistia';
import { wistiaConfigUrl } from 'v2/helpers/url';
import useScript from 'hooks/useScript';
import MuiDialog from 'v2/apps/shared/components/dialog';
import { MuiGreetingSection } from 'v2/apps/shared/components/company-v2/Mui.styled';

const EpochModal = ({ createdAtDate = null, subcontractor = {} }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      !isNil(createdAtDate) &&
      createdAtDate <= flag('EPOCH') &&
      !localStorage.startUsingProsper
    ) {
      localStorage.setItem('startUsingProsper', '1');
      setOpen(true);
    }
  }, [createdAtDate]);
  const id = WISTIA && WISTIA.WHAT_ARE_TOKENS_MODAL;
  useScript(wistiaConfigUrl(id));
  useScript(WISTIA.CONFIG_URL);
  const countryCode =
    subcontractor && subcontractor.country && subcontractor.country.code;
  if (countryCode !== 'UK') {
    return null;
  }

  return (
    <MuiDialog
      open={open}
      handleClose={() => setOpen(false)}
      actions={
        <ReactLink
          to="/my-company/prequalification"
          style={{
            textDecoration: 'none',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <MuiButton
            sx={{ width: '91%', fontSize: 17 }}
            color="secondary"
            variant="contained"
            onClick={() => {
              setOpen(false);
            }}
          >
            {t('start')}
          </MuiButton>
        </ReactLink>
      }
      border={false}
    >
      <Box sx={{ maxWidth: 330 }}>
        <MuiGreetingSection
          title="users-table-column-prequalification"
          intro="greetings-preq-v2-text-4"
          outtro="greetings-preq-v2-text-5"
        />
      </Box>
    </MuiDialog>
  );
};

export default EpochModal;
