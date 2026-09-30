import React, { useState } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { InputForm, InputText, InputEmail } from 'clink-components';
import { getAddress } from 'v2/helpers/data';
import { useTranslation } from 'react-i18next';
import { checkValid, messages1 } from 'v2/helpers/async';
import {
  Container,
  Item,
  Typography,
  SubItem,
  PageTitle,
} from './Modal.styled';

const Page1 = ({
  errors,
  register,
  setValue,
  trigger,
  getValues,
  emailError,
  nameError,
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState([]);
  const [name, setName] = useState(getValues().company_name || '');
  const [companyEmailError, setCompanyEmailError] = emailError;
  const [companyNameError, setCompanyNameError] = nameError;
  return (
    <>
      <PageTitle>{t('company-information')}</PageTitle>
      <Container>
        <Item>
          <InputText
            autoComplete="off"
            label={t('profile-company-name')}
            name="company_name"
            type="text"
            data-testid="modal-input-company-name"
            inputValue={name}
            onChange={async (e) => {
              const { value } = e.target;
              setName(value);
              checkValid(
                value,
                'company_name',
                setCompanyNameError,
                () => {
                  setValue('company_name', value);
                  setValue('registered_company_number', '');
                  setValue('company_address', '');
                },
                setOptions,
              );
            }}
            hasError={companyNameError}
          />
          {companyNameError && <Typography>{companyNameError}</Typography>}
          {options && Boolean(options.length) && (
            <List
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                maxHeight: '100px',
                overflow: 'scroll',
              }}
              component="nav"
              aria-labelledby="nested-list-subheader"
            >
              {options.map((option) => {
                const { address, has_account: hasAccount } = option;
                const addressValue = getAddress(address);
                return (
                  <ListItemButton
                    key={option.number}
                    data-testid={`modal-option-company-${option.number}`}
                    onClick={() => {
                      if (hasAccount) {
                        setCompanyNameError(messages1.company_name);
                      } else {
                        setCompanyNameError(false);
                        setOptions([]);
                        setValue('registered_company_number', option.number);
                        setValue('company_address', addressValue);
                        setValue('company_name', option.name);
                        setName(option.name);
                      }
                    }}
                  >
                    <ListItemText primary={option.name} />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Item>
        <Item>
          <InputForm
            autoComplete="registered_company_number"
            label={t('prequalification-reg_number')}
            errors={errors}
            name="registered_company_number"
            type="text"
            register={register}
            rules={{ required: `${t('prequalification-reg_number')} required` }}
            disabled
            data-testid="modal-input-reg-number"
          />
        </Item>
        <Item>
          <Container>
            <SubItem>
              <InputForm
                autoComplete="company_address"
                label={t('company_address')}
                errors={errors}
                name="company_address"
                type="text"
                register={register}
                rules={{
                  required: `${t(
                    'profile-registered-company-address',
                  )} required`,
                }}
                data-testid="modal-input-company-address"
              />
            </SubItem>
            <SubItem>
              <InputForm
                autoComplete="company_landline"
                label={t('company_landline')}
                errors={errors}
                name="company_landline"
                type="text"
                register={register}
                data-testid="modal-input-company-landline"
              />
            </SubItem>
          </Container>
        </Item>
        <Item>
          <Container>
            <SubItem>
              <InputEmail
                autoComplete="company_email"
                label={t('profile-company-email')}
                name="company_email"
                type="email"
                data-testid="modal-input-company-email"
                defaultValue={getValues().company_email || ''}
                onChange={async (e) => {
                  const { value } = e.target;
                  checkValid(
                    value,
                    'company_email',
                    setCompanyEmailError,
                    () => {
                      setValue('company_email', value);
                      trigger(['registered_company_number']);
                    },
                    null,
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                  );
                }}
                hasError={companyEmailError}
              />
              {companyEmailError && (
                <Typography>{companyEmailError}</Typography>
              )}
            </SubItem>
            <SubItem>
              <InputForm
                autoComplete="company_website"
                label={t('company_website')}
                errors={errors}
                name="company_website"
                type="text"
                register={register}
                data-testid="modal-input-company-website"
              />
            </SubItem>
          </Container>
        </Item>
      </Container>
    </>
  );
};

export default Page1;
