import React from 'react';
import { Dropdown, OpenDropdown, Button } from 'clink-components';
import { goTo, goToNewTab } from 'v2/helpers/url';
import {
  StyledDropdownContent,
  StyledDropdownInterfaceDesktop,
} from './styled';

const CLinkDropdown = ({
  xOffset = -170,
  yOffset = 10,
  dropdownItems = [],
  dropdownContentWidth = 200,
  alignOptions = 'left',
  dropdownName,
  imageSrc,
  imageSrcHover,
}) => {
  return (
    <Dropdown
      className="project-nav-desktop-dropdown  clink-dropdown-container"
      style={{ padding: '0' }}
      xOffset={xOffset}
      yOffset={yOffset}
      overflow="auto"
      dropdownContentWidth={dropdownContentWidth}
      renderOpenDropdown={({
        isOpen,
        align,
        handleClick,
        handleOnMouseOver,
      }) => (
        <OpenDropdown
          open={isOpen}
          align={align}
          handleClick={handleClick}
          handleOnMouseOver={handleOnMouseOver}
          downIcon={
            <StyledDropdownInterfaceDesktop
              imageSrc={imageSrc}
              imageSrcHover={imageSrcHover}
            >
              {dropdownName}
            </StyledDropdownInterfaceDesktop>
          }
          upIcon={
            <StyledDropdownInterfaceDesktop
              imageSrc={imageSrc}
              imageSrcHover={imageSrcHover}
            >
              {dropdownName}
            </StyledDropdownInterfaceDesktop>
          }
        />
      )}
      content={
        <StyledDropdownContent className="dropdown-content">
          {Boolean(dropdownItems && dropdownItems.length) &&
            dropdownItems.map((item) => (
              <Button
                key={item.id}
                align={alignOptions}
                layout="dropdown"
                handleClick={() => {
                  if (item.action) {
                    item.action(item.id);
                  }
                  if (item.link) {
                    if (item.newTab) {
                      goToNewTab(item.link);
                    } else {
                      goTo(item.link);
                    }
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
        </StyledDropdownContent>
      }
    />
  );
};

export default CLinkDropdown;
