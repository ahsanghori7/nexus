import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Number from 'v2/apps/shared/components/prequalification/v2/form/Number';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import { useContext } from 'hooks/context';

const Envelopes = ({ features, dispatch, contextType = 'admin' }) => {
  const { t } = useTranslation();
  const params = useParams();
  const aid = params.accountId;

  const context = useContext(contextType);
  const { actions } = context;
  const { envelopes } = features;

  useEffect(() => {
    if (aid) {
      dispatch(actions.fetchAccountEnvelopes(aid));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aid]);

  const handleOnSubmit = (data) => {
    dispatch(actions.updateAccountEnvelopes({ aid, data }));
  };

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (envelopes) {
      reset({
        envelopes: envelopes ? envelopes.envelopes : 0,
        current: envelopes ? envelopes.current : 0,
        period: envelopes ? envelopes.period : '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelopes]);

  return (
    <Box
      sx={{ '& .MuiFormControl-root': { pb: 1 } }}
      component="form"
      onSubmit={handleSubmit(handleOnSubmit)}
    >
      <Number
        sx={{ mt: 1 }}
        label={t('current_envelopes')}
        name="current"
        register={register}
        errors={errors}
      />
      <Number
        sx={{ mt: 1 }}
        label={t('envelopes')}
        name="envelopes"
        register={register}
        errors={errors}
      />
      <Text
        name="period"
        label={t('period')}
        errors={errors}
        register={register}
      />
      <Button type="submit" variant="contained" color="primary" data-testid="envelopes-button-submit">
        Submit
      </Button>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  features: state.features,
});

export default connect(mapStateToProps)(Envelopes);
