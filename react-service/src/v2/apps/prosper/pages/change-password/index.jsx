import React, { useState } from 'react';
import {
  Form as ClinkForm,
  Button,
  Panel,
  InputFormControlled,
  HELPERS,
} from 'clink-components';
import {
  StyledInnerWrapper,
  StyledWithMarginAndLoader,
  StyledWrapper,
} from 'v2/apps/admin/pages/prosper/Accounts/company/Theme.styled'; // TODO: Extract these styles to a proper common path
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import Relay from 'v2/services/relay';
import FlashMessage from 'v2/apps/shared/components/Alert';
import { LoaderWrapper, PasswordWrapper } from './ChangePassword.styled';

const { PasswordValidation } = HELPERS;
function NewPassword() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState('success');
  const [message, setMessage] = useState(
    'You have successfully modified your account!'
  );
  const { t } = useTranslation();
  const handleSubmit = (values) => {
    setLoading(true);
    const service = new Relay('user');
    return service
      .patch(values, 'change_password')
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setSeverity('success');
          setMessage(t('change-password-success'));
        } else {
          setSeverity('error');
          setMessage(t('change-password-error-400'));
        }
        setOpen(true);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setOpen(true);
        setSeverity('error');
        setMessage(t('change-password-error-500'));
      });
  };
  return (
    <PasswordWrapper>
      <FlashMessage
        status={severity}
        message={message}
        open={open}
        handleClose={() => setOpen(false)}
      />
      <Panel className="prosper-password">
        <ClinkForm
          disableUntilValid
          defaultValues={{ password: '', repeat_password: '' }}
          method="POST"
          onSubmit={handleSubmit}
          render={(formHook) => {
            const {
              formState,
              register,
              control,
              setValue,
              getValues,
              trigger,
            } = formHook;
            const { errors, isDirty, isValid } = formState;
            const disabledSubmit = loading || !isDirty || !isValid;
            const getRules = (nameInput, labelInput) => ({
              validate: (value) => {
                if (
                  value &&
                  getValues(nameInput) &&
                  value !== getValues(nameInput)
                ) {
                  return t('match-password');
                }
                const [error] = PasswordValidation.testPassword(value);
                if (error) {
                  return t(`val-password-${error}`);
                }
                return true;
              },
              required: `${labelInput} is required.`,
            });
            return (
              <StyledWrapper>
                <StyledInnerWrapper>
                  <InputFormControlled
                    autoComplete="current_password"
                    label={t('current_password')}
                    errors={errors}
                    name="current_password"
                    type="password"
                    register={register}
                    setValue={setValue}
                    control={control}
                    rules={{ required: 'Required' }}
                    onBlur={() => trigger(['current_password'])}
                    placeholder="*******"
                    showPassword
                    showPasswordBox={false}
                  />
                </StyledInnerWrapper>
                <StyledInnerWrapper>
                  <InputFormControlled
                    autoComplete="password"
                    label={t('new-password')}
                    errors={errors}
                    name="password"
                    type="password"
                    register={register}
                    setValue={setValue}
                    control={control}
                    rules={getRules('repeat_password', t('new-password'))}
                    onBlur={() => trigger(['repeat_password'])}
                    placeholder="*******"
                    showPassword
                  />
                </StyledInnerWrapper>
                <StyledInnerWrapper>
                  <InputFormControlled
                    autoComplete="repeat_password"
                    label={t('re-enter-password')}
                    errors={errors}
                    name="repeat_password"
                    type="password"
                    register={register}
                    setValue={setValue}
                    control={control}
                    rules={getRules('password', t('re-enter-password'))}
                    onBlur={() => trigger(['password'])}
                    placeholder="*******"
                    showPassword
                  />
                </StyledInnerWrapper>
                <StyledWithMarginAndLoader>
                  <LoaderWrapper>
                    {loading && <CircularProgress />}
                    {!loading && (
                      <Button
                        id="submit-button"
                        type="submit"
                        layout="square"
                        color="prosperGreenButton"
                        disabled={disabledSubmit}
                      >
                        {t('change-password')}
                      </Button>
                    )}
                  </LoaderWrapper>
                </StyledWithMarginAndLoader>
              </StyledWrapper>
            );
          }}
        />
      </Panel>
    </PasswordWrapper>
  );
}

export default NewPassword;
