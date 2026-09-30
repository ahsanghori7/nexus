import React from 'react';
import {
  HELPERS,
  InputEmail,
  InputForm,
  InputFormControlled,
} from 'clink-components';
import { useTranslation } from 'react-i18next';
import { checkValid } from 'v2/helpers/async';
import {
  PageTitle,
  SubItem,
  Container,
  Item,
  Typography,
} from './Modal.styled';

const { PasswordValidation } = HELPERS;

const Page2 = ({
  errors,
  register,
  setValue,
  control,
  trigger,
  getValues,
  userEmailError,
}) => {
  const { t } = useTranslation();
  const [emailError, setEmailError] = userEmailError;

  const getRules = (nameInput, labelInput) => ({
    validate: (value) => {
      if (value && getValues(nameInput) && value !== getValues(nameInput)) {
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
    <>
      <PageTitle>{t('personal_information')}</PageTitle>
      <Container>
        <Item>
          <Container>
            <SubItem>
              <InputForm
                autoComplete="firstname"
                label={t('profile-firstname')}
                errors={errors}
                name="first_name"
                type="text"
                register={register}
                rules={{ required: `${t('profile-firstname')} required` }}
                data-testid="modal-input-first-name"
              />
            </SubItem>
            <SubItem>
              <InputForm
                autoComplete="lastname"
                label={t('profile-lastname')}
                errors={errors}
                name="last_name"
                type="text"
                register={register}
                rules={{ required: `${t('profile-lastname')} required` }}
                data-testid="modal-input-last-name"
              />
            </SubItem>
          </Container>
        </Item>
        <Item>
          <Container>
            <SubItem>
              <InputForm
                autoComplete="telephone"
                label={t('contact_number')}
                errors={errors}
                name="telephone"
                type="text"
                register={register}
                rules={{ required: `${t('contact_number')} required` }}
                data-testid="modal-input-telephone"
              />
            </SubItem>
            <SubItem>
              <InputEmail
                autoComplete="email"
                label={t('email')}
                name="email"
                type="email"
                data-testid="modal-input-email"
                defaultValue={getValues().email || ''}
                onChange={async (e) => {
                  const { value } = e.target;
                  checkValid(
                    value,
                    'email',
                    setEmailError,
                    () => {
                      setValue('email', value);
                      trigger(['registered_company_number']);
                    },
                    null,
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                  );
                }}
                hasError={emailError}
              />
              {emailError && <Typography>{emailError}</Typography>}
            </SubItem>
          </Container>
        </Item>
        <Item>
          <InputForm
            autoComplete="job_title"
            label={t('job_title')}
            errors={errors}
            name="job_title"
            type="text"
            register={register}
            data-testid="modal-input-job-title"
          />
        </Item>
        <PageTitle>{t('account_settings')}</PageTitle>
        <Item>
          <InputForm
            autoComplete="display_name"
            label={t('display_name')}
            errors={errors}
            name="display_name"
            type="text"
            register={register}
            rules={{ required: `${t('display_name')} required` }}
            data-testid="modal-input-display-name"
          />
        </Item>
        <Item>
          <Container>
            <SubItem>
              <InputFormControlled
                autoComplete="password"
                label={t('new-password')}
                errors={errors}
                name="password"
                type="password"
                register={register}
                setValue={setValue}
                control={control}
                rules={getRules('repeatPassword', t('new-password'))}
                onBlur={() => trigger(['repeatPassword'])}
                placeholder="*******"
                showPassword
                data-testid="modal-input-password"
              />
            </SubItem>
            <SubItem>
              <InputFormControlled
                autoComplete="password"
                label={t('repeat-password')}
                errors={errors}
                name="repeatPassword"
                type="password"
                register={register}
                setValue={setValue}
                control={control}
                rules={getRules('password', t('repeat-password'))}
                onBlur={() => trigger(['password'])}
                placeholder="*******"
                showPassword
                data-testid="modal-input-repeat-password"
              />
            </SubItem>
          </Container>
        </Item>
      </Container>
    </>
  );
};

export default Page2;
