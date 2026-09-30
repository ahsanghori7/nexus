import React from 'react';
import Chip from '@mui/material/Chip';
import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';
import LazyImage from '../../../components/LazyImage';

const { iconLinkBlack } = CONSTANTS.s3;
const { clinkGreen, clinkGray } = CONSTANTS.colors.general;

const StyledDiv = styled.div`
  margin-left: 15px;
  margin-top: 5px;
  display: flex;
  align-items: center;
`;

const StyledSpan = styled.span`
  color: ${clinkGray};
  ${(p) =>
    p.green &&
    `
    color: ${clinkGreen};
    margin: 0 5px;
  `}
`;

const Dependency = ({
  tid = 0,
  date = 0,
  currentDependencies = [],
  selectedTenders = {},
}) => {
  if (
    !(
      selectedTenders &&
      selectedTenders.length &&
      currentDependencies &&
      currentDependencies[tid] &&
      currentDependencies[tid].length
    )
  ) {
    return null;
  }
  return currentDependencies[tid].map((d, index) => {
    const [tender] = selectedTenders.filter((t) => t.id === d.tender_child_id);
    if (!tender || date !== d.tender_dependency_child_key || index) {
      return null;
    }
    return (
      <StyledDiv key={d.tender_child_id}>
        <LazyImage
          src={iconLinkBlack}
          alt="iconLinkBlack"
          height={17}
          width={17}
          style={{ transform: 'translate(0, -5px)' }}
        />{' '}
        {currentDependencies[tid].length > 1 && (
          <Chip
            label={currentDependencies[tid].length}
            size="small"
            sx={{
              marginLeft: 0.5,
              minWidth: '31px',
              height: '16px',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          />
        )}
        <StyledSpan green>Dependency</StyledSpan>
        <StyledSpan>{tender.label}</StyledSpan>
      </StyledDiv>
    );
  });
};

export default Dependency;
