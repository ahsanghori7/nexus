import React from 'react';
import Button from 'react-bootstrap/Button';
import { Formik, Form } from 'formik';
import FieldHolder from '../clink-form/FieldHolder';
import Loading from '../Loading';

const InternalButtons = ({
  internalButtons,
  activeStep,
  handleBack,
  previousBtn,
  isSubmitting,
  isLastStep,
  lastButtonCopy,
  nextBtn,
}) => (
  <>
    {internalButtons && (
      <FieldHolder className="submit-button-holder">
        {activeStep !== 0 && (
          <Button variant="outline-danger" onClick={handleBack}>
            {previousBtn}
          </Button>
        )}
        <Button disabled={isSubmitting} type="submit" variant="success">
          {isLastStep ? lastButtonCopy : nextBtn}
        </Button>
      </FieldHolder>
    )}
    {internalButtons && isSubmitting && (
      <FieldHolder>
        <Loading />
      </FieldHolder>
    )}
  </>
);

const FormContent = ({
  initialValues,
  validationSchema,
  handleSubmit,
  activeStep,
  enableReinitialize,
  className,
  currentStep,
  StepContent,
  service,
  handleBack,
  setActiveStep,
  internalButtons,
  previousBtn,
  isLastStep,
  lastButtonCopy,
  nextBtn,
  ExtractedStep,
}) => (
  <>
    <div style={ExtractedStep ? { display: 'none' } : null}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={enableReinitialize}
      >
        {(formVariables) => (
          <Form
            id="form-id-unique"
            className={`clink-form ${className} ${className}__page-${currentStep}`}
          >
            <StepContent
              step={activeStep}
              formVariables={formVariables}
              service={service}
              handleBack={handleBack}
              setActiveStep={setActiveStep}
            />
            <InternalButtons
              internalButtons={internalButtons}
              activeStep={activeStep}
              handleBack={handleBack}
              previousBtn={previousBtn}
              isSubmitting={formVariables.isSubmitting}
              isLastStep={isLastStep}
              lastButtonCopy={lastButtonCopy}
              nextBtn={nextBtn}
            />
          </Form>
        )}
      </Formik>
    </div>
    {ExtractedStep && (
      <>
        {/* Extend implementation if more extracted steps
        are going to be implemented in the future */}
        <ExtractedStep handleBack={handleBack} />
        <InternalButtons
          internalButtons={internalButtons}
          activeStep={activeStep}
          handleBack={handleBack}
          previousBtn={previousBtn}
          isSubmitting={false}
          isLastStep={isLastStep}
          lastButtonCopy={lastButtonCopy}
          nextBtn={nextBtn}
        />
      </>
    )}
  </>
);

export default FormContent;
