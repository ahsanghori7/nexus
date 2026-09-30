import React from 'react';
import { useTranslation } from 'react-i18next';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import DateComponent from 'v2/apps/shared/components/prequalification/v2/form/Date';
import Select from 'v2/apps/shared/components/prequalification/v2/form/Select';
import File from 'v2/apps/shared/components/prequalification/v2/form/file';
import { TYPES, OTHER_CERTIFICATE_DOC } from 'v2/helpers/prequal/documents';
import useOtherInput from './useOtherInput';

const Accreditations = ({
  data,
  selectedOptions = [],
  options = [],
  documentsForm,
  aid,
}) => {
  const { t } = useTranslation();
  const { values, errors, trigger, register, setValue } = documentsForm;
  const { date: currentDate, document: currentDocument } = values;
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    TYPES.CER,
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
        handleChange={handleOther}
      />
      {other && (
        <Text
          name="custom_label"
          label={t('custom-type')}
          register={register}
          errors={errors}
          validate={validateTextField}
          required
        />
      )}
      <DateComponent
        name="date"
        label={t('insurances-date')}
        errors={errors}
        trigger={trigger}
        register={register}
        setValue={setValue}
        value={currentDate}
        minDate={today}
      />
      <File
        name="document"
        label={t('upload-accreditation')}
        errors={errors}
        trigger={trigger}
        register={register}
        setValue={setValue}
        value={currentDocument}
        getDocInfo={getDocInfo}
        originalFile={data?.original_file}
      />
    </>
  );
};

export default Accreditations;
