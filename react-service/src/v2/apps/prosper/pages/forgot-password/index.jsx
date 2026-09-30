import React, { useState, useEffect } from 'react';
import {
  Form as ClinkForm,
  InputForm,
  InputFormControlled,
  Page,
  Button,
  Image,
  CONSTANTS,
  HELPERS,
} from 'clink-components';
import { useParams } from 'react-router-dom';
import PHPGloblals from 'v2/helpers/php-globals';
import { useTranslation } from 'react-i18next';
import Relay from 'v2/services/relay';
import { getUrlWithoutParamers } from 'v2/helpers/url';
import {
  StyledForgotPassword,
  StyledForgotPasswordLogo,
  StyledForgotPasswordMessage,
  StyledForgotPasswordTitle,
} from './ForgotPassword.styled';
import Cookies from 'js-cookie';

const { prosperLogoFull } = CONSTANTS.s3;
const { prosperBoxRed: prosperRed, prosperBoxGreen } = CONSTANTS.colors.prosper;

function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(null);
  const { t } = useTranslation();
  const url = getUrlWithoutParamers();
  const params = useParams();
  const conf = PHPGloblals();
  const csfr = {
    name: 'Csfr-Token',
    value: Cookies.get('csfr_token') || conf?.csfr,
  };

  useEffect(() => {
    if (conf && conf.messages && conf.messages.error) {
      setMessage(conf.messages.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { token } = params;
  let name = 'email';
  let label = 'Email Address';
  let placeholder = 'example@domain.com';
  const rules = { required: 'Email is required' };
  let successMessage = token
    ? 'password-change-successful'
    : 'password-reset-successful';
  let method = 'password/reset';
  let title = 'recover-password';
  let buttonLabel = 'recover-password';
  const requestLogin = 'request_login_request';
  const messageColor = submitted ? prosperBoxGreen : prosperRed;

  const defaultValues = {
    [name]: '',
  };

  const formExtraProps = {};

  if (url.includes('request_login')) {
    title = 'login-request';
    method = requestLogin;
    buttonLabel = 'send-login-link';
    successMessage = 'login-request-success';
  }

  const handleSubmit = (data) => {
    const headers = csfr ? { [csfr.name]: csfr.value } : undefined;
    return new Relay('account', '', '')
      .postForm(data, method, null, headers)
      .then((response) => {
        if (response.status === 429) {
          throw new Error(t('login-request-429'));
        }
        return response.json();
      })
      .then((e) => {
        if (e && e.success) {
          setSubmitted(true);
          setMessage(t(successMessage));
        } else if (e && e.error) {
          setSubmitted(false);
          setMessage(t(e.error));
        } else if (e && !e.email_valid) {
          setSubmitted(false);
          setMessage(t('login-invalid-email'));
        } else {
          setSubmitted(true);
          setMessage(t(successMessage));
        }
      })
      .catch((error) => {
        setSubmitted(false);
        setMessage(t(error.message));
      });
  };

  if (token) {
    name = 'password';
    label = t('new-password');
    placeholder = '*******';
    method = '/account/password/new';
    title = 'create-new-password';
    buttonLabel = 'save-changes-sign-in';

    rules.required = 'Password is required';
    rules.validate = (value) => {
      const [error] = HELPERS.PasswordValidation.testPassword(value);
      if (error) {
        return t(`val-password-${error}`);
      }
      return true;
    };

    defaultValues.token = token;

    formExtraProps.action = method;
    formExtraProps.onSubmit = (data, e) => {
      e.target.submit();
      return true;
    };
  } else {
    formExtraProps.onSubmit = handleSubmit;
  }

  if (!token) {
    rules.pattern = {
      value:
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: 'The email is not valid',
    };
  }

  return (
    <Page>
      <StyledForgotPassword className="forgot-password-wrapper">
        <StyledForgotPasswordLogo className="forgot-password-logo">
          <Image src={prosperLogoFull} />
        </StyledForgotPasswordLogo>

        {message && (
          <StyledForgotPasswordMessage
            role="button"
            tabIndex="0"
            color={messageColor}
          >
            {t(message)}
          </StyledForgotPasswordMessage>
        )}

        <StyledForgotPasswordTitle className="forgot-password-title">
          {t(title)}
        </StyledForgotPasswordTitle>

        <ClinkForm
          data-testid="form-content"
          disableUntilValid
          defaultValues={defaultValues}
          method="POST"
          {...formExtraProps}
          render={(formHook) => {
            const { formState, register, control } = formHook;
            const { errors, isDirty, isValid } = formState;
            const disabledSubmit = !isDirty || !isValid || submitted;
            return (
              <>
                <InputFormControlled
                  autoComplete={name}
                  label={label}
                  errors={errors}
                  register={register}
                  placeholder={placeholder}
                  name={name}
                  type={name}
                  rules={rules}
                  control={control}
                  onBlur={() => {
                    if (message) {
                      setMessage(null);
                    }
                  }}
                />
                {token && (
                  <InputForm
                    autoComplete="token"
                    errors={errors}
                    register={register}
                    name="token"
                    type="hidden"
                    value={token}
                  />
                )}
                <Button
                  id="submit-button"
                  type="submit"
                  layout="square"
                  color="prosperGreenButton"
                  disabled={disabledSubmit}
                >
                  {t(buttonLabel)}
                </Button>
              </>
            );
          }}
        />
      </StyledForgotPassword>
    </Page>
  );
}

export default ForgotPassword;
