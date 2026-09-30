import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Text from 'v2/apps/shared/components/prequalification/v2/form/Text';
import DateComponent from 'v2/apps/shared/components/prequalification/v2/form/Date';
import Money from 'v2/apps/shared/components/prequalification/v2/form/Money';
import Select from 'v2/apps/shared/components/prequalification/v2/form/Select';
import File from 'v2/apps/shared/components/prequalification/v2/form/file';
import { TYPES, OTHER_CERTIFICATE_DOC } from 'v2/helpers/prequal/documents';
import useOtherInput from './useOtherInput';

const createExtraDocument = (documents = [], created = []) =>
  documents
    ? documents.map((d) => {
        const [createdFile] = created
          ? created.filter((c) => c.label === d.name)
          : [];
        return {
          id: createdFile ? createdFile.id : d.id,
          label: createdFile ? createdFile.label : d.name,
          document: createdFile ? createdFile.document : null,
          original_file: createdFile ? createdFile.original_file : null,
        };
      })
    : [];

const Insurances = ({
  data,
  selectedOptions = [],
  options = [],
  documentsForm,
  showOtherOptionForAll = false,
  aid,
}) => {
  const { t } = useTranslation();
  const { values, errors, trigger, register, setValue, resetField } =
    documentsForm;
  const {
    price: currentPrice,
    date: currentDate,
    document: currentDocument,
    ...rest
  } = values;
  const [other, handleOther, otherValue, validateTextField] = useOtherInput(
    data,
    TYPES.INS,
    options,
    selectedOptions,
    documentsForm,
  );
  const today = new Date();

  // Check for extra documents from backend
  const restDataKeys = Object.keys(rest);
  const restDocumentsKeys = restDataKeys.filter((k) => k.includes('document'));
  const documentsAlreadyCreated = restDocumentsKeys.flatMap((k) => values[k]);

  // Check extra documents from options, skipping those that are already created
  const label = data && data.label ? data.label : '';
  const [optionWithExtraDocuments] = options
    .filter((o) => o.extra && o.label === label)
    .map((o) => o.extra);

  const [extraDocumentInputs, setExtraDocumentInputs] = useState(
    createExtraDocument(optionWithExtraDocuments, documentsAlreadyCreated),
  );

  const [deletedFiles, setDeletedFiles] = useState([]);

  const handleDelete = (fileName) => {
    setDeletedFiles((prev) => {
      const newList = [...prev, fileName];
      setValue('deleted', JSON.stringify(newList));
      return newList;
    });
  };

  const handleAddFile = (fileName) => {
    setDeletedFiles((prev) => {
      const newList = prev.filter((name) => name !== fileName);
      setValue('deleted', JSON.stringify(newList));
      return newList;
    });
  };

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
          const [selected] = options.filter(
            (s) => s.label === selectedOption.target.value,
          );

          if (selected) {
            setExtraDocumentInputs(createExtraDocument(selected.extra ?? []));
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
      <Money
        name="price"
        label={t('value')}
        register={register}
        errors={errors}
        value={currentPrice}
      />
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
        label={t('upload-insurance')}
        errors={errors}
        register={register}
        setValue={setValue}
        value={currentDocument}
        getDocInfo={getDocInfo}
        originalFile={data?.original_file}
      />
      {extraDocumentInputs &&
        extraDocumentInputs.map((extraDocInput) => {
          const extraDoc = extraDocInput && extraDocInput.document;
          const extraId = extraDocInput && extraDocInput.id;
          const valueExtraDoc =
            extraDoc && extraDocInput.original_file ? [extraDocInput] : [];
          const name =
            (extraDocInput && extraDocInput.inputName) ||
            `document-${extraDocInput.id}`;
          const getExtraDocInfo = [extraDoc, aid, extraId];
          return (
            extraDocInput && (
              <File
                key={extraDocInput.id}
                name={name}
                label={`Upload ${extraDocInput.label}`}
                errors={errors}
                resetField={resetField}
                register={register}
                setValue={setValue}
                value={valueExtraDoc}
                requiredFile={false}
                getDocInfo={getExtraDocInfo}
                originalFile={extraDocInput?.original_file}
                callbackDelete={handleDelete}
                callbackAddFile={handleAddFile}
              />
            )
          );
        })}
      <input
        type="hidden"
        {...register('deleted')}
        value={JSON.stringify(deletedFiles)}
      />
    </>
  );
};

export default Insurances;
