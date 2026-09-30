import React, { forwardRef, useState, useEffect } from 'react';
import {
  Dropdown,
  OpenDropdown,
  Image,
  Button,
  CONSTANTS,
} from 'clink-components';
import StyledFilter from './styles/Filter.styled';

const { redCaretUp, redCaretDown } = CONSTANTS.s3;

const OpenDropdownComponent = forwardRef(
  ({ isOpen, setOpened, align, handleClick, downIcon, upIcon }, ref) => {
    useEffect(() => {
      setOpened(isOpen);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);
    return (
      <OpenDropdown
        ref={ref}
        open={isOpen}
        align={align}
        handleClick={handleClick}
        downIcon={<Image src={downIcon} />}
        upIcon={<Image src={upIcon} />}
      />
    );
  },
);

const Filter = forwardRef(
  (
    {
      content = null,
      label = '',
      className = 'filters',
      xOffset = 0,
      yOffset = 0,
      xOffsetScroll = 0,
      yOffsetScroll = 0,
      showArrowLeft,
      showArrowTop,
      downIcon = redCaretDown,
      upIcon = redCaretUp,
      dropdownContentWidth,
    },
    ref,
  ) => {
    const [opened, setOpened] = useState(false);
    const classNameVal = className
      ? `${className} filter-field`
      : 'filter-field';
    return (
      <StyledFilter
        className={
          opened ? `${classNameVal} filter-field--opened` : classNameVal
        }
      >
        {label}
        <Dropdown
          theme="prosper"
          overflow="auto"
          className={className ? `${className}--dropdown` : ''}
          content={content}
          xOffset={xOffset}
          yOffset={yOffset}
          xOffsetScroll={xOffsetScroll}
          yOffsetScroll={yOffsetScroll}
          dropdownContentWidth={dropdownContentWidth}
          showArrowLeft={showArrowLeft}
          showArrowTop={showArrowTop}
          renderOpenDropdown={({ isOpen, align, handleClick }) => (
            <OpenDropdownComponent
              ref={ref}
              setOpened={setOpened}
              isOpen={isOpen}
              align={align}
              handleClick={handleClick}
              downIcon={downIcon}
              upIcon={upIcon}
            />
          )}
        />
      </StyledFilter>
    );
  },
);

const FilterContent = ({ selected, options = [], handleClick = () => null }) =>
  [...options]
    .sort((itemA, itemB) =>
      itemA.label.toLowerCase().localeCompare(itemB.label.toLowerCase()),
    )
    .map((option) => (
      <Button
        className={
          selected && selected.label === option.label ? 'filter-selected' : ''
        }
        key={option.id}
        layout="dropdown-prosper"
        align="right"
        handleClick={() => handleClick(option)}
      >
        {option.label}
      </Button>
    ));

export default Filter;
export { FilterContent };
