import React, { useRef } from 'react';
import { Controller } from 'react-hook-form';
import i18next from 'v2/helpers/i18n';
import {
  CompanyLandlineNumber,
  CompanyLinkedInUrl,
  CompanyMobileNumber,
  CompanyEmail,
  CompanyOperatingAddress,
  CompanyRegisteredAddress,
  CompanyWebsiteUrl,
  CompanyVatRegistration,
  EnableOperatingAddress,
  CompanyStrapline,
} from './inputs';
import Editor from 'v2/apps/shared/components/editor';
import { EditorWrapper, TwoFieldsWrapper } from './styled';

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
  isUK,
}) => {
  const quillRef = useRef(null);

  return (
    <>
      <CompanyEmail register={register} errors={errors} value={data} />
      <CompanyRegisteredAddress
        register={register}
        errors={errors}
        value={data}
      />

      <TwoFieldsWrapper>
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
          isUK={isUK}
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
                  data.operating_company_address,
                );
              }
              trigger(['operating_company_address']);
              changeChecked(newChecked);
            },
          }}
        />
      </TwoFieldsWrapper>

      <CompanyLandlineNumber register={register} errors={errors} value={data} />
      <CompanyMobileNumber register={register} errors={errors} value={data} />
      <CompanyWebsiteUrl register={register} errors={errors} value={data} />
      <CompanyLinkedInUrl register={register} errors={errors} value={data} />
      <CompanyVatRegistration
        register={register}
        errors={errors}
        value={data}
      />
      <CompanyStrapline register={register} errors={errors} value={data} />
      <EditorWrapper label={i18next.t('profile-company-description')}>
        <Controller
          name="description"
          control={control}
          defaultValue={data?.description || ''}
          render={({ field }) => (
            <Editor
              ref={quillRef}
              defaultValue={data?.description || ''}
              onTextChange={() => {
                const html = quillRef.current?.root?.innerHTML || '';
                field.onChange(html);
                setValue('description', html);
                trigger('description');
              }}
              readOnly={false}
            />
          )}
        />
      </EditorWrapper>
    </>
  );
};

export default ProsperCompanyPage;
