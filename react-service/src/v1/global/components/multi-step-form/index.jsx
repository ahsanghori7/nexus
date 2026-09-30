import React from 'react';
import PropTypes from 'prop-types';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import ProgressBarStepper from '../progress-bar-stepper';
import FormContent from './FormContent';

const StepperSelector = ({
  mode,
  progressTitle,
  steps,
  activeStep,
  title,
  hiddenSteppers,
}) => {
  return mode === 'legacy' ? (
    <Stepper className="stepper-desktop" activeStep={activeStep}>
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  ) : (
    <div className="progress-bar-stepper-container">
      <div className="progress-bar-stepper-title">{title}</div>
      <div className="progress-bar-stepper">
        <ProgressBarStepper
          progressTitle={progressTitle}
          steps={steps}
          activeStep={activeStep}
          hiddenSteppers={hiddenSteppers}
        />
      </div>
    </div>
  );
};

class MultiStepForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeStep: 0 };
    this.handleBack = this.handleBack.bind(this);
    this.setActiveStep = this.setActiveStep.bind(this);
  }

  handleBack() {
    const { activeStep } = this.state;
    const { stepCallback } = this.props;
    this.setActiveStep(activeStep - 1);
    if (stepCallback) {
      stepCallback(activeStep - 1);
    }
  }

  setActiveStep(activeStep) {
    const { stepCallback } = this.props;
    this.setState({ activeStep });
    if (stepCallback) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      stepCallback(activeStep);
    }
  }

  render() {
    const {
      steps,
      StepContent,
      className,
      service,
      finalStep,
      lastButtonCopy,
      mode,
      progressTitle,
      previousBtn,
      nextBtn,
      enableReinitialize,
      title,
      internalButtons,
      hiddenSteppers,
      ExtractedStep,
    } = this.props;
    const { activeStep } = this.state;
    const isLastStep = activeStep === steps.length - 1;
    const currentStep = activeStep + 1;
    service.setStepData(activeStep);
    const { initialValues, validationSchema, handleMultiFormSubmit } = service;
    return (
      <>
        <StepperSelector
          mode={`${!mode ? 'legacy' : mode}`}
          progressTitle={progressTitle}
          steps={steps}
          activeStep={activeStep}
          title={title}
          hiddenSteppers={hiddenSteppers}
        />
        {activeStep === steps.length ? (
            finalStep
          ) : (
            <FormContent
              initialValues={initialValues}
              validationSchema={validationSchema}
              handleSubmit={(values, actions) => {
                handleMultiFormSubmit(
                  values,
                  actions,
                  steps,
                  activeStep,
                  this.setActiveStep
                );
              }}
              activeStep={activeStep}
              enableReinitialize={enableReinitialize}
              className={className}
              currentStep={currentStep}
              StepContent={StepContent}
              service={service}
              handleBack={this.handleBack}
              setActiveStep={this.setActiveStep}
              internalButtons={internalButtons}
              previousBtn={previousBtn}
              isLastStep={isLastStep}
              lastButtonCopy={lastButtonCopy}
              nextBtn={nextBtn}
              ExtractedStep={ExtractedStep}
            />
          )}
      </>
    );
  }
}

MultiStepForm.defaultProps = {
  steps: [],
  StepContent: null,
  service: PropTypes.object,
  finalStep: 'Submission successful',
  lastButtonCopy: 'Send enquiry',
  previousBtn: 'Previous',
  nextBtn: 'Next step',
  title: null,
  internalButtons: true,
  enableReinitialize: false,
  hiddenSteppers: [],
};

MultiStepForm.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string),
  StepContent: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
    PropTypes.func,
  ]),
  service: PropTypes.object,
  finalStep: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  lastButtonCopy: PropTypes.string,
  previousBtn: PropTypes.string,
  nextBtn: PropTypes.string,
  title: PropTypes.element,
  internalButtons: PropTypes.bool,
  enableReinitialize: PropTypes.bool,
  hiddenSteppers: PropTypes.arrayOf(PropTypes.number),
  ExtractedStep: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
    PropTypes.func,
  ]),
};

export default MultiStepForm;
