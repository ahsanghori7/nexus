import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import BTooltip from 'react-bootstrap/Tooltip';
import React from 'react';
import GreenButton from 'v1/global/components/general-ui/Buttons';

// TODO: To delete & use MUI
const Tooltip = ({ message, children }) => (
  <OverlayTrigger
    placement="top"
    delay={{ show: 10, hide: 50 }}
    overlay={<BTooltip id={message}>{message}</BTooltip>}
  >
    {children}
  </OverlayTrigger>
);

export { Tooltip, GreenButton };
