import React from 'react';

const ProgressBarStepper = (props) => {
  const { steps, activeStep, progressTitle, hiddenSteppers } = props;

  const stepIndicators = steps
    .filter((_step, index) => !hiddenSteppers.includes(index))
    .map((step, index) => {
      const innerClassName = `${
        index === steps.length - 1
          ? 'progress-step-bar-inner-last'
          : 'progress-step-bar-inner'
      }`;
      const firstItem = index === 0 && 'first';
      const lastItem = index === steps.length - 2 && 'last';
      const active = activeStep === index && 'active';
      const completed = activeStep > index && 'completed';

      return (
        <div key={step} className={innerClassName}>
          {index === steps.length - 1 && (
            <div className={`progress-step-bar-label last ${active}`}>
              <span className={`progress-step-bar-label-title ${active}`}>
                {step}
              </span>
            </div>
          )}

          {index < steps.length - 1 && (
            <>
              <div className={`progress-step-bar-label ${active}`}>
                <span className={`progress-step-bar-label-title ${active}`}>
                  {step}
                </span>
                <span className="progress-step-bar-label-gt">&gt;</span>
                <span className="progress-step-bar-label-gt blank" />
              </div>
              <div
                className={`progress-step-bar-line ${lastItem} ${firstItem} ${completed} ${active}`}
              />
            </>
          )}
        </div>
      );
    });

  return (
    <div className="progress-step-bar">
      {progressTitle && (
        <div className="progress-step-bar-title">{progressTitle}</div>
      )}

      <div className="progress-step-bar-indicator">{stepIndicators}</div>
    </div>
  );
};

export default ProgressBarStepper;
