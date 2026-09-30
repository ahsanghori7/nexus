import React from 'react';
import { Dropdown, OpenDropdown, Image, CONSTANTS } from 'clink-components';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { StyledDropdownContent } from './styled';

const { expand } = CONSTANTS.s3;
const { darkCharcoal } = CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;

const CLinkDropdown = ({
  xOffset = -170,
  yOffset = 10,
  dropdownItems = [],
  dropdownContentWidth = 200,
  dropdownImage = expand,
  dropdownOpenImage = expand,
  alignOptions = 'left',
  dropdownCssClass = 'dropdown-content',
}) => {
  return (
    <Dropdown
      className="clink-dropdown-container"
      style={{ padding: '0' }}
      xOffset={xOffset}
      yOffset={yOffset}
      overflow="auto"
      dropdownContentWidth={dropdownContentWidth}
      renderOpenDropdown={({ isOpen, align, handleClick }) => (
        <OpenDropdown
          open={isOpen}
          align={align}
          handleClick={handleClick}
          downIcon={<Image src={dropdownImage} />}
          upIcon={<Image src={dropdownOpenImage} />}
        />
      )}
      content={
        <StyledDropdownContent
          className={`dropdown-content ${dropdownCssClass}`}
        >
          {Boolean(dropdownItems && dropdownItems.length) &&
            dropdownItems.map((item) => {
              const props = {};
              if (item.action) {
                props.onClick = () => {
                  if (item.action) {
                    item.action(item.id);
                  }
                };
              }
              if (item.link) {
                props.LinkComponent = Link;
                props.to = item.link;
                if (item.newTab) {
                  props.target = '_blank';
                }
              }
              return (
                <Button
                  sx={{
                    fontWeight: '300',
                    fontSiz: '14px',
                    fontFamily: proxima,
                    color: darkCharcoal,
                    borderBottom: '1px solid #E0E0E0',
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                  key={item.id}
                  align={alignOptions}
                  layout="dropdown"
                  {...props}
                >
                  {item.label}
                </Button>
              );
            })}
        </StyledDropdownContent>
      }
    />
  );
};

export default CLinkDropdown;
