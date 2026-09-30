import React from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import ConfirmModal, {
  Content as ContentModal,
} from 'v2/apps/shared/components/confirm-modal/v2';
import ActionButtonContent from './ActionButtonContent';

const AcceptDeclineEnquiry = ({
  data,
  accept,
  decline,
  handleOpen,
  openConfirm,
  handleClose,
}) => {
  const { t } = useTranslation();
  return (
    <Grid data-testid="accept-decline-enquiry" container spacing={1}>
      <Grid item xs={12} md={6}>
        <ActionButtonContent
          data={data}
          handleAction={accept}
          label={t('accept-invitation')}
          hideWaitTime
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <ConfirmModal
          openModal={openConfirm}
          handleClose={handleClose}
          openButtonModal={
            <ActionButtonContent
              data={data}
              handleAction={handleOpen}
              label={t('decline-invitation')}
              redVersion={false}
              hideWaitTime
            />
          }
        >
          <ContentModal handleAccept={decline} handleCancel={handleClose} />
        </ConfirmModal>
      </Grid>
    </Grid>
  );
};

export default AcceptDeclineEnquiry;
