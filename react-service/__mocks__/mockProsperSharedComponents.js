// Mock for prosper shared components
import React from 'react';

// Mock TokenModal component
export const TokenModal = (props) => {
  const { openElement, externalOpen, onHiddenModal, children, ...otherProps } = props;
  const [isOpen, setIsOpen] = React.useState(externalOpen || false);

  React.useEffect(() => {
    setIsOpen(externalOpen || false);
  }, [externalOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onHiddenModal) {
      onHiddenModal();
    }
  };

  return (
    <div {...otherProps} data-testid="token-modal-container">
      {openElement && (
        <div
          onClick={() => setIsOpen(true)}
          data-testid="token-modal-trigger"
        >
          {openElement}
        </div>
      )}
      {isOpen && (
        <div
          data-testid="token-modal"
          onClick={handleClose}
        >
          {children || 'Token Modal Content'}
        </div>
      )}
    </div>
  );
};

// Mock ProsperCarousel component
export const ProsperCarousel = (props) => {
  const { children, carouselProps = {}, ...otherProps } = props;
  return (
    <div {...otherProps} data-testid="prosper-carousel">
      {children}
    </div>
  );
};

// Mock ArrowButton component
export const ArrowButton = (props) => {
  const { nextItem, label, src, className, ...otherProps } = props;
  return (
    <button
      {...otherProps}
      onClick={nextItem}
      aria-label={label}
      className={className}
      data-testid="arrow-button"
    >
      <img src={src} alt={label} />
    </button>
  );
};

// Mock ButtonWrapper component
export const ButtonWrapper = ({ children, ...props }) => (
  <button {...props} data-testid="button-wrapper">{children}</button>
);

export default {
  TokenModal,
  ProsperCarousel,
  ArrowButton,
  ButtonWrapper,
};
