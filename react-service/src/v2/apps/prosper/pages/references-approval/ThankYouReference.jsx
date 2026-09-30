import React from 'react';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Container from 'v2/apps/prosper/pages/sign-up/shared/Container';
import PHPGloblals from 'v2/helpers/php-globals';

// Todo: refactor and re-allocate these files in a proper folder (import Container above)

const { greenButton } = CONSTANTS.colors.general;

const ThankYouReference = () => {
  const { t } = useTranslation();

  const conf = PHPGloblals();
  const data = (conf && conf.data) || {};

  const initialList = [
    {
      props: { to: '/my-company' },
      linkCopy: t('complete-your-profile'),
    },
  ];

  const descriptionStyles = {
    display: 'block',
    fontWeight: 200,
    fontSize: '24px',
  };

  return (
    <Container linkList={initialList} footer={false} name={false}>
      <Typography
        mt={7}
        sx={{
          display: 'block',
          fontStyle: 'italic',
          color: greenButton,
          fontSize: '24px',
        }}
        variant="p"
      >
        {t('reference-thank-you-1')}
        {data.subcontractor_name || 'subcontractor'}
        {t('reference-thank-you-2')}
      </Typography>

      <Typography
        my={5}
        sx={{ display: 'block', fontSize: '32px', fontWeight: 'bold' }}
        variant="h3"
      >
        {t('what-is-clink')}
      </Typography>

      <Typography mb={3} sx={descriptionStyles} variant="p">
        {t('clink-reference-description')}
      </Typography>

      <Typography mb={3} sx={descriptionStyles} variant="p">
        {t('clink-reference-tour-1')}
        <Link href="https://c-link.com/book-demo/">
          {t('clink-reference-tour-2')}
        </Link>
        {t('clink-reference-tour-3')}
      </Typography>
    </Container>
  );
};

export default ThankYouReference;
