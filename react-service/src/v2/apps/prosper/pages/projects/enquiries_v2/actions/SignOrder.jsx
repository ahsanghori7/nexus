import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchData } from 'services/helpers';
import { goToNewTab } from 'v2/helpers/url';

const SignOrder = ({ data = {} }) => {
  const { t } = useTranslation();

  const canSign =
    data && data.signatory && data.signatory && data.signatory.can_sign;
  const transactionId =
    data &&
    data.document &&
    data.document &&
    data.document.order &&
    data.document.order.transaction_id;
  const orderTemplateId =
    data &&
    data.document &&
    data.document &&
    data.document.order &&
    data.document.order.order_template_id;
  if (!canSign || !orderTemplateId || !transactionId) {
    return null;
  }

  const handleRedirect = () =>
    fetchData('enquiries', {}, `${transactionId}/sign/${orderTemplateId}/`)
      .then((result) => {
        if (result.success && result.redirect) {
          goToNewTab(result.redirect);
        }
      })
      // eslint-disable-next-line no-console
      .catch(console.error);

  return (
    <Button
      data-testid="sign-order-btn"
      variant="contained"
      color="primary"
      onClick={handleRedirect}
      sx={{
        width: '100%',
        height: '64px',
        borderRadius: '4px',
        maxWidth: '350px',
        flexDirection: 'column',
        marginTop: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      <Typography sx={{ fontSize: '18px' }}>{t('sign-order')}</Typography>
    </Button>
  );
};

export default SignOrder;
