import React, { useState } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { metricSystemFormat } from 'v2/helpers/currency';
import Loading from 'v2/apps/shared/components/Loading';
import DocContainer from 'v2/apps/shared/components/prequalification/v2/DocContainer';
import Doc from 'v2/apps/shared/components/prequalification/v2/Doc';
import Content from 'v2/apps/shared/components/prequalification/v2/documents_v2/Content';
import FormReference from './FormReference';

const {
  iconApprovedWhite,
  iconProvidedTeal,
  iconPendingWhite,
  iconRejectedWhite,
  iconNotProvidedRed,
  iso14001,
  iso9001,
} = CONSTANTS.s3;

const icons = {
  'BS EN ISO 14001:2015': iso14001,
  'IS0 90001': iso9001,
  'ISO 14001:2015': iso14001,
  'ISO 9001:2015': iso9001,
};

const PENDING = 'pending';
const APPROVED = 'approved';
const DELETED = 'deleted';
const NOT_PROVIDED = 'not-provided';

const { roseMadder, kryptoniteGreen, sunCrete } = CONSTANTS.colors.prosper;
const { clinkGreen } = CONSTANTS.colors.general;

const getReferenceStatus = (status, light = false) => {
  switch (status) {
    case PENDING:
      return {
        label: '',
        color: 'white',
        bg: sunCrete,
        icon: iconPendingWhite,
      };
    case APPROVED:
      return {
        label: light ? status.toLocaleUpperCase() : '',
        color: kryptoniteGreen,
        bg: light ? 'white' : kryptoniteGreen,
        icon: light ? iconProvidedTeal : iconApprovedWhite,
      };
    case DELETED:
      return {
        label: '',
        color: 'white',
        bg: roseMadder,
        icon: iconRejectedWhite,
      };
    case NOT_PROVIDED:
      return {
        label: 'NOT PROVIDED',
        color: 'white',
        bg: 'white',
        icon: iconNotProvidedRed,
      };
    default:
      return { label: '', color: '', bg: '', icon: null };
  }
};

const getPreqNonRefDocStatus = (data) => {
  let status = { label: '', color: '', bg: '', icon: null };
  if (data.section) {
    status = {
      label: 'UPLOADED',
      color: clinkGreen,
      bg: 'white',
      icon: iconProvidedTeal,
    };
  }
  if (!data.section) {
    status = {
      label: 'NOT PROVIDED',
      color: 'white',
      bg: 'white',
      icon: iconNotProvidedRed,
    };
  }
  if (icons[data.label]) {
    status.icon = icons[data.label];
  }
  return status;
};

const References = ({ aid, prequalificationV2, contextType, dispatch }) => {
  const { t } = useTranslation();
  const { references, statusPreq } = prequalificationV2;
  const isProsper = contextType === 'prosper';

  const [selectedReference, setSelectedReference] = useState(null);
  const [open, setOpen] = useState(false);

  const handleOnClose = () => {
    setOpen(false);
  };

  const handleOnShow = () => {
    setOpen(true);
  };

  const context = useContext(contextType);
  const { actions } = context;

  const handleSubmit = (submitData) => {
    if (!isProsper) return Promise.resolve();
    return dispatch(actions.postReferences_V2({ aid, ...submitData })).then(
      () => dispatch(actions.fetchPrequalification_V2(aid)),
    );
  };

  const handleRemove = (id) => {
    if (!isProsper) return Promise.resolve();
    return dispatch(
      actions.deletePrequalificationReference_V2({ id, aid }),
    ).then(() => dispatch(actions.fetchPrequalification_V2(aid)));
  };

  const handleResend = (id) => {
    if (!isProsper) return Promise.resolve();
    return dispatch(actions.resendReferences_V2({ id, aid })).then(() =>
      dispatch(actions.fetchPrequalification_V2(aid)),
    );
  };

  return (
    <Box>
      <Loading status={statusPreq.message} />
      {!statusPreq.message && (
        <DocContainer
          title={t('references')}
          actionLabel={t('add-reference')}
          titleDialog={t('new-reference')}
          description={t('reference-desc')}
          action={
            isProsper
              ? () => {
                  setSelectedReference(null);
                  handleOnShow();
                }
              : null
          }
          selected={selectedReference}
          open={open}
          Form={FormReference}
          handleOnClose={handleOnClose}
          handleSubmit={handleSubmit}
        >
          {references.map((r) => (
            <Doc
              key={r.id}
              actions={[
                {
                  id: 1,
                  label: t('resend'),
                  action: () => {
                    handleResend(r.id);
                    handleOnShow();
                  },
                },
                {
                  id: 2,
                  label: t('delete'),
                  action: () => handleRemove(r.id),
                },
              ]}
            >
              <Content
                aid={aid}
                title={r.label}
                idDoc={r.id}
                icon={getReferenceStatus(r.status).icon}
                date={r.date}
                document={r.document}
                fileName={r.original_file}
                open={open}
                setOpen={setOpen}
                extra={{
                  backgroundColor: getReferenceStatus(r.status).bg,
                }}
              >
                <Grid item xs={6}>
                  <Typography>
                    {t('value')}
                    <br />
                    {Boolean(r && r.contract_value) &&
                      metricSystemFormat(r.contract_value)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    {t('completion')}
                    <br />
                    {Boolean(r.completion_date) &&
                      String(
                        moment(new Date(r.completion_date)).format('MM/YYYY'),
                      )}
                  </Typography>
                </Grid>
              </Content>
            </Doc>
          ))}
        </DocContainer>
      )}
    </Box>
  );
};

const mapStateToProps = (state) => ({
  prequalificationV2: state.prequalificationV2,
});

export default connect(mapStateToProps)(References);
export {
  getReferenceStatus,
  getPreqNonRefDocStatus,
  PENDING,
  APPROVED,
  DELETED,
  NOT_PROVIDED,
};
