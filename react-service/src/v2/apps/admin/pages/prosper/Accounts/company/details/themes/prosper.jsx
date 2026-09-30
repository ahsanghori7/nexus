import React from 'react';
import {
  CompanyLandlineNumber,
  CompanyLinkedInUrl,
  CompanyMobileNumber,
  CompanyName,
  CompanyEmail,
  CompanyNumber,
  CompanyOperatingAddress,
  CompanyRegisteredAddress,
  CompanyWebsiteUrl,
  CompanyVatRegistration,
  EnableOperatingAddress,
} from '../inputs';
import { StyledInnerWrapper } from '../../Theme.styled';

const ProsperCompanyPage = ({
  data,
  register,
  errors,
  setValue,
  getValues,
  checked,
  changeChecked,
  trigger,
  control,
  manualMode,
  setDirty,
}) => (
  <>
    <StyledInnerWrapper>
      <CompanyName register={register} errors={errors} value={data} readOnly />
      <CompanyEmail register={register} errors={errors} value={data} />
    </StyledInnerWrapper>
    <StyledInnerWrapper>
      <CompanyRegisteredAddress
        register={register}
        errors={errors}
        value={data}
      />
    </StyledInnerWrapper>
    <StyledInnerWrapper>
      <CompanyOperatingAddress
        register={register}
        errors={errors}
        value={data}
        readOnly={checked}
        setValue={setValue}
        getValues={getValues}
        manualMode={manualMode}
        control={control}
        trigger={trigger}
        setDirty={setDirty}
      />
      <EnableOperatingAddress
        register={register}
        errors={errors}
        value={data}
        checked={checked}
        rules={{
          onChange: (e) => {
            const newChecked = e.currentTarget.checked;
            if (newChecked) {
              setValue('operating_company_address', data.registered_address);
            } else {
              setValue(
                'operating_company_address',
                data.operating_company_address
              );
            }
            trigger(['operating_company_address']);
            changeChecked(newChecked);
          },
        }}
      />
    </StyledInnerWrapper>
    <StyledInnerWrapper>
      <CompanyNumber
        register={register}
        errors={errors}
        value={data}
        readOnly
      />
    </StyledInnerWrapper>
    <StyledInnerWrapper>
      <CompanyLandlineNumber register={register} errors={errors} value={data} />
      <CompanyMobileNumber register={register} errors={errors} value={data} />
    </StyledInnerWrapper>
    <StyledInnerWrapper>
      <CompanyWebsiteUrl register={register} errors={errors} value={data} />
      <CompanyLinkedInUrl register={register} errors={errors} value={data} />
    </StyledInnerWrapper>
    <StyledInnerWrapper>
      <CompanyVatRegistration
        register={register}
        errors={errors}
        value={data}
      />
    </StyledInnerWrapper>
  </>
);

export default ProsperCompanyPage;
