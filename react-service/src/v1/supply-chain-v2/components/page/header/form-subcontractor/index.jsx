import React from 'react';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import i18next from 'v2/helpers/i18n';
import Loading from 'v1/global/components/Loading';
import FieldHolder, { MuiInputLabel } from './FieldHolder';
import { CloseButton, SubcontractorSubmitButton } from './Buttons';
import InputIcon, { IconWrapper } from './InputIcon';
import hooks from './hooks';
import SearchableMultiSelectField from './SearchableMultiSelectField';

const ANZ_CODE_REGIONS = ['NZ', 'AUS'];

const FormSubcontractor = ({
  formData,
  onSubmit,
  regions,
  trades: tradesProps,
  hasAccountProp,
  accountData,
  existingSubcontractor,
  onBack,
}) => {
  const rest = { ...formData };
  rest.hasAccount =
    formData?.has_account || formData?.hasAccount || hasAccountProp;

  const {
    loading,
    company_name,
    company_nameError,
    handleCompanyName,
    reg_number,
    reg_numberError,
    handleRegNumber,
    firstname,
    firstnameError,
    handleFirstName,
    lastname,
    lastnameError,
    handleLastName,
    email,
    emailError,
    handleEmail,
    phone,
    phoneError,
    handlePhone,
    address,
    addressError,
    handleAddress,
    locations,
    locationsError,
    handleLocations,
    trades,
    tradesError,
    handleTrades,
    handleSubmit,
    hasAccount,
  } = hooks(rest, onSubmit);

  const isNonUk = formData?.is_non_uk || false;

  const savedSubcontractor =
    formData?.firstname || formData?.lastname || formData?.email || formData?.phone;

  // For non-UK subcontractors: reg_number and phone are optional
  const disableSubmit = isNonUk
    ? !company_name ||
      !firstname ||
      !lastname ||
      !email ||
      Boolean(emailError?.email) ||
      !address ||
      !trades.length ||
      !locations.length
    : !company_name ||
      !reg_number ||
      !firstname ||
      !lastname ||
      !email ||
      Boolean(emailError?.email) ||
      !phone ||
      !address ||
      !trades.length ||
      !locations.length;

  const handleBack = () => {
    const type = isNonUk ? 'non-uk' : 'uk';
    onBack(reg_number, company_name, type);
  };

  return (
    <>
      {loading && <Loading />}
      <div className="clink-form form-subcontractor">
        <Grid container spacing={2}>
          <Grid size={6}>
            <FieldHolder
              label="Company name"
              name="company_name"
              error={company_nameError}
            >
              <IconWrapper>
                <TextField
                  variant="outlined"
                  name="company_name"
                  className="company_name"
                  value={company_name}
                  onChange={handleCompanyName}
                  type="text"
                  InputProps={{ readOnly: isNonUk ? false : Boolean(accountData) }}
                />
                {hasAccount && <InputIcon />}
              </IconWrapper>
            </FieldHolder>
          </Grid>

          <Grid size={6}>
            <FieldHolder
              label={"Company registration number"}
              name="reg_number"
              error={reg_numberError}
              required={!isNonUk}
            >
              <TextField
                variant="outlined"
                name="reg_number"
                className="reg_number"
                value={reg_number}
                onChange={handleRegNumber}
                type="text"
                InputProps={{ readOnly: isNonUk ? false : Boolean(accountData) }}
              />
            </FieldHolder>
          </Grid>

          <Grid size={6}>
            <FormControl sx={{ ml: 1, mb: 3 }} fullWidth>
              <MuiInputLabel>{i18next.t('profile-firstname')}</MuiInputLabel>
              <TextField
                variant="outlined"
                name="firstname"
                value={firstname}
                onChange={handleFirstName}
                type="text"
                error={Boolean(firstnameError?.firstname)}
                helperText={firstnameError?.firstname}
                onKeyDown={(e) => e.stopPropagation()}
                InputProps={{
                  readOnly: hasAccount && existingSubcontractor,
                }}
              />
            </FormControl>
          </Grid>

          <Grid size={6}>
            <FormControl sx={{ ml: 1, mb: 3 }} fullWidth>
              <MuiInputLabel>{i18next.t('profile-lastname')}</MuiInputLabel>
              <TextField
                variant="outlined"
                name="lastname"
                value={lastname}
                onChange={handleLastName}
                type="text"
                error={Boolean(lastnameError?.lastname)}
                helperText={lastnameError?.lastname}
                onKeyDown={(e) => e.stopPropagation()}
                InputProps={{
                  readOnly: hasAccount && existingSubcontractor,
                }}
              />
            </FormControl>
          </Grid>

          <Grid size={12}>
            <FormControl sx={{ ml: 1 }} fullWidth>
              <MuiInputLabel>{i18next.t('login-email')}</MuiInputLabel>
              <TextField
                variant="outlined"
                name="email"
                value={email}
                onChange={handleEmail}
                type="email"
                error={Boolean(emailError?.email)}
                helperText={emailError?.email}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </FormControl>
          </Grid>

          <Grid size={6}>
            <FieldHolder
              label={"Phone number"}
              name="phone"
              error={phoneError}
              required={!isNonUk}
            >
              <TextField
                variant="outlined"
                name="phone"
                className="phone"
                value={phone}
                onChange={handlePhone}
                type="text"
                InputProps={{
                  readOnly: hasAccount && existingSubcontractor,
                }}
              />
            </FieldHolder>
          </Grid>

          <Grid size={6}>
            <FieldHolder
              label="Address"
              name="address"
              error={addressError}
              full
            >
              <TextField
                variant="outlined"
                name="address"
                className="address"
                value={address}
                onChange={handleAddress}
                type="text"
                InputProps={{
                  readOnly: isNonUk ? false :
                    Boolean(accountData) &&
                    accountData.country &&
                    ANZ_CODE_REGIONS.includes(accountData.country.code) ===
                      false,
                }}
              />
            </FieldHolder>
          </Grid>

          <Grid size={6}>
            <SearchableMultiSelectField
              label="Assign trades"
              name="trades"
              error={tradesError}
              options={tradesProps}
              value={trades}
              onChange={handleTrades}
            />
          </Grid>

          <Grid size={6}>
            <SearchableMultiSelectField
              label="Locations"
              name="locations"
              error={locationsError}
              options={regions}
              value={locations}
              onChange={handleLocations}
            />
          </Grid>

          <Grid size={12} container justifyContent="flex-end" mt={2.5}>
            <Grid>
              <CloseButton backPage={handleBack} />
            </Grid>
            <Grid>
              {savedSubcontractor ? (
                <SubcontractorSubmitButton
                  isDisabled={disableSubmit}
                  handleSubmit={handleSubmit}
                />
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={disableSubmit}
                >
                  {i18next.t('sc-add')}
                </Button>
              )}
            </Grid>
          </Grid>
        </Grid>
      </div>
    </>
  );
};

export default FormSubcontractor;
