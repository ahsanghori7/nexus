import React, { useState } from 'react';
import i18next from 'v2/helpers/i18n';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import Skeleton from '@mui/material/Skeleton';
import Form from './Form';
import Menu from './Menu';

const Actions = ({
  quoteInfo = {},
  orderTemplates = [],
  pid = 0,
  awarded = false,
  entity = {},
}) => {
  const [open, setOpen] = useState(false);

  const openModal = () =>
    setOpen({
      id: 'issue-an-order',
      navTitle: 'issue-an-order',
      title: 'choose-an-order',
      backdropClick: true,
    });

  // We wait for the order tempaltes endpoint to finish
  if (!orderTemplates || (orderTemplates && !orderTemplates.length)) {
    return (
      <Skeleton variant="rounded" width={210} height={36} sx={{ mt: '4px' }} />
    );
  }

  const { order_created } = quoteInfo;

  return (
    <>
      <Modal open={open} setOpen={setOpen}>
        <Form
          quoteInfo={quoteInfo}
          orderTemplates={orderTemplates}
          setOpen={setOpen}
        />
      </Modal>
      <Grid container justifyContent="flex-end">
        {!order_created && !awarded && (
          <Grid item xs={10}>
            <Button
              sx={{
                fontWeight: 500,
                height: '30px',
                mt: '4px',
                fontSize: '12px',
                lineHeight: 'inherit',
              }}
              size="small"
              fullWidth
              variant="contained"
              color="success"
              onClick={openModal}
            >
              {i18next.t('issue-order')}
            </Button>
          </Grid>
        )}
        <Grid item xs={2}>
          <Menu quoteInfo={quoteInfo} pid={pid} entity={entity} />
        </Grid>
      </Grid>
    </>
  );
};

export default Actions;
