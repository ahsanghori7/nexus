import React, { useState } from 'react';
import { Button, Panel, Form as ClinkForm } from 'clink-components';
import { useTranslation } from 'react-i18next';
import CircularProgress from '@mui/material/CircularProgress';
import ProsperCompanyPage from './themes/prosper';
import AdminCompanyPage from './themes/admin';
import { StyledWithMarginAndLoader, StyledWrapper } from '../Theme.styled';

const CompanyDetails = ({ data, contextType, handleUpdate, loading }) => {
  const { t } = useTranslation();
  const checked = data.registered_address === data.operating_company_address;
  const manualMode = data.operating_company_address !== '';
  const [operatingAddressChecked, setOperatingAddressChecked] =
    useState(checked);
  const [dirty, setDirty] = useState(false);

  return (
    <Panel
      className="company-details"
      headerContent={<h2>{t('profile-company-details')}</h2>}
    >
      <ClinkForm
        disableUntilValid
        defaultValues={data}
        method="POST"
        onSubmit={handleUpdate}
        render={(formHook) => {
          const { formState, register, setValue, trigger, control, getValues } =
            formHook;
          const { errors, isDirty, isValid } = formState;
          const formDirty = isDirty || dirty;
          const disabledSubmit = !formDirty || !isValid;
          return (
            <StyledWrapper>
              {contextType === 'prosper' && (
                <ProsperCompanyPage
                  data={data}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getValues={getValues}
                  checked={operatingAddressChecked}
                  changeChecked={setOperatingAddressChecked}
                  trigger={trigger}
                  control={control}
                  manualMode={manualMode}
                  setDirty={setDirty}
                />
              )}
              {contextType === 'adminProsper' && (
                <AdminCompanyPage
                  data={data}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getValues={getValues}
                  checked={operatingAddressChecked}
                  changeChecked={setOperatingAddressChecked}
                  trigger={trigger}
                  control={control}
                  manualMode={manualMode}
                  setDirty={setDirty}
                />
              )}
              <StyledWithMarginAndLoader>
                {loading && <CircularProgress className="my-company-loading" />}
                <Button
                  id="submit-button"
                  type="submit"
                  layout="square"
                  color="prosperGreenButton"
                  disabled={disabledSubmit}
                  data-testid="details-button-save"
                >
                  {t('save')}
                </Button>
              </StyledWithMarginAndLoader>
            </StyledWrapper>
          );
        }}
      />
    </Panel>
  );
};

export default CompanyDetails;
