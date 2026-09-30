import React from 'react';
import {
  CompanyFirstName,
  CompanyLastName,
  CompanyEmail,
  CompanyLandlineNumber,
  CompanyLinkedInUrl,
  CompanyMobileNumber,
  CompanyName,
  CompanyNumber,
  CompanyOperatingAddress,
  CompanyRegisteredAddress,
  CompanyStatus,
  CompanyWebsiteUrl,
  CompanyVatRegistration,
  EnableOperatingAddress,
} from '../inputs';
import { StyledInnerWrapper } from '../../Theme.styled';
import { StyledDetailsColumns } from './styled';

const AdminCompanyPage = ({
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
    <StyledDetailsColumns className="company-details-form-wrapper-left">
      <StyledInnerWrapper className="two-input-wrapper">
        <CompanyFirstName register={register} errors={errors} value={data} />
        <CompanyLastName register={register} errors={errors} value={data} />
      </StyledInnerWrapper>
      <StyledInnerWrapper className="two-input-wrapper">
        <CompanyName register={register} errors={errors} value={data} />
        <CompanyEmail register={register} errors={errors} value={data} />
      </StyledInnerWrapper>
      <StyledInnerWrapper>
        <CompanyMobileNumber register={register} errors={errors} value={data} />
      </StyledInnerWrapper>
      <StyledInnerWrapper>
        <CompanyLandlineNumber
          register={register}
          errors={errors}
          value={data}
        />
      </StyledInnerWrapper>
      <StyledInnerWrapper className="two-input-wrapper">
        <CompanyWebsiteUrl register={register} errors={errors} value={data} />
        <CompanyLinkedInUrl register={register} errors={errors} value={data} />
      </StyledInnerWrapper>
    </StyledDetailsColumns>
    <StyledDetailsColumns className="company-details-form-wrapper-right">
      <StyledInnerWrapper className="two-input-wrapper">
        <CompanyNumber register={register} errors={errors} value={data} />
        <CompanyStatus register={register} errors={errors} value={data} />
      </StyledInnerWrapper>
      <StyledInnerWrapper>
        <CompanyVatRegistration
          register={register}
          errors={errors}
          value={data}
        />
      </StyledInnerWrapper>
      <StyledInnerWrapper>
        <CompanyRegisteredAddress
          register={register}
          errors={errors}
          value={data}
          type="textarea"
        />
      </StyledInnerWrapper>
      <StyledInnerWrapper className="operating-company-address">
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
          type="textarea"
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
                setValue(
                  'operating_company_address',
                  getValues('registered_address')
                );
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
    </StyledDetailsColumns>
  </>
);

export default AdminCompanyPage;
