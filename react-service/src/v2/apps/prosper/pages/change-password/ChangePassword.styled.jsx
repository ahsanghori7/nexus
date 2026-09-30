import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { prosperBoxRed } = CONSTANTS.colors.prosper;
const { LG_SCREEN } = CONSTANTS.dimensions;

const LoaderWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;

  button {
    padding: 12px 20px;
  }

  span {
    position: absolute;
    left: 57px;
  }
`;

const PasswordWrapper = styled.div`
  max-width: 1330px;
  margin: 40px auto;

  .prosper-password--wrapper {
    .prosper-password--body {
      padding: 50px;

      @media (max-width: ${LG_SCREEN - 1}px) {
        padding: 36px 24px;
      }

      .clink-form__input {
        position: relative;

        label {
          font-size: 16px;
          color: ${prosperBoxRed};
          font-weight: bold;
          margin-bottom: 14px;
        }

        input {
          margin-bottom: 14px;
          border-radius: 6px;
          height: 48px;
          box-sizing: border-box;
        }

        .clink-form__error {
          font-size: 9px;
          position: absolute;
          bottom: 3px;
        }
      }
    }
  }
`;

export { LoaderWrapper, PasswordWrapper };
