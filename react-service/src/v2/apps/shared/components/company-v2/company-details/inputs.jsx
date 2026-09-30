import React from 'react';
import { InputForm, InputFormControlled } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { StyledCheckboxWrapper } from './styled';
import { MuiRequired } from '../Mui.styled';

const defaultRules = {
  required: 'Required',
};

// TODO: Refactor this file to we don't have a 300 line file hard to track
export const CompanyFirstName = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="firstname"
    label={<MuiRequired>{i18next.t('profile-firstname')}</MuiRequired>}
    errors={errors}
    defaultValue={value.firstname ?? ''}
    name="firstname"
    type="text"
    register={register}
    rules={rules}
  />
);

export const CompanyLastName = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="lastname"
    label={<MuiRequired>{i18next.t('profile-lastname')}</MuiRequired>}
    errors={errors}
    defaultValue={value.lastname ?? ''}
    name="lastname"
    type="text"
    register={register}
    rules={rules}
  />
);

export const CompanyEmail = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="email"
    label={<MuiRequired>{i18next.t('profile-company-email')}</MuiRequired>}
    errors={errors}
    defaultValue={value.email ?? ''}
    name="email"
    type="text"
    register={register}
    rules={{
      ...rules,
      pattern: {
        value:
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: 'The email is not valid',
      },
    }}
    placeholder={i18next.t('email-example')}
  />
);

// Todo: add email validations in a helper
export const UserEmail = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="email"
    label={<MuiRequired>{i18next.t('profile-user-email')}</MuiRequired>}
    errors={errors}
    defaultValue={value.email ?? ''}
    name="email"
    type="text"
    register={register}
    rules={{
      ...rules,
      pattern: {
        value:
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: 'The email is not valid',
      },
    }}
    placeholder={i18next.t('email-example')}
  />
);

export const CompanyJobDescription = ({ register, rules, errors, value }) => (
  <InputForm
    autoComplete="job_description"
    label={i18next.t('profile-job-title')}
    errors={errors}
    defaultValue={value.job_description ?? ''}
    name="job_description"
    type="text"
    register={register}
    rules={rules}
  />
);

export const CompanyRegisteredAddress = ({
  register,
  rules = defaultRules,
  errors,
  value,
  type = 'text',
}) => (
  <InputForm
    autoComplete="registered_address"
    label={
      <MuiRequired>
        {i18next.t('profile-registered-company-address')}
      </MuiRequired>
    }
    errors={errors}
    defaultValue={value.registered_address ?? ''}
    name="registered_address"
    type={type}
    register={register}
    rules={rules}
    placeholder={i18next.t('registered-company-address')}
  />
);

export const CompanyOperatingAddress = ({
  register,
  rules = defaultRules,
  errors,
  type = 'address',
  readOnly,
  setValue,
  getValues,
  manualMode,
  control,
  trigger,
  isUK,
}) => {
  const { operating_company_address: formAddress } = getValues();
  return (
    <InputFormControlled
      autoComplete="operating_company_address"
      label={
        <MuiRequired>
          {i18next.t('profile-operating-company-address')}
        </MuiRequired>
      }
      errors={errors}
      value={formAddress ?? ''}
      name="operating_company_address"
      type={type}
      register={register}
      rules={rules}
      placeholder={i18next.t('enter-postcode')}
      readOnly={readOnly}
      manualMode={manualMode}
      control={control}
      setValue={setValue}
      manualLabel={isUK ? i18next.t('enter-manually') : null}
      asyncLabel={i18next.isUK ? t('search-spostcode') : null}
      callback={(callbackProps) => {
        const {
          inputValue,
          setInputOptions,
        } = callbackProps;
        const url = `${GET_ADDRESS.HOST}${inputValue}?api-key=${GET_ADDRESS.API_KEY}&expand=true`;
        fetch(url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
        })
          .then((result) => result.json())
          .then((data) => {
            if (!('Message' in data)) {
              const { addresses } = data;
              const options = addresses.map((address, index) => ({
                id: index,
                content: [
                  address.line_1,
                  address.line_2,
                  address.line_3,
                  address.line_4,
                  address.town_or_city,
                  address.district,
                  address.country,
                  inputValue,
                ]
                  .filter((i) => Boolean(i))
                  .join(', ')
                  .trim(),
              }));
              setInputOptions(options);
              trigger(['operating_company_address']);
            }
          });
      }}
      isUK={isUK}
    />
  );
};

