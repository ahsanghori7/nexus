import React from 'react';
import { goTo } from 'v2/helpers/url';
import { PublishModalButton } from './publish-modal';
import ForwardRefButton from './ForwardRefButton';

const afterDescription = (
  <span>
    Now that your packages are saved, you can proceed to the procurement
    schedule.
  </span>
);

const beforeDescription = (
  <span>
    Save before continuing to the procurement schedule, where you can send the
    work packages to your supply chain or advertise them in our marketplace.
  </span>
);

const ActionButtons = ({
  projectIsValid,
  handleValidationForm,
  savePackagesRef,
  slug,
}) => (
  <div className="tender-packages-actions container">
    <div className="row">
      <div className="col-6">
        <ForwardRefButton
          onClick={handleValidationForm}
          on
          variant="primary"
          innerRef={savePackagesRef}
          data-testid="work-packages-save-button"
        >
          Save packages
        </ForwardRefButton>
      </div>
      <div className="col-6">
        <PublishModalButton
          sx={{ fontSize: '0.80rem' }}
          handleClick={() =>
            goTo(`/main-contractor/project/${slug}/procurement_schedule`)
          }
          variant={projectIsValid ? 'contained' : 'outlined'}
          disabled={!projectIsValid}
          label="Proceed to Procurement Schedule"
          data-testid="work-packages-proceed-button"
        />
      </div>
    </div>
    <div className="row">
      <div className="col-12">
        {projectIsValid ? afterDescription : beforeDescription}
      </div>
    </div>
  </div>
);

export default ActionButtons;
