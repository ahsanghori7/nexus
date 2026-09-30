import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { japaneseIndigo } = CONSTANTS.colors.general;
const { prosperBoxShadow } = CONSTANTS.colors.prosper;
const { MD_SCREEN } = CONSTANTS.dimensions;

const StyledFiltersContainer = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${prosperBoxShadow};
  border-radius: 5px;
  background-color: white;
  padding: 6px 6px 6px 22px;
  font-size: 13px;
  gap: 5px;

  @media (max-width: ${MD_SCREEN - 1}px) {
    justify-content: space-between;
    gap: 2px;
    width: 100%;
    box-sizing: border-box;
  }

  .label-filters {
    font-weight: bold;
    display: flex;
    min-width: 100px;
    color: ${japaneseIndigo};
  }
`;

export default StyledFiltersContainer;
