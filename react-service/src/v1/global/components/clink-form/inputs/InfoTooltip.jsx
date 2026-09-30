import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const InfoTooltip = ({ info }) => {
  return (
    <OverlayTrigger
      className="info-tooltip"
      placement="top"
      overlay={<Tooltip>{info}</Tooltip>}
    >
      {({ ref, ...triggerHandler }) => (
        <Button
          variant="light"
          className="info-tooltip-btn"
          {...triggerHandler}
        >
          <FontAwesomeIcon forwardedRef={ref} icon={faQuestionCircle} />
        </Button>
      )}
    </OverlayTrigger>
  );
};

export default InfoTooltip;
