import React from 'react';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Loading from 'v1/global/components/Loading';
import FieldHolder from './FieldHolder';
import { CloseButton, SubcontractorSubmitButton } from './Buttons';
import InputIcon, { IconWrapper } from './InputIcon';
import hooks from './hooks';
import SubcontractorContacts from './contacts/SubcontractorContacts';
import Divider from '@mui/material/Divider';
import SearchableMultiSelectField from './SearchableMultiSelectField';

const ANZ_CODE_REGIONS = ['NZ', 'AUS'];

const FormSubcontractorNew = ({
  formData,
  onSubmit,
  regions,
  trades: tradesProps,
  hasAccountProp,
  accountData,
  closeModal,
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

  const disableSubmit =
    !company_name || !address || !trades.length || !locations.length;

  const mainData =
    trades?.length === 0 && locations?.length === 0
      ? {}
      : {
          reg_number,
          trades: trades?.map((trade) => Number(trade.id)),
          locations: locations?.map((location) => Number(location.id)),
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
                  InputProps={{ readOnly: Boolean(accountData) }}
                />
                {hasAccount && <InputIcon />}
              </IconWrapper>
            </FieldHolder>
          </Grid>

          <Grid size={6}>
            <FieldHolder
              label="Company registration number"
              name="reg_number"
              error={reg_numberError}
            >
              <TextField
                variant="outlined"
                name="reg_number"
                className="reg_number"
                value={reg_number}
                onChange={handleRegNumber}
                type="text"
                InputProps={{ readOnly: Boolean(accountData) }}
              />
            </FieldHolder>
          </Grid>

          <Grid size={12}>
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
                  readOnly:
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

          <Grid size={12} container justifyContent="flex-end" mt={1.5}>
            <Grid>
              <SubcontractorSubmitButton
                isDisabled={disableSubmit}
                handleSubmit={handleSubmit}
              />
            </Grid>
          </Grid>

          <Grid size={12}>
            <Divider sx={{ mt: 4, mb: 2 }} />
            <SubcontractorContacts
              companyName={company_name}
              subcontractorId={formData.id}
              mainData={mainData}
            />
            <Divider sx={{ mt: 2 }} />
          </Grid>

          <Grid size={12} container justifyContent="flex-end" mt={1.5}>
            <Grid>
              <CloseButton backPage={closeModal} label="Close" />
            </Grid>
          </Grid>
        </Grid>
      </div>
    </>
  );
};

export default FormSubcontractorNew;
