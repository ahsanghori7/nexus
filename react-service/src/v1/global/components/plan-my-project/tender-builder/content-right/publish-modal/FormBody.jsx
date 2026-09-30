import React from 'react';
import * as Yup from 'yup';
import { patchData } from 'services/clinkHelpers';
import ClinkForm from '../../../../clink-form';
import PublishService from '../../../../../services/plan-my-project/tender-builder/Publish';
import GreenButton, { CloseButton } from '../../../../general-ui/Buttons';

const SubmitButton = (props) => (
  <GreenButton {...props} label="Publish" plusIcon={false} />
);

const FormBody = ({
  isPS = false,
  setShow,
  pid,
  tid = 0,
  formSubmitted,
  setFormSubmitted,
  openProjectsDashboard,
}) => {
  const publishService = new PublishService(pid);
  const {
    initialValues,
    formFields: fields,
    validationSchema,
    submit,
    alert: serviceAlert,
  } = publishService;
  let submitForm = (data, actions, options) =>
    submit(data, actions, options)
      .then((response) => {
        if (response.success) {
          setFormSubmitted(true);
        } else {
          serviceAlert(response);
        }
      })
      .catch(serviceAlert);
  if (isPS) {
    submitForm = () =>
      patchData('tender', 'publishMarketplace', {}, { tid })
        .then((result) =>
          result.status === 200 ? result.json() : result.status,
        )
        .then((response) => {
          if (response.success) {
            setFormSubmitted(true);
          } else {
            serviceAlert(response);
          }
        })
        .catch(serviceAlert);
  }
  const closeText = formSubmitted ? 'Done' : 'Go back';
  const myOpenProjectsDashboard =
    openProjectsDashboard || (() => setShow(false));
  const handleClick = formSubmitted ? myOpenProjectsDashboard : () => null;
  const variant = formSubmitted ? 'success' : 'outline-dark';
  // eslint-disable-next-line react/no-unstable-nested-components
  const AuxButton = () => (
    <CloseButton
      setShow={setShow}
      onClick={handleClick}
      closeText={closeText}
      variant={variant}
    />
  );
  const myInitialValues = isPS ? {} : initialValues;
  const myFormFields = isPS ? [] : fields;
  const myValidationSchema = isPS ? Yup.object().shape({}) : validationSchema;
  return formSubmitted ? (
    <div className="submit-button-holder">
      <AuxButton />
    </div>
  ) : (
    <ClinkForm
      initialValues={myInitialValues}
      formFields={myFormFields}
      validationSchema={myValidationSchema}
      handleSubmit={submitForm}
      SubmitButton={SubmitButton}
      AuxButton={AuxButton}
    />
  );
};

export default FormBody;
