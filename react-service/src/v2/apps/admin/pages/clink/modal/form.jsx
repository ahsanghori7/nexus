import React, { useState } from 'react';
import {
  Button,
  Form as ClinkForm,
  Modal,
  ModalContent,
} from 'clink-components';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import Box from '@mui/material/Box';
import Page1 from './Page1';
import Page2 from './Page2';
import Page3 from './Page3';
import { Typography } from './Modal.styled';

const FormModal = ({ subscription, dispatch }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [companyEmailError, setCompanyEmailError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [companyNameError, setCompanyNameError] = useState(false);
  const context = useContext('admin');
  const { actions } = context;
  const { subscriptionsList } = subscription;
  // TODO: ClinkForm select works different now. To investigate
  const options = subscriptionsList.map((subs) => ({
    ...subs,
    label: `${subs.label} - (${subs.interval_type})`,
  }));
  return (
    <Modal
      className="confirm-modal new-account-form"
      openElement={
        <Button layout="dropdown" align="right" data-testid="clink-button-create-account">
          {t('create-account')}
        </Button>
      }
      render={(modalProps) => (
        <ModalContent>
          <Box textAlign="center" mb={2}>
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
              fontStyle="initial"
              color="primary"
              variant="title3"
            >
              {t('create-account')}
            </Typography>
          </Box>
          <ClinkForm
            disableUntilValid
            defaultValues={{
              company_name: '',
              registered_company_number: '',
              company_address: '',
              company_landline: '',
              company_email: '',
              company_website: '',
              first_name: '',
              last_name: '',
              telephone: '',
              email: '',
              job_title: '',
              display_name: '',
              password: '',
              repeatPassword: '',
              subscription_id: '',
            }}
            method="POST"
            onSubmit={(values) => {
              if (step !== 2) {
                setStep(step + 1);
              } else {
                if (values?.subscription_id?.id) {
                  dispatch(
                    actions.createAccount({
                      ...values,
                      subscription_id: values.subscription_id.id,
                    }),
                  );
                  modalProps.handleClose();
                  setStep(0);
                }

                const subscriptionObj = options.find(
                  (option) => option.label === values?.subscription_id,
                );
                if (subscriptionObj?.id) {
                  dispatch(
                    actions.createAccount({
                      ...values,
                      subscription_id: subscriptionObj.id,
                    }),
                  );
                  modalProps.handleClose();
                  setStep(0);
                } else {
                  // eslint-disable-next-line no-console
                  console.error(
                    `Subscription ID is required, got this: ${values?.subscription_id?.id}`,
                    'From object:',
                    values?.subscription_id,
                  );
                }
              }
            }}
            render={(formHook) => {
              const {
                formState,
                register,
                setValue,
                trigger,
                control,
                getValues,
              } = formHook;
              const { errors, isDirty, isValid } = formState;
              const disabledSubmit = !isDirty || !isValid;
              const companyNameInvalid =
                isEmpty(getValues().company_name) || companyNameError;
              const companyEmailInvalid =
                isEmpty(getValues().company_email) || companyEmailError;
              const emailInvalid =
                isEmpty(getValues().company_email) || companyEmailError;
              let buttonProps = {
                label: t('next'),
                disabled:
                  disabledSubmit ||
                  companyNameInvalid ||
                  companyEmailInvalid ||
                  (step === 1 && emailInvalid),
              };
              if (step === 2) {
                buttonProps = {
                  label: t('save'),
                };
              }
              return (
                <>
                  <small>Step {step + 1}</small>
                  {step === 0 && (
                    <Page1
                      errors={errors}
                      register={register}
                      setValue={setValue}
                      trigger={trigger}
                      getValues={getValues}
                      nameError={[companyNameError, setCompanyNameError]}
                      emailError={[companyEmailError, setCompanyEmailError]}
                    />
                  )}
                  {step === 1 && (
                    <Page2
                      errors={errors}
                      register={register}
                      control={control}
                      setValue={setValue}
                      trigger={trigger}
                      getValues={getValues}
                      userEmailError={[emailError, setEmailError]}
                    />
                  )}
                  {step === 2 && (
                    <Page3
                      errors={errors}
                      register={register}
                      control={control}
                      setValue={setValue}
                      trigger={trigger}
                      subscriptionsList={options}
                    />
                  )}
                  <Box textAlign="center">
                    {step !== 0 && (
                      <Button
                        id="btn-no"
                        layout="square"
                        color="redButton"
                        handleClick={() => setStep(step - 1)}
                        data-testid="modal-button-back"
                      >
                        {t('back')}
                      </Button>
                    )}
                    <Button
                      id="submit-button"
                      type="submit"
                      layout="square"
                      color="greenButton"
                      data-testid="modal-button-next-save"
                      {...buttonProps}
                    >
                      {t('save')}
                    </Button>
                  </Box>
                </>
              );
            }}
          />
        </ModalContent>
      )}
    />
  );
};

const mapStateToProps = (state) => ({
  subscription: state.subscription,
});

export default connect(mapStateToProps)(FormModal);
