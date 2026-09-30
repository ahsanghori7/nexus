import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Button from 'react-bootstrap/Button';

const ForwardRefButton = React.forwardRef((props, ref) => (
  <Button {...props} ref={ref}>
    Save packages
  </Button>
));

/* eslint react/no-find-dom-node: "off" */
/* TODO: Monitor this solution, as it's quite hacky */
class CustomButton extends Component {
  componentDidMount() {
    ReactDOM.findDOMNode(this).addEventListener(
      'custom-event',
      this._handleCustomEvent,
    );
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this).removeEventListener(
      'custom-event',
      this._handleCustomEvent,
    );
  }

  _handleCustomEvent = (event) => {
    const { onClick } = this.props;
    onClick().then((response) => {
      if (response.success && event.detail) {
        event.detail();
      }
      return response;
    });
  };

  render() {
    const { innerRef, on, ...rest } = this.props;
    return (
      <ForwardRefButton {...rest} ref={innerRef}>
        Save packages
      </ForwardRefButton>
    );
  }
}

export default CustomButton;
