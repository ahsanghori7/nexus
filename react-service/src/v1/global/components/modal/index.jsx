import React from 'react';
import BModal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';

class Modal extends React.Component {
  constructor(props) {
    super(props);

    const { beginningShow } = props;

    this.state = {
      show: beginningShow ?? false,
    };
    this.setShow = this.setShow.bind(this);
  }

  setShow(show) {
    this.setState({ show });
  }

  render() {
    const { show } = this.state;
    const {
      title,
      subtitle,
      buttonContent,
      className,
      dialogClassName,
      ShowButton,
      backdrop,
      children,
      render,
      showClose,
      onHide,
      testId,
    } = this.props;

    return (
      <>
        <ShowButton
          variant="primary"
          size="sm"
          content={buttonContent || title}
          handleClick={() => this.setShow(true)}
        />

        <BModal
          data-testid={testId}
          show={show}
          onHide={() => {
            this.setShow(false);
            if (onHide) {
              onHide();
            }
          }}
          className={className}
          backdrop={backdrop}
          dialogClassName={dialogClassName}
          aria-labelledby="custom-modal"
        >
          {!isNil(title) && (
            <BModal.Header closeButton={showClose}>
              <BModal.Title data-testid="title" id="custom-modal">
                {title}
                {subtitle && <div data-testid="subtitle" className="modal-subtitle">{subtitle}</div>}
              </BModal.Title>
            </BModal.Header>
          )}
          <BModal.Body>{render ? render(this) : children}</BModal.Body>
        </BModal>
      </>
    );
  }
}

const DefaultButton = ({ handleClick, content, ...rest }) => (
  <Button {...rest} onClick={handleClick}>
    {content}
  </Button>
);

Modal.defaultProps = {
  title: 'Modal',
  subtitle: null,
  buttonContent: null,
  className: '',
  backdrop: true,
  dialogClassName: '',
  ShowButton: DefaultButton,
  showClose: true,
  testId: undefined,
};

Modal.propTypes = {
  testId: PropTypes.string,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  subtitle: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  buttonContent: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.object,
  ]),
  className: PropTypes.string,
  backdrop: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  dialogClassName: PropTypes.string,
  ShowButton: PropTypes.func,
  showClose: PropTypes.bool,
};

export default Modal;
