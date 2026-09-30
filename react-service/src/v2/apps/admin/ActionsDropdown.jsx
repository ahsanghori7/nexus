import React from 'react';
import PropTypes from 'prop-types';
import {
  Dropdown,
  OpenDropdown,
  Image,
  Justify,
  CONSTANTS,
} from 'clink-components';

const { blackCarretDown, blackCarretUp } = CONSTANTS.s3;

const ActionsDropdown = ({
  content,
  className = '',
  downIcon = blackCarretDown,
  upIcon = blackCarretUp,
}) => (
  <Justify>
    <Dropdown
      xOffset={-198}
      className={className}
      content={content}
      renderOpenDropdown={({ isOpen, align, handleClick }) => (
        <OpenDropdown
          open={isOpen}
          align={align}
          handleClick={handleClick}
          downIcon={<Image src={downIcon} />}
          upIcon={<Image src={upIcon} />}
          data-testid="actions-dropdown-trigger"
        />
      )}
    />
  </Justify>
);

ActionsDropdown.propTypes = {
  content: PropTypes.node.isRequired,
  className: PropTypes.string,
  downIcon: PropTypes.string,
  upIcon: PropTypes.string,
};

export default ActionsDropdown;
