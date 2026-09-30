import React from 'react';
import { ErrorMessage, Field } from 'formik';
import Dropzone from '../../../dropzone';
import FieldError from '../../FieldError';
import FieldHolder from '../../FieldHolder';
import AddDropzoneModal from './add-dropzone-modal';

const DropzoneField = ({
  id,
  name,
  className = '',
  label = null,
  handleChange = null,
  handleBlur = null,
  validationFieldSchema = {},
  setFieldValue,
  required,
  handleSetDropzone,
  handleDeleteCategory,
  value = null,
  fetch = null,
  removeFile = null,
  callback = null,
  fieldName,
  ...restProps
}) => (
  <Field name={name} validate={validationFieldSchema[name]}>
    {({ field }) => {
      const checkValues =
        (restProps &&
          restProps.values &&
          restProps.values.filter((f) => f.label === label)) ||
        [];
      const { value: fieldValue, ...rest } = field;
      const input = {
        ...rest,
        id,
        value: value || fieldValue,
        onChange: handleChange || field.onChange,
        onBlur: handleBlur || field.onBlur,
        label,
        required,
        setFieldValue,
        handleSetDropzone,
        handleDeleteCategory,
        fetch,
        removeFile,
        callback,
        fieldName,
      };
      return (
        <FieldHolder className={className}>
          <Dropzone
            inputProps={input}
            checkValues={checkValues}
            handleDeleteCategory={handleDeleteCategory}
            setFieldValue={setFieldValue}
            value={value}
            fieldName={fieldName}
          />
          <ErrorMessage name={field.name}>
            {(msg) => <FieldError msg={msg} />}
          </ErrorMessage>
        </FieldHolder>
      );
    }}
  </Field>
);

export default DropzoneField;
export { AddDropzoneModal };
