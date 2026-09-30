import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { lightPeriwinkle, clinkGreen, eerieBlack, clinkRed } =
  CONSTANTS.colors.general;
const { SM_SCREEN } = CONSTANTS.dimensions;

const StyledFlexCenter = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledForecastBudget = styled(StyledFlexCenter)`
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-top: 30px;
`;

const StyledForecastDownload = styled(StyledFlexCenter)`
  align-items: center;

  button {
    &.clink-button {
      max-width: 221px;.
      width: 100%;
      margin-top: 40px;
      margin-bottom: 113px;
    }
  }
`;

const StyledForecastProjectBudget = styled.div`
  display: flex;
  align-items: center;
  argin-bottom: 4px;

  @media (max-width: ${SM_SCREEN - 1}px) {
    flex-direction: column;
    width: 100%;
    margin-bottom: 30px;
  }
`;

const StyledForecastProjectNumber = styled.div`
  border: 1px solid transparent;
  width: 200px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  height: 40px;
  align-items: center;
  border-radius: 4px;
  padding: 6px 30px 6px 12px;
  margin-left: 10px;
  font-weight: 600;
  color: ${eerieBlack};

  ${(props) =>
    props.bordered && `border-color: ${lightPeriwinkle}; color: ${eerieBlack};`}

  ${(props) =>
    props.profitValue && props.profitValue < 0 && `color: ${clinkRed};`}

    ${(props) =>
    props.profitValue && props.profitValue > 0 && `color: ${clinkGreen};`}
`;

const StyledForecastContainer = styled.div`
  width: 100%;

  table {
    .clink-form__input {
      position: relative;

      input.forecast-budget-input {
        text-indent: 6px;
        outline: 0;
      }

      &:after {
        ${(p) => p.content && `content: '${p.content}'; `}
        position: absolute;
        left: 7px;
        top: 5px;
        font-size: 16px;
        white-space: nowrap;
      }
    }
  }
`;

export {
  StyledForecastBudget,
  StyledForecastDownload,
  StyledForecastProjectBudget,
  StyledForecastProjectNumber,
  StyledForecastContainer,
};