export const EnableOperatingAddress = ({
  register,
  rules,
  errors,
  type = 'checkbox',
  checked,
  manualMode,
}) => (
  <StyledCheckboxWrapper
    className={`checkbox-wrapper${manualMode ? '-manual-mode' : ''}`}
  >
    {/* Todo: refactor into Mui <StyledCheckboxWrapper /> and remove the styled.jsx */}
    <InputForm
      key="checked"
      autoComplete="checked"
      label={i18next.t('profile-same-registered-address').toUpperCase()}
      errors={errors}
      name="checked"
      type={type}
      register={register}
      options={[{ id: 1, label: '' }]}
      rules={rules}
      checked={checked}
    />
  </StyledCheckboxWrapper>
);

export const CompanyStatus = ({
  register,
  errors,
  value,
  readOnly = false,
}) => (
  <InputForm
    autoComplete="status"
    label={i18next.t('profile-company-status')}
    errors={errors}
    defaultValue={value.status}
    name="status"
    readOnly={readOnly}
    type="text"
    register={register}
  />
);

export const CompanyLandlineNumber = ({ register, errors, value }) => (
  <InputForm
    autoComplete="landline"
    label={i18next.t('profile-landline-number')}
    errors={errors}
    defaultValue={value.landline ?? ''}
    name="landline"
    type="text"
    register={register}
    placeholder={i18next.t('landline-example')}
  />
);

export const CompanyMobileNumber = ({
  register,
  rules = defaultRules,
  errors,
  value = '',
}) => (
  <InputForm
    autoComplete="mobile"
    label={<MuiRequired>{i18next.t('profile-mobile-number')}</MuiRequired>}
    errors={errors}
    defaultValue={value.mobile}
    name="mobile"
    type="text"
    register={register}
    rules={rules}
    placeholder={i18next.t('mobile-number-example')}
  />
);

export const CompanyWebsiteUrl = ({ register, errors, value }) => (
  <InputForm
    autoComplete="website"
    label={i18next.t('profile-website-url')}
    errors={errors}
    defaultValue={value.website ?? ''}
    name="website"
    type="text"
    register={register}
    placeholder={i18next.t('website-example')}
  />
);

export const CompanyLinkedInUrl = ({ register, errors, value }) => (
  <InputForm
    autoComplete="linkedin"
    label={i18next.t('profile-linkedIn-url')}
    errors={errors}
    defaultValue={value.linkedin ?? ''}
    name="linkedin"
    type="text"
    register={register}
    placeholder={i18next.t('company-name-example')}
  />
);

export const CompanyVatRegistration = ({ register, errors, value }) => (
  <InputForm
    autoComplete="vat_number"
    label={i18next.t('profile-vat-registration')}
    errors={errors}
    defaultValue={value.vat_number ?? ''}
    name="vat_number"
    type="text"
    register={register}
  />
);

export const CompanyStrapline = ({ register, errors, value }) => (
  <InputForm
    autoComplete="strapline"
    label={i18next.t('profile-company-strapline')}
    errors={errors}
    defaultValue={value.strapline ?? ''}
    name="strapline"
    type="text"
    register={register}
    placeholder={i18next.t('company-strapline')}
  />
);

export const CompanyDescriptionInput = ({
  register,
  errors,
  control,
  setValue,
  trigger,
}) => (
  <InputFormControlled
    register={register}
    control={control}
    setValue={setValue}
    autoComplete="description"
    label={i18next.t('profile-company-description')}
    errors={errors}
    name="description"
    type="editor"
    trigger={trigger}
  />
);
