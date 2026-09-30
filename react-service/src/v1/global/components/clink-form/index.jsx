import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import { Button } from 'react-bootstrap';
import Inputs from './inputs';
import FieldHolder from './FieldHolder';

const Body = ({
  status,
  errors,
  callback,
  className,
  formFields,
  values,
  setFieldValue,
  validationFieldSchema,
  Content,
  formVariables,
  isSubmitting,
  SubmitButton,
  submitText,
  AuxButton,
  extraProps,
  customErrors,
  triggerCustomErrors,
  extraBody,
}) =>
  status ? (
    callback()
  ) : (
    <Form className={`clink-form ${className}`}>
      {Content ? (
        <Content
          formFields={formFields}
          values={values}
          errors={errors}
          setFieldValue={setFieldValue}
          validationFieldSchema={validationFieldSchema}
          formVariables={formVariables}
          {...extraProps}
        />
      ) : (
        <Inputs
          formFields={formFields}
          values={values}
          errors={errors}
          setFieldValue={setFieldValue}
          validationFieldSchema={validationFieldSchema}
          customErrors={customErrors}
          triggerCustomErrors={triggerCustomErrors}
          {...extraProps}
        />
      )}
      {extraBody}
      <FieldHolder className="submit-button-holder">
        <AuxButton />
        <SubmitButton type="submit" disabled={isSubmitting}>
          {submitText}
        </SubmitButton>
      </FieldHolder>
    </Form>
  );

const CLinkForm = ({
  initialValues,
  formFields,
  validationSchema,
  validationFieldSchema = {},
  handleSubmit,
  callback = () => 'Submit success!',
  className = '',
  submitText = 'Submit',
  validateOnChange = true,
  validateOnBlur = true,
  triggerCustomErrors = false,
  manualTriggerCustomErrors = false,
  enableReinitialize = false,
  SubmitButton = Button,
  AuxButton = () => null,
  Content = null,
  extraProps = {},
  initialTouched = {},
  render,
  extraBody = null,
}) => (
  <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    onSubmit={handleSubmit}
    validateOnChange={validateOnChange}
    validateOnBlur={validateOnBlur}
    enableReinitialize={enableReinitialize}
    validateOnMount={false}
    initialTouched={initialTouched}
  >
    {(formVariables) => {
      const {
        values,
        errors,
        isSubmitting,
        status,
        setFieldValue,
        validateForm,
        dirty,
      } = formVariables;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [customErrors, setCustomErrors] = useState({});
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        validateForm()
          .then(setCustomErrors)
          .catch(() => setCustomErrors({}));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [triggerCustomErrors, manualTriggerCustomErrors]);

      let newFormikErrors = {};
      let newCustomErrors = {};
      if (dirty) {
        newFormikErrors = errors;
        newCustomErrors = customErrors;
      }
      return render ? (
        render({
          values,
          errors: newFormikErrors,
          isSubmitting,
          status,
          setFieldValue,
          validateForm: formVariables.validateForm,
          setFieldTouched: formVariables.setFieldTouched,
          formVariables,
        })
      ) : (
        <Body
          status={status}
          errors={newFormikErrors}
          callback={callback}
          className={className}
          formFields={formFields}
          values={values}
          setFieldValue={setFieldValue}
          validationFieldSchema={validationFieldSchema}
          Content={Content}
          formVariables={formVariables}
          isSubmitting={isSubmitting}
          SubmitButton={SubmitButton}
          submitText={submitText}
          AuxButton={AuxButton}
          extraProps={extraProps}
          customErrors={newCustomErrors}
          triggerCustomErrors={triggerCustomErrors}
          extraBody={extraBody}
        />
      );
    }}
  </Formik>
);

export default CLinkForm;
export { Body };
