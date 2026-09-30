import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import Select from 'v2/apps/shared/components/prequalification/v2/form/Select';
import TextEditor from 'v2/apps/shared/components/prequalification/v2/form/TextEditor';
import File from 'v2/apps/shared/components/prequalification/v2/form/file';
import DateComponent from 'v2/apps/shared/components/prequalification/v2/form/Date';
import {
  TYPES,
  NOT_ISO_ACCREDITED,
  ISO_90001,
  OTHER_CERTIFICATE_DOC,
} from 'v2/helpers/prequal/documents';
import useOtherInput from './useOtherInput';

const Quality = ({
  data,
  selectedOptions = [],
  options = [],
  documentsForm,
  showOtherOptionForAll = false,
  aid,
}) => {
  const { t } = useTranslation();
  const { values, errors, trigger, register, setValue, control } =
    documentsForm;
  const { document: currentDocument, date: currentDate } = values;
  const [showTextarea, setShowTextarea] = useState(
    data && data.label && data.label === NOT_ISO_ACCREDITED,
  );
  const [showExpiration, setShowExpiration] = useState(
    data && data.label && data.label === ISO_90001,
  );
  const requested = data && data.requested;
  const today = new Date();
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    TYPES.QU,
    options,
    selectedOptions,
    documentsForm,
  );
  const idDoc = data && data.id;
  const document = data && data.document;
  const getDocInfo = [document, aid, idDoc];
  let defaultValue = data && data.label ? data.label : '';
  if (otherValue) {
    defaultValue = OTHER_CERTIFICATE_DOC;
  }
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
          setShowTextarea(selectedOption.target.value === NOT_ISO_ACCREDITED);
          setShowExpiration(selectedOption.target.value === ISO_90001);
        }}
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
      {showExpiration && (
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
      )}
      {showTextarea ? (
        <TextEditor
          register={register}
          setValue={setValue}
          errors={errors}
          trigger={trigger}
          control={control}
          label={t('work-standard-500')}
        />
      ) : (
        <File
          name="document"
          label={t('upload-quality')}
          errors={errors}
          register={register}
          setValue={setValue}
          value={currentDocument}
          getDocInfo={getDocInfo}
          originalFile={data?.original_file}
        />
      )}
    </>
  );
};

export default Quality;
