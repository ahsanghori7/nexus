import React from 'react';
import { InputForm, InputFormControlled } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { StyledCheckboxWrapper } from './styled';

const defaultRules = {
  required: 'Required',
};

export const CompanyFirstName = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="firstname"
    label={i18next.t('profile-firstname')}
    errors={errors}
    defaultValue={value.firstname ?? ''}
    name="firstname"
    type="text"
    register={register}
    rules={rules}
    data-testid="input-firstname"
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
    label={i18next.t('profile-lastname')}
    errors={errors}
    defaultValue={value.lastname ?? ''}
    name="lastname"
    type="text"
    register={register}
    rules={rules}
    data-testid="input-lastname"
  />
);

export const CompanyName = ({
  register,
  rules = defaultRules,
  errors,
  value,
  readOnly = false,
}) => (
  <InputForm
    readOnly={readOnly}
    autoComplete="name"
    label={i18next.t('profile-company-name')}
    errors={errors}
    defaultValue={value.name ?? ''}
    name="name"
    type="text"
    register={register}
    rules={rules}
    data-testid="input-company-name"
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
    label={i18next.t('profile-company-email')}
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
    placeholder="e.g john@smithcobuilders.co.uk"
    data-testid="input-company-email"
  />
);

export const UserEmail = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="email"
    label={i18next.t('profile-user-email')}
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
    placeholder="e.g john@smithcobuilders.co.uk"
    data-testid="input-user-email"
  />
);

export const CompanyJobDescription = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="job_description"
    label={i18next.t('profile-job-title')}
    errors={errors}
    defaultValue={value.job_description ?? ''}
    name="job_description"
    type="text"
    register={register}
    rules={rules}
    data-testid="input-job-description"
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
    label={i18next.t('profile-registered-company-address')}
    errors={errors}
    defaultValue={value.registered_address ?? ''}
    name="registered_address"
    type={type}
    register={register}
    rules={rules}
    placeholder="Please enter registered company address.."
    data-testid="input-registered-address"
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
  setDirty,
}) => {
  const { operating_company_address: formAddress } = getValues();
  return (
    <InputFormControlled
      autoComplete="operating_company_address"
      label={i18next.t('profile-operating-company-address')}
      errors={errors}
      value={formAddress ?? ''}
      name="operating_company_address"
      type={type}
      register={register}
      rules={rules}
      placeholder="Please enter your postcode…"
      data-testid="input-operating-address"
      readOnly={readOnly}
      manualMode={manualMode}
      control={control}
      setValue={setValue}
      setDirty={setDirty}
      manualLabel={i18next.t('enter-manually')}
      asyncLabel={i18next.t('search-spostcode')}
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
      data-testid="input-enable-operating-address"
    />
  </StyledCheckboxWrapper>
);

export const CompanyNumber = ({
  register,
  rules = defaultRules,
  errors,
  value,
  readOnly = false,
}) => (
  <InputForm
    readOnly={readOnly}
    autoComplete="reg_number"
    label={i18next.t('profile-company-number')}
    errors={errors}
    defaultValue={value.reg_number ?? ''}
    name="reg_number"
    type="text"
    register={register}
    rules={rules}
    placeholder="Please enter company"
    data-testid="input-company-number"
  />
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
    data-testid="input-company-status"
  />
);

export const CompanyLandlineNumber = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="landline"
    label={i18next.t('profile-landline-number')}
    errors={errors}
    defaultValue={value.landline ?? ''}
    name="landline"
    type="text"
    register={register}
    rules={rules}
    placeholder="e.g 01928 293754"
    data-testid="input-landline"
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
    label={i18next.t('profile-mobile-number')}
    errors={errors}
    defaultValue={value.mobile}
    name="mobile"
    type="text"
    register={register}
    rules={rules}
    placeholder="e.g 07983 5444612"
    data-testid="input-mobile"
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
    placeholder="e.g www.smithcobuilders.co.uk"
    data-testid="input-website"
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
    placeholder="e.g smithcolimited"
    data-testid="input-linkedin"
  />
);

export const CompanyVatRegistration = ({
  register,
  rules = defaultRules,
  errors,
  value,
}) => (
  <InputForm
    autoComplete="vat_number"
    label={i18next.t('profile-vat-registration')}
    errors={errors}
    defaultValue={value.vat_number ?? ''}
    name="vat_number"
    type="text"
    register={register}
    rules={rules}
    data-testid="input-vat-number"
  />
);
