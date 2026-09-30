import React from 'react';

class ClinkInput extends React.Component {
  constructor(props) {
    super(props);
    const { value } = props;
    this.state = {
      value: value || '',
      focused: false,
    };

    this.handleOnFocus = this.handleOnFocus.bind(this);
    this.handleOnChange = this.handleOnChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.renderValue = this.renderValue.bind(this);
  }

  handleOnFocus() {
    const { focus } = this.props;
    this.setState({ focused: true }, () => {
      if (focus) {
        focus(this);
      }
    });
  }

  handleOnChange(e) {
    const { change, validate, parser } = this.props;
    let { value } = e.target;
    if (validate && !validate(value)) {
      return;
    }

    if (parser) {
      value = parser(value);
    }

    this.setState((prev) => {
      const { value: oldValue } = prev;
      if (change) {
        change(value, oldValue);
      }

      return { value };
    });
  }

  handleKeyDown(e) {
    const { keydown } = this.props;
    if (keydown) {
      keydown(e, this);
    }
  }

  handleOnBlur() {
    const { blur } = this.props;
    this.setState({ focused: false }, () => {
      if (blur) {
        blur(this);
      }
    });
  }

  renderValue() {
    const { value, focused } = this.state;
    const { renderer, defaultValue } = this.props;

    if (!focused && !value && defaultValue) {
      return defaultValue;
    }

    if (renderer) {
      return renderer(value, this);
    }
    return value;
  }

  render() {
    const { name, type, className, disabled = false } = this.props;

    return (
      <input
        name={name}
        type={type || 'text'}
        className={className}
        onChange={this.handleOnChange}
        onFocus={this.handleOnFocus}
        onKeyDown={this.handleKeyDown}
        onBlur={this.handleOnBlur}
        value={this.renderValue()}
        disabled={disabled}
      />
    );
  }
}

export default ClinkInput;
