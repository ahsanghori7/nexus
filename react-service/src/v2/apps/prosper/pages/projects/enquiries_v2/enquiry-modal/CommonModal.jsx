import React from 'react';
import { Modal, ModalContent } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';

const CommonModal = ({
  externalOpen = false,
  openElement = false,
  onHidden = null,
  renderModal = () => null,
  className = 'proper-enquiry-sidemodal',
  theme = 'prosper',
}) => {
  return (
    <Modal
      externalOpen={externalOpen}
      className={className}
      theme={theme}
      disableEnforceFocus
      disablePortal={false}
      sidemodal
      onHidden={onHidden}
      openElement={openElement}
      render={renderModal}
    />
  );
};

const CommonContent = ({
  title = 'send-quotation',
  subtitle = null,
  children = null,
  theme = 'prosper',
  sxTitle = {},
  sxSubtitle = {},
}) => {
  const { t } = useTranslation();
  return (
    <ModalContent theme={theme} sidemodal>
      <Typography variant="h1" sx={sxTitle}>
        {t(title)}
      </Typography>
      {subtitle && <small style={sxSubtitle}>{subtitle}</small>}
      {children}
    </ModalContent>
  );
};

export default CommonModal;
export { CommonContent };
