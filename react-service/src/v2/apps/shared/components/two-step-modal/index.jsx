import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalContent } from 'clink-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Reusable Two-Step Modal Component
 *
 * @param {Object} props
 * @param {string} props.title - Modal title
 * @param {React.Component} props.Step1Component - Component for Step 1
 * @param {React.Component} props.Step2Component - Component for Step 2
 * @param {Object} props.step1Props - Props to pass to Step 1 component
 * @param {Object} props.step2Props - Props to pass to Step 2 component
 * @param {React.Element} props.openElement - Custom open element for the modal
 * @param {Function} props.onComplete - Callback when the form is completed
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} props.className - Additional CSS class
 * @param {string|number} props.width - Modal width (default: 'auto')
 */
const TwoStepModal = ({
  title,
  Step1Component,
  Step2Component,
  step1Props = {},
  step2Props = {},
  openElement,
  onClose,
  className = 'two-step-modal',
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleReset = () => {
    setStep(1);
    setFormData({});
  };

  const handleStep1Complete = (data) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };


  const handleBack = () => {
    setStep(1);
  };

  const handleModalClose = () => {
    handleReset();
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      className={className}
      openElement={openElement}
      onClose={handleModalClose}
      render={(modalProps) => (
        <ModalContent >
          <Box
            className=""
            sx={{position:'relative'}}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
              }}
            >
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                }}
              >
                {title}
              </Typography>
              <IconButton
                onClick={() => {
                  modalProps.handleClose();
                  handleModalClose();
                }}
                sx={{
                  color: '#666',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  position:'absolute',
                  top: '-22px',
                  right: '-24px'
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {step === 1 && (
              <Step1Component
                {...step1Props}
                onNext={handleStep1Complete}
                onCancel={() => {
                  modalProps.handleClose();
                  handleModalClose();
                }}
                initialData={formData}
              />
            )}

            {step === 2 && (
              <Step2Component
                {...step2Props}
                onBack={handleBack}
                onCancel={() => {
                  modalProps.handleClose();
                  handleModalClose();
                }}
                formData={formData}
              />
            )}
          </Box>
        </ModalContent>
      )}
    />
  );
};

TwoStepModal.propTypes = {
  title: PropTypes.string.isRequired,
  Step1Component: PropTypes.elementType.isRequired,
  Step2Component: PropTypes.elementType.isRequired,
  step1Props: PropTypes.object,
  step2Props: PropTypes.object,
  openElement: PropTypes.element.isRequired,
  onComplete: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TwoStepModal;
