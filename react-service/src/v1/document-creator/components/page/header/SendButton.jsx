import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import { ConfirmAlert } from 'v1/global/components/clink-alert';
import flag from 'v2/helpers/flags';
import SendButtonNew from './SendButtonNew';

const SendButton = (propsComp) => {
  if (flag('ENHANCE_SUPPLY_CHAIN_BUTTON')) {
    return <SendButtonNew {...propsComp} />;
  }

  const {
    info,
    disabled,
    handleSend,
    docType,
    subcontractor,
    docusignSendEmail,
    children,
  } = propsComp;

  if (docType === 'tender') {
    return (
      <Button
        disabled={disabled}
        onClick={handleSend}
        variant="contained"
        color="success"
        data-testid="document-creator-send-btn"
      >
        {children}
      </Button>
    );
  }

  const aid = info?.id || 0;
  const subId = subcontractor && Number(subcontractor.id);

  let subcontractorEmail = subcontractor && subcontractor.email;

  // Handle JSON parsing before the ternary
  let parsedMeta = false;
  if (subcontractor?.meta) {
    try {
      parsedMeta = JSON.parse(subcontractor.meta);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Invalid JSON in subcontractor meta');
    }
  }

  const subcontractorMeta = parsedMeta;

  if (subcontractorMeta && aid && aid in subcontractorMeta) {
    const { email = '' } = subcontractorMeta[aid];
    subcontractorEmail = email || subcontractorEmail;
  }

  const subEmail =
    (docusignSendEmail && docusignSendEmail.email) ||
    subcontractorEmail ||
    'No Email';
  const subName = subcontractor?.name || 'Unknown';

  const props = { disabled, children, variant: 'contained', color: 'success', 'data-testid': 'document-creator-send-btn' };
  const handleClick = !subId ? null : handleSend;
  const title = !subId ? 'Error' : 'Sending order';
  const cancelLabel = !subId ? 'Close' : 'No';
  const message = subId
    ? `You're about to Send this order to ${subName} and ${subEmail} - would you like to proceed?`
    : "We don't have subcontractor data to send this order";
  const options = {
    handleClick,
    title,
    message,
    className: 'send-order-confirm',
    cancelLabel,
  };

  return <ConfirmAlert Component={Button} props={props} options={options} />;
};

SendButton.propTypes = {
  info: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  disabled: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  handleSend: PropTypes.func.isRequired,
  docType: PropTypes.string,
  subcontractor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
    meta: PropTypes.string,
  }),
  docusignSendEmail: PropTypes.oneOfType([
    PropTypes.shape({
      email: PropTypes.string,
    }),
    PropTypes.bool,
  ]),
  children: PropTypes.node.isRequired,
};

SendButton.defaultProps = {
  info: null,
  disabled: false,
  docType: '',
  subcontractor: null,
  docusignSendEmail: null,
};

export default SendButton;
