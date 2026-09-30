import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import DateComponent from 'v2/apps/shared/components/prequalification/v2/form/Date';
import Select from 'v2/apps/shared/components/prequalification/v2/form/Select';
import TextEditor from 'v2/apps/shared/components/prequalification/v2/form/TextEditor';
import File from 'v2/apps/shared/components/prequalification/v2/form/file';
import {
  TYPES,
  NOT_ISO_ACCREDITED,
  BS_EN_ISO_14001_2015,
  OTHER_CERTIFICATE_DOC,
} from 'v2/helpers/prequal/documents';
import useOtherInput from './useOtherInput';

const Environmental = ({
  data,
  selectedOptions = [],
  options = [],
  documentsForm,
  showOtherOptionForAll = false,
  aid,
}) => {
  const [showTextarea, setShowTextarea] = useState(false);
  const [showDateExpiration, setShowDateExpiration] = useState(false);

  const { t } = useTranslation();
  const { values, errors, trigger, register, setValue, control } =
    documentsForm;
  const { date: currentDate, document: currentDocument } = values;
  const requested = data && data.requested;
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    TYPES.EN,
    options,
    selectedOptions,
    documentsForm,
  );
  let defaultValue = data && data.label ? data.label : '';
  if (otherValue) {
    defaultValue = OTHER_CERTIFICATE_DOC;
  }
  const today = new Date();
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
          if (selectedOption.target.value === NOT_ISO_ACCREDITED) {
            setShowTextarea(true);
          } else {
            setShowTextarea(false);
          }

          if (selectedOption.target.value === BS_EN_ISO_14001_2015) {
            setShowDateExpiration(true);
          } else {
            setShowDateExpiration(false);
          }
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
      {(showDateExpiration || values.label === BS_EN_ISO_14001_2015) && (
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
      {showTextarea || values.label === NOT_ISO_ACCREDITED ? (
        <TextEditor
          register={register}
          setValue={setValue}
          errors={errors}
          trigger={trigger}
          control={control}
          label={t('environmental-not-accredited')}
        />
      ) : (
        <File
          name="document"
          label={t('upload-environmental')}
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

export default Environmental;
