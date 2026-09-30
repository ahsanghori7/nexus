import React from 'react';
import FieldRenderer from './FieldRenderer';

const Inputs = ({
  formFields,
  values,
  errors = {},
  autoSelectUniqueOption = false,
  setFieldValue,
  validationFieldSchema,
  handleChange,
  setValidations,
  fetch = null,
  removeFile = null,
  callback = null,
  customErrors = {},
  triggerCustomErrors = false,
  optionIsDisable = null,
  fileManagerButton = () => null,
}) =>
  formFields.map((field) => {
    return (
      <React.Fragment key={field.key || field.name}>
        <FieldRenderer
          autoSelectUniqueOption={autoSelectUniqueOption}
          callback={callback}
          customErrors={customErrors}
          errors={errors}
          fetch={fetch}
          field={field}
          fileManagerButton={fileManagerButton}
          handleChange={handleChange}
          optionIsDisable={optionIsDisable}
          removeFile={removeFile}
          setFieldValue={setFieldValue}
          setValidations={setValidations}
          triggerCustomErrors={triggerCustomErrors}
          validationFieldSchema={validationFieldSchema}
          values={values}
        />
      </React.Fragment>
    );
  });

export default Inputs;
