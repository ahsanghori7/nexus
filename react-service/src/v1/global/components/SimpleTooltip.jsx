import Tooltip from 'react-bootstrap/Tooltip';
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import RedCross from '../public/images/svg/red-cross.svg';
import GreyCross from '../public/images/svg/grey-cross-icon.svg';

const Delete = (props) => {
  const { disabled, ...rest } = props;
  return <div {...rest}>{disabled ? <GreyCross /> : <RedCross />}</div>;
};
const renderTooltip = (props) => {
  const { className, content, ...rest } = props;
  return (
    <Tooltip
      id="button-tooltip"
      className={`simple-tooltip ${className}`}
      {...rest}
    >
      {content}
    </Tooltip>
  );
};

const SimpleTooltip = ({
  Component = Delete,
  componentProps = {
    onClick: (e) => e.preventDefault(),
    className: 'tooltip-content',
  },
  placement = 'top',
  content = 'Remove trade',
  className = '',
  delay = { show: 250, hide: 400 },
}) => {
  const tooltip = (props) => renderTooltip({ ...props, content, className });
  return (
    <OverlayTrigger placement={placement} delay={delay} overlay={tooltip}>
      <Component {...componentProps} />
    </OverlayTrigger>
  );
};

export default SimpleTooltip;
