import React from 'react';
import Button from '@mui/material/Button';
import { LoadingV2 } from 'v1/global/components/Loading';

import ClinkForm from 'v1/global/components/clink-form';
import GlobalModal from 'v1/global/components/modal/v2';

const ButtonRenderer = (content, props, test = 'primary') => {
  const { loading, enableLoading, ...rest } = props;
  const buttonData = rest || {};
  return (
    <Button
      className={test}
      color={test}
      variant="contained"
      {...buttonData}
      disabled={(enableLoading && loading) || props?.disabled}
    >
      {enableLoading && loading && <LoadingV2 />}
      {((enableLoading && !loading) || !enableLoading) && content}
    </Button>
  );
};

const modalRenderer = (title, subtitle, button, renderer) => {
  return (
    <GlobalModal
      title={title}
      subtitle={subtitle}
      ShowButton={button}
      render={renderer}
    />
  );
};

const formRenderer = (
  form,
  buttons,
  submit,
  render = null,
  extraBody = null,
) => {
  const { initialValues, formFields, validationSchema } = form;
  const { submitButton, closeButton } = buttons;

  return (
    <ClinkForm
      initialValues={initialValues}
      formFields={formFields}
      validationSchema={validationSchema}
      handleSubmit={(data) => {
        submit(data);
      }}
      render={render}
      submitText="Continue"
      SubmitButton={submitButton}
      AuxButton={closeButton}
      extraBody={extraBody}
    />
  );
};

export { modalRenderer, formRenderer, ButtonRenderer };
