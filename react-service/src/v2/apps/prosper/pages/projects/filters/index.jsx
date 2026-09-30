import React from 'react';
import StyledFiltersContainer from './styles/Filters.styled';

const Filters = ({ children, filterTitle = 'Filters' }) => {
  return (
    <StyledFiltersContainer className="filters">
      <b className="label-filters">{filterTitle}:</b>
      {children}
    </StyledFiltersContainer>
  );
};

export default Filters;
