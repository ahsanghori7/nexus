import React from 'react';
import { useTranslation } from 'react-i18next';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import Select from 'v2/apps/shared/components/prequalification/v2/form/Select';
import File from 'v2/apps/shared/components/prequalification/v2/form/file';
import { TYPES, OTHER_CERTIFICATE_DOC } from 'v2/helpers/prequal/documents';
import useOtherInput from './useOtherInput';

const HealthSafety = ({
  data,
  selectedOptions = [],
  options = [],
  documentsForm,
  showOtherOptionForAll = false,
  aid,
}) => {
  const { t } = useTranslation();
  const { values, errors, register, setValue } = documentsForm;
  const { document: currentDocument } = values;
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    TYPES.HS,
    options,
    selectedOptions,
    documentsForm,
  );
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
      {showOtherOptionForAll && other && (
        <Text
          name="custom_label"
          label={t('custom-type')}
          register={register}
          errors={errors}
          validate={validateTextField}
          required
        />
      )}
      <File
        name="document"
        label={t('upload-health-safety')}
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

export default HealthSafety;
