import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DateComponent from 'v2/apps/shared/components/prequalification/v2/form/Date';
import Select from 'v2/apps/shared/components/prequalification/v2/form/Select';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import File from 'v2/apps/shared/components/prequalification/v2/form/file';
import { TYPES, OTHER_CERTIFICATE_DOC, CV } from 'v2/helpers/prequal/documents';
import useOtherInput from './useOtherInput';

const HealthSafetyEnvironmentalQualifications = ({
  data,
  selectedOptions = [],
  options = [],
  documentsForm,
  aid,
}) => {
  const { t } = useTranslation();
  const { values, errors, trigger, register, setValue } = documentsForm;
  const showExp = data && data.label && data.label && [CV].includes(data.label);
  const [showExpirationDate, setShowExpirationDate] = useState(showExp);
  const { date: currentDate, document: currentDocument, label } = values;
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    TYPES.HSEQ,
    options,
    selectedOptions,
    documentsForm,
  );

  const today = new Date();
  const requested = data && data.requested;
  let defaultValue = data && data.label ? data.label : '';
  if (otherValue) {
    defaultValue = OTHER_CERTIFICATE_DOC;
  }
  const idDoc = data && data.id;
  const document = data && data.document;
  const getDocInfo = [document, aid, idDoc];

  return (
    <>
      <Select
        name="label"
        label={t('type')}
        register={register}
        errors={errors}
        options={options.map((o) => ({
          ...o,
          disabled:
            selectedOptions.includes(o.label.toLocaleLowerCase()) ||
            Boolean(data && data.id) ||
            requested,
        }))}
        defaultValue={defaultValue}
        handleChange={(selectedOption) => {
          handleOther(selectedOption);
          if ([CV].includes(selectedOption.target.value)) {
            setShowExpirationDate(true);
          } else {
            setShowExpirationDate(false);
          }
        }}
      />

      {(other || values.label === OTHER_CERTIFICATE_DOC) && (
        <Text
          name="custom_label"
          label={t('custom-type')}
          register={register}
          errors={errors}
          validate={validateTextField}
          value={label}
          required
        />
      )}
      {!showExpirationDate && (
        <DateComponent
          name="date"
          label={t('insurances-date')}
          errors={errors}
          trigger={trigger}
          register={register}
          setValue={setValue}
          value={currentDate}
          minDate={today}
          requiredDate={false}
        />
      )}
      <File
        name="document"
        label={t('upload-health-safety-environmental-qualifications')}
        errors={errors}
        register={register}
        setValue={setValue}
        value={currentDocument}
        getDocInfo={getDocInfo}
        originalFile={data?.original_file}
      />
    </>
  );
};

export default HealthSafetyEnvironmentalQualifications;
